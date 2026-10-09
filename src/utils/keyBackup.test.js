import test from 'node:test';
import assert from 'node:assert/strict';
import { createEncryptedKeyBackup, restoreEncryptedKeyBackup } from './keyBackup.js';

const createExtractablePair = async () => {
  const encryption = await crypto.subtle.generateKey(
    { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['encrypt', 'decrypt'],
  );
  const signing = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  return {
    privateKey: encryption.privateKey,
    publicKey: encryption.publicKey,
    signingPrivateKey: signing.privateKey,
    signingPublicKey: signing.publicKey,
    serializedPublicKey: JSON.stringify(await crypto.subtle.exportKey('jwk', encryption.publicKey)),
    serializedSigningPublicKey: JSON.stringify(await crypto.subtle.exportKey('jwk', signing.publicKey)),
    keyVersion: 1,
  };
};

test('encrypted recovery backup restores the same identity keys on another device', async () => {
  const original = await createExtractablePair();
  const recoveryPhrase = 'river amber lantern meadow orbit cedar';
  const backup = await createEncryptedKeyBackup(original, 'account-123', recoveryPhrase);
  const restored = await restoreEncryptedKeyBackup(
    backup,
    'account-123',
    recoveryPhrase,
    original.serializedPublicKey,
    original.serializedSigningPublicKey,
  );

  assert.equal(restored.privateKey.extractable, true);
  assert.equal(restored.signingPrivateKey.extractable, true);
  assert.deepEqual(
    await crypto.subtle.exportKey('jwk', restored.privateKey),
    await crypto.subtle.exportKey('jwk', original.privateKey),
  );
  assert.deepEqual(
    await crypto.subtle.exportKey('jwk', restored.signingPrivateKey),
    await crypto.subtle.exportKey('jwk', original.signingPrivateKey),
  );
});

test('wrong recovery phrase and different account keys cannot restore a backup', async () => {
  const original = await createExtractablePair();
  const other = await createExtractablePair();
  const backup = await createEncryptedKeyBackup(original, 'account-123', 'river amber lantern meadow orbit cedar');

  await assert.rejects(
    () => restoreEncryptedKeyBackup(backup, 'account-123', 'another incorrect recovery phrase', original.serializedPublicKey, original.serializedSigningPublicKey),
    /did not unlock/,
  );
  await assert.rejects(
    () => restoreEncryptedKeyBackup(backup, 'account-123', 'river amber lantern meadow orbit cedar', other.serializedPublicKey, other.serializedSigningPublicKey),
    /does not match/,
  );
});

test('legacy non-exportable device keys are never silently backed up or replaced', async () => {
  const legacyPair = await createExtractablePair();
  const nonExportableEncryption = await crypto.subtle.importKey(
    'jwk',
    await crypto.subtle.exportKey('jwk', legacyPair.privateKey),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt'],
  );

  await assert.rejects(
    () => createEncryptedKeyBackup({ ...legacyPair, privateKey: nonExportableEncryption }, 'account-123', 'river amber lantern meadow orbit cedar'),
    /legacy non-exportable format/,
  );
});
