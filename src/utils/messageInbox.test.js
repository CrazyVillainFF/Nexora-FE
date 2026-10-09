import test from 'node:test';
import assert from 'node:assert/strict';
import { sortContactsByRecentConversations } from './messageInbox.js';

test('recent conversations sort ahead of accepted connections without chats', () => {
  const contacts = [{ _id: 'new' }, { _id: 'older' }, { _id: 'recent' }];
  const conversations = [
    { peer: { _id: 'recent' } },
    { peer: { _id: 'older' } },
  ];

  assert.deepEqual(
    sortContactsByRecentConversations(contacts, conversations).map(({ _id }) => _id),
    ['recent', 'older', 'new'],
  );
});

test('accepted connections without conversations retain their existing order', () => {
  const contacts = [{ _id: 'one' }, { _id: 'two' }, { _id: 'three' }];
  assert.deepEqual(sortContactsByRecentConversations(contacts, []), contacts);
});
