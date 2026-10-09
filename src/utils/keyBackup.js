const BACKUP_FORMAT_VERSION = 1;
const KDF_ITERATIONS = 600_000;
const MIN_PASSPHRASE_LENGTH = 16;
const encoder = new TextEncoder();

const toBase64 = (bytes) => {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
};

const fromBase64 = (value) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
const parseJwk = (value) => typeof value === 'string' ? JSON.parse(value) : value;
const sortJwk = (jwk) => Object.fromEntries(Object.entries(jwk).sort(([left], [right]) => left.localeCompare(right)));

export const getBackupIdentityFingerprint = async (publicKey, signingPublicKey) => {
  const canonical = JSON.stringify([sortJwk(parseJwk(publicKey)), sortJwk(parseJwk(signingPublicKey))]);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(canonical)));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const deriveBackupKey = async (passphrase, salt) => {
  const passphraseKey = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: KDF_ITERATIONS },
    passphraseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
};

const getAdditionalData = (userId, fingerprint) => encoder.encode(`nexora-key-backup-v1:${userId}:${fingerprint}`);

export const createEncryptedKeyBackup = async (devicePair, userId, passphrase) => {
  if (!userId) throw new Error('Sign in before creating a recovery backup.');
  if (typeof passphrase !== 'string' || passphrase.length < MIN_PASSPHRASE_LENGTH) {
    throw new Error(`Use a unique recovery passphrase with at least ${MIN_PASSPHRASE_LENGTH} characters.`);
  }
  if (!Number.isInteger(devicePair.keyVersion) || devicePair.keyVersion < 1) {
    throw new Error('The account key version is not available. Reload Messages and try again.');
  }
  if (!devicePair?.privateKey?.extractable || !devicePair?.signingPrivateKey?.extractable) {
    throw new Error('This device key was created in legacy non-exportable format and cannot be backed up. Keep using this device to preserve access.');
  }

  const fingerprint = await getBackupIdentityFingerprint(devicePair.serializedPublicKey, devicePair.serializedSigningPublicKey);
  const bundle = {
    formatVersion: BACKUP_FORMAT_VERSION,
    userId: userId.toString(),
    publicKeyFingerprint: fingerprint,
    publicKey: devicePair.serializedPublicKey,
    signingPublicKey: devicePair.serializedSigningPublicKey,
    privateKey: await crypto.subtle.exportKey('jwk', devicePair.privateKey),
    signingPrivateKey: await crypto.subtle.exportKey('jwk', devicePair.signingPrivateKey),
  };
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveBackupKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: getAdditionalData(userId, fingerprint), tagLength: 128 },
    key,
    encoder.encode(JSON.stringify(bundle)),
  );

  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    keyVersion: devicePair.keyVersion,
    publicKeyFingerprint: fingerprint,
    kdf: 'PBKDF2-SHA-256',
    iterations: KDF_ITERATIONS,
    cipher: 'AES-256-GCM',
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  };
};

export const restoreEncryptedKeyBackup = async (backup, userId, passphrase, publicKey, signingPublicKey) => {
  if (!backup || backup.formatVersion !== BACKUP_FORMAT_VERSION || backup.kdf !== 'PBKDF2-SHA-256' ||
      backup.iterations !== KDF_ITERATIONS || backup.cipher !== 'AES-256-GCM') {
    throw new Error('This recovery backup is unsupported or has been damaged.');
  }
  const fingerprint = await getBackupIdentityFingerprint(publicKey, signingPublicKey);
  if (fingerprint !== backup.publicKeyFingerprint) {
    throw new Error('This recovery backup does not match the encryption keys registered to this account.');
  }

  let plaintext;
  try {
    const key = await deriveBackupKey(passphrase, fromBase64(backup.salt));
    plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(backup.iv), additionalData: getAdditionalData(userId, fingerprint), tagLength: 128 },
      key,
      fromBase64(backup.ciphertext),
    );
  } catch {
    throw new Error('That recovery passphrase did not unlock this backup. Check the passphrase and try again.');
  }

  let bundle;
  try {
    bundle = JSON.parse(new TextDecoder().decode(plaintext));
    if (bundle.formatVersion !== BACKUP_FORMAT_VERSION || bundle.userId !== userId.toString() ||
        bundle.publicKeyFingerprint !== fingerprint || bundle.publicKey !== publicKey || bundle.signingPublicKey !== signingPublicKey) {
      throw new Error('Backup identity mismatch.');
    }
  } catch {
    throw new Error('This recovery backup could not be validated for this account.');
  }

  try {
    const [privateKey, signingPrivateKey, publicEncryptionKey, publicSigningKey] = await Promise.all([
      crypto.subtle.importKey('jwk', bundle.privateKey, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['decrypt']),
      crypto.subtle.importKey('jwk', bundle.signingPrivateKey, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']),
      crypto.subtle.importKey('jwk', parseJwk(publicKey), { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['encrypt']),
      crypto.subtle.importKey('jwk', parseJwk(signingPublicKey), { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']),
    ]);
    return {
      privateKey,
      publicKey: publicEncryptionKey,
      serializedPublicKey: publicKey,
      signingPrivateKey,
      signingPublicKey: publicSigningKey,
      serializedSigningPublicKey: signingPublicKey,
      keyVersion: backup.keyVersion,
    };
  } catch {
    throw new Error('This recovery backup contains invalid key material and was not installed.');
  }
};

export const keyBackupConstants = Object.freeze({
  formatVersion: BACKUP_FORMAT_VERSION,
  iterations: KDF_ITERATIONS,
  minimumPassphraseLength: MIN_PASSPHRASE_LENGTH,
});
