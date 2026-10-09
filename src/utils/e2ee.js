const DATABASE = 'nexora-device-keys';
const STORE = 'rsa-key-pairs';
const keySetupPromises = new Map();

const getDatabase = () => new Promise((resolve, reject) => {
  if (!globalThis.indexedDB || !globalThis.crypto?.subtle) {
    reject(new Error('Encrypted messages require a modern browser on HTTPS or localhost.'));
    return;
  }
  const request = indexedDB.open(DATABASE, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(STORE);
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(new Error('Could not access this device’s encryption-key storage.'));
});

const withStore = async (mode, action) => {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = action(transaction.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Could not read this device’s encryption key.'));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(new Error('Could not save this device’s encryption key.'));
  });
};

export const getDeviceKeyPair = (userId) => withStore('readonly', (store) => store.get(userId));
export const saveDeviceKeyPair = (userId, pair) => withStore('readwrite', (store) => store.put(pair, userId));

export const createDeviceKeyPair = async (userId) => {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['encrypt', 'decrypt']
  );
  const publicJwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const serializedPublicKey = JSON.stringify(publicJwk);
  const signingPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const signingPublicJwk = await crypto.subtle.exportKey('jwk', signingPair.publicKey);
  const serializedSigningPublicKey = JSON.stringify(signingPublicJwk);
  const devicePair = {
    privateKey: pair.privateKey,
    publicKey: pair.publicKey,
    serializedPublicKey,
    signingPrivateKey: signingPair.privateKey,
    signingPublicKey: signingPair.publicKey,
    serializedSigningPublicKey,
  };
  await saveDeviceKeyPair(userId, devicePair);
  return devicePair;
};

export const ensureDeviceKeyPair = (userId, messageAPI) => {
  const accountId = userId?.toString();
  if (!accountId) return Promise.reject(new Error('Sign in before setting up encrypted messages.'));
  if (keySetupPromises.has(accountId)) return keySetupPromises.get(accountId);

  const runSetup = async () => {
    const [serverKey, savedPair] = await Promise.all([
      messageAPI.getOwnKey(),
      getDeviceKeyPair(accountId)
    ]);
    let devicePair = savedPair;
    const hasServerKey = Boolean(serverKey.data.publicKey || serverKey.data.signingPublicKey);

    if (hasServerKey && !devicePair) {
      throw new Error('This browser does not have the private key for existing encrypted messages. They cannot be recovered on a new device.');
    }
    if (hasServerKey && (!serverKey.data.publicKey || !serverKey.data.signingPublicKey)) {
      throw new Error('The account encryption keys are incomplete. Encrypted messaging is paused for safety.');
    }
    if (!devicePair) devicePair = await createDeviceKeyPair(accountId);

    if (!hasServerKey) {
      const savedKey = await messageAPI.saveOwnKey(devicePair.serializedPublicKey, devicePair.serializedSigningPublicKey);
      devicePair.keyVersion = savedKey.data.keyVersion;
      await saveDeviceKeyPair(accountId, devicePair);
    } else if (devicePair.serializedPublicKey !== serverKey.data.publicKey ||
        devicePair.serializedSigningPublicKey !== serverKey.data.signingPublicKey) {
      throw new Error('This browser key does not match the account key. Encrypted messaging is paused for safety.');
    } else {
      devicePair.keyVersion = serverKey.data.keyVersion;
      if (savedPair.keyVersion !== devicePair.keyVersion) await saveDeviceKeyPair(accountId, devicePair);
    }

    return devicePair;
  };
  const setup = globalThis.navigator?.locks?.request
    ? navigator.locks.request(`nexora-device-key-${accountId}`, runSetup)
    : runSetup();

  keySetupPromises.set(accountId, setup);
  setup.finally(() => {
    if (keySetupPromises.get(accountId) === setup) keySetupPromises.delete(accountId);
  }).catch(() => {});
  return setup;
};

const decodeJwk = async (serialized) => {
  const jwk = typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
  return crypto.subtle.importKey('jwk', jwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['encrypt']);
};

const toBase64 = (bytes) => {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
};

const fromBase64 = (value) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

export const encryptForConversation = async (text, participants, conversationId, senderId, signingPrivateKey) => {
  const aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    new TextEncoder().encode(text)
  );
  const wrappedKeys = await Promise.all(participants.map(async (participant) => {
    if (!participant.encryptionPublicKey) throw new Error('Both participants need a registered encryption key.');
    const key = await decodeJwk(participant.encryptionPublicKey);
    const rawKey = await crypto.subtle.exportKey('raw', aesKey);
    const wrapped = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, rawKey);
    return { user: participant._id, value: toBase64(new Uint8Array(wrapped)) };
  }));

  const payload = {
    ciphertext: toBase64(new Uint8Array(ciphertext)),
    iv: toBase64(iv),
    wrappedKeys: wrappedKeys.sort((left, right) => left.user.localeCompare(right.user)),
  };
  const signedContent = JSON.stringify({
    conversationId: conversationId.toString(),
    senderId: senderId.toString(),
    ciphertext: payload.ciphertext,
    iv: payload.iv,
    wrappedKeys: payload.wrappedKeys,
  });
  payload.signature = toBase64(new Uint8Array(await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingPrivateKey,
    new TextEncoder().encode(signedContent)
  )));
  return payload;
};

export const decryptMessage = async (message, userId, privateKey, signingPublicKey) => {
  if (!signingPublicKey) throw new Error('This sender has no registered signing key.');
  const signingJwk = typeof signingPublicKey === 'string' ? JSON.parse(signingPublicKey) : signingPublicKey;
  const verificationKey = await crypto.subtle.importKey('jwk', signingJwk, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']);
  const signedContent = JSON.stringify({
    conversationId: message.conversation.toString(),
    senderId: message.sender.toString(),
    ciphertext: message.ciphertext,
    iv: message.iv,
    wrappedKeys: [...message.wrappedKeys].sort((left, right) => left.user.toString().localeCompare(right.user.toString())).map(({ user, value }) => ({ user: user.toString(), value })),
  });
  const validSignature = await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    verificationKey,
    fromBase64(message.signature),
    new TextEncoder().encode(signedContent)
  );
  if (!validSignature) throw new Error('The sender signature could not be verified.');

  const wrappedKey = message.wrappedKeys.find((entry) => entry.user.toString() === userId.toString());
  if (!wrappedKey) throw new Error('This message was not encrypted for this device account.');
  const rawKey = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, fromBase64(wrappedKey.value));
  const aesKey = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['decrypt']);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(message.iv) },
    aesKey,
    fromBase64(message.ciphertext)
  );
  return new TextDecoder().decode(plaintext);
};

export const getKeyFingerprint = async (serializedPublicKey, serializedSigningPublicKey) => {
  const jwk = JSON.parse(serializedPublicKey);
  const signingJwk = JSON.parse(serializedSigningPublicKey);
  const stable = JSON.stringify([
    Object.fromEntries(Object.entries(jwk).sort(([left], [right]) => left.localeCompare(right))),
    Object.fromEntries(Object.entries(signingJwk).sort(([left], [right]) => left.localeCompare(right))),
  ]);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(stable)));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('').match(/.{1,4}/g).join(' ');
};
