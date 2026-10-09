import test from 'node:test';
import assert from 'node:assert/strict';
import { decryptMessage, encryptForConversation } from './e2ee.js';

const makeEncryptionIdentity = async () => {
  const encryption = await crypto.subtle.generateKey(
    { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    false,
    ['encrypt', 'decrypt']
  );
  const signing = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify']);
  return {
    encryption,
    signing,
    encryptionPublicKey: JSON.stringify(await crypto.subtle.exportKey('jwk', encryption.publicKey)),
    signingPublicKey: JSON.stringify(await crypto.subtle.exportKey('jwk', signing.publicKey)),
  };
};

test('messages are ciphertext on the server and only the addressed devices decrypt', async () => {
  const sender = await makeEncryptionIdentity();
  const receiver = await makeEncryptionIdentity();
  const cleartext = 'private project details';
  const payload = await encryptForConversation(cleartext, [
    { _id: 'sender-id', encryptionPublicKey: sender.encryptionPublicKey },
    { _id: 'receiver-id', encryptionPublicKey: receiver.encryptionPublicKey },
  ], 'conversation-id', 'sender-id', sender.signing.privateKey);

  assert.equal(JSON.stringify(payload).includes(cleartext), false);
  const storedMessage = { ...payload, conversation: 'conversation-id', sender: 'sender-id' };
  assert.equal(await decryptMessage(storedMessage, 'receiver-id', receiver.encryption.privateKey, sender.signingPublicKey), cleartext);
  await assert.rejects(() => decryptMessage(storedMessage, 'other-id', receiver.encryption.privateKey, sender.signingPublicKey));
});

test('modified ciphertext fails sender-signature verification', async () => {
  const sender = await makeEncryptionIdentity();
  const receiver = await makeEncryptionIdentity();
  const payload = await encryptForConversation('signed content', [
    { _id: 'sender-id', encryptionPublicKey: sender.encryptionPublicKey },
    { _id: 'receiver-id', encryptionPublicKey: receiver.encryptionPublicKey },
  ], 'conversation-id', 'sender-id', sender.signing.privateKey);
  const altered = { ...payload, conversation: 'conversation-id', sender: 'sender-id', ciphertext: `${payload.ciphertext.slice(0, -2)}AA` };

  await assert.rejects(() => decryptMessage(altered, 'receiver-id', receiver.encryption.privateKey, sender.signingPublicKey));
});
