import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Avatar, Box, Button, CircularProgress, Container, Divider, IconButton, InputAdornment, List,
  ListItemButton, ListItemAvatar, ListItemText, Paper, Skeleton, Stack, TextField,
  Typography, useMediaQuery
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import EmojiPickerControl from '../components/EmojiPickerControl';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { messageAPI } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { decryptMessage, getDeviceKeyPair } from '../utils/e2ee';
import { sortContactsByRecentConversations } from '../utils/messageInbox';

const formatTimestamp = (value) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
const formatConversationTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date)
    : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
};

const MessagesPage = () => {
  const { user } = useAuth();
  const { markConversationMessagesRead } = useNotifications();
  const navigate = useNavigate();
  const userId = user?._id;
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('md'));
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [privateKey, setPrivateKey] = useState(null);
  const [ownSigningPublicKey, setOwnSigningPublicKey] = useState('');
  const [backupPrompt, setBackupPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const bottomRef = useRef(null);
  const searchRef = useRef(null);
  const composerInputRef = useRef(null);
  const legacySyncsRef = useRef(new Set());
  const legacyTextCacheRef = useRef(new Map());
  const legacyDecryptPromisesRef = useRef(new Map());
  const selectedConversationId = useRef(null);
  const messageRequestId = useRef(0);
  const openRequestId = useRef(0);

  const loadMessages = useCallback(async (conversationId, key, peerSigningPublicKey) => {
    if (!userId) return;
    const requestId = ++messageRequestId.current;
    try {
      const response = await messageAPI.getMessages(conversationId);
      const fetchedMessages = response.data.messages || [];
      if (requestId !== messageRequestId.current || selectedConversationId.current !== conversationId) return;
      markConversationMessagesRead(conversationId);
      const legacyMessages = fetchedMessages.filter((message) => (
        typeof message.text !== 'string' && !legacyTextCacheRef.current.has(String(message._id))
      ));
      setMessages(fetchedMessages.map((message) => (
        typeof message.text === 'string'
          ? { ...message, decryptError: false }
          : legacyTextCacheRef.current.has(String(message._id))
            ? { ...message, text: legacyTextCacheRef.current.get(String(message._id)), decryptError: false }
          : { ...message, text: key ? 'Decrypting older message…' : 'This older encrypted message is only available on the device where it was created.', decryptError: !key, pendingDecryption: Boolean(key) }
      )));
      setLoadingMessages(false);
      if (!key || legacyMessages.length === 0) return;

      const legacyToSync = [];
      const decryptedLegacy = await Promise.all(legacyMessages.map(async (message) => {
        const messageId = String(message._id);
        let decryptPromise = legacyDecryptPromisesRef.current.get(messageId);
        if (!decryptPromise) {
          const senderSigningKey = message.sender.toString() === userId.toString()
            ? ownSigningPublicKey
            : peerSigningPublicKey;
          decryptPromise = decryptMessage(message, userId, key, senderSigningKey)
            .then((text) => {
              legacyTextCacheRef.current.set(messageId, text);
              return { text, decryptError: false };
            })
            .catch(() => ({ text: 'Unable to decrypt on this device.', decryptError: true }))
            .finally(() => legacyDecryptPromisesRef.current.delete(messageId));
          legacyDecryptPromisesRef.current.set(messageId, decryptPromise);
        }
        const result = await decryptPromise;
        if (!result.decryptError) legacyToSync.push({ id: message._id, text: result.text });
        return { id: message._id, ...result, pendingDecryption: false };
      }));
      if (requestId !== messageRequestId.current || selectedConversationId.current !== conversationId) return;
      const decryptedById = new Map(decryptedLegacy.map((message) => [String(message.id), message]));
      setMessages((existing) => existing.map((message) => {
        const decryptedMessage = decryptedById.get(String(message._id));
        return decryptedMessage ? { ...message, ...decryptedMessage } : message;
      }));
      const unsynced = legacyToSync.filter(({ id }) => !legacySyncsRef.current.has(String(id)));
      if (unsynced.length) {
        unsynced.forEach(({ id }) => legacySyncsRef.current.add(String(id)));
        messageAPI.syncLegacyMessages(conversationId, unsynced).catch(() => {
          unsynced.forEach(({ id }) => legacySyncsRef.current.delete(String(id)));
        });
      }
    } catch (requestError) {
      if (requestId !== messageRequestId.current || selectedConversationId.current !== conversationId) return;
      setError(requestError.message || 'Unable to load this conversation.');
      setLoadingMessages(false);
    }
  }, [userId, ownSigningPublicKey, markConversationMessagesRead]);

  useEffect(() => {
    let cancelled = false;
    const initialize = async () => {
      try {
        setLoading(true);
        setError('');
        const [contactResponse, conversationResponse] = await Promise.all([
          messageAPI.getContacts(),
          messageAPI.getConversations()
        ]);
        if (cancelled) return;
        const nextContacts = contactResponse.data.contacts || [];
        setContacts(nextContacts);
        setConversations(conversationResponse.data.conversations || []);

        // Try the old local key only to display legacy encrypted history. New chats do not use it.
        let devicePairForPrompt = null;
        try {
          const devicePair = await getDeviceKeyPair(user._id);
          devicePairForPrompt = devicePair;
          if (!cancelled && devicePair) {
            setPrivateKey(devicePair.privateKey);
            setOwnSigningPublicKey(devicePair.serializedSigningPublicKey);
          }
        } catch {
          // Account-synced chats remain usable even when this browser has no local legacy key store.
        }
        try {
          const backupResponse = await messageAPI.getOwnKeyBackups();
          if (!cancelled) {
            const hasBackup = (backupResponse.data.backups || []).length > 0;
            const canCreateBackup = Boolean(devicePairForPrompt?.privateKey?.extractable && devicePairForPrompt?.signingPrivateKey?.extractable);
            setBackupPrompt(hasBackup && !devicePairForPrompt ? 'restore' : canCreateBackup && !hasBackup ? 'save' : '');
          }
        } catch {
          // The chat remains available even if backup status cannot be checked.
        }
      } catch (initializationError) {
        if (!cancelled) {
          const message = initializationError.message || 'Messages could not be loaded.';
          if (/not authorized|please sign in|session has expired|invalid authorization token/i.test(message)) {
            navigate('/signin', { replace: true, state: { from: { pathname: '/messages' } } });
            return;
          }
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (user?._id) initialize();
    return () => { cancelled = true; };
  }, [user?._id, navigate]);

  useEffect(() => {
    const selectedConversation = active;
    if (!selectedConversation) return undefined;
    loadMessages(selectedConversation._id, privateKey, selectedConversation.peer.encryptionSigningPublicKey);
    const interval = window.setInterval(async () => {
      loadMessages(selectedConversation._id, privateKey, selectedConversation.peer.encryptionSigningPublicKey);
      try {
        const response = await messageAPI.getConversations();
        if (selectedConversationId.current === selectedConversation._id) {
          setConversations(response.data.conversations || []);
        }
      } catch {
        // The open conversation remains usable if refreshing the inbox list fails.
      }
    }, 6000);
    return () => {
      window.clearInterval(interval);
      messageRequestId.current += 1;
    };
  }, [active, privateKey, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages.length]);

  const openConversation = useCallback(async (contact) => {
    const requestId = ++openRequestId.current;
    const cachedConversation = conversations.find((conversation) => String(conversation.peer?._id) === String(contact._id));
    if (cachedConversation) {
      if (String(active?._id) === String(cachedConversation._id)) return;
      setError('');
      messageRequestId.current += 1;
      selectedConversationId.current = cachedConversation._id;
      setMessages([]);
      setLoadingMessages(true);
      setActive({ ...cachedConversation, peer: { ...contact, ...cachedConversation.peer } });
      return;
    }
    try {
      setError('');
      selectedConversationId.current = null;
      messageRequestId.current += 1;
      setActive(null);
      setMessages([]);
      setLoadingMessages(true);
      const response = await messageAPI.openConversation(contact._id);
      if (requestId !== openRequestId.current) return;
      setMessages([]);
      setLoadingMessages(true);
      const conversation = { ...response.data.conversation, peer: { ...contact, ...response.data.conversation.peer } };
      selectedConversationId.current = conversation._id;
      setActive(conversation);
    } catch (openError) {
      if (requestId !== openRequestId.current) return;
      setError(openError.message || 'Could not open this conversation.');
    }
  }, [active?._id, conversations]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = (composerInputRef.current?.value || draft).trim();
    if (!text || !active || sending) return;
    const activeConversation = active;
    const previousConversation = conversations.find((conversation) => conversation._id === activeConversation._id);
    const temporaryId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const sentAt = new Date().toISOString();
    const optimisticMessage = {
      _id: temporaryId,
      conversation: activeConversation._id,
      sender: user._id,
      text,
      createdAt: sentAt,
      readBy: [user._id],
      pending: true,
    };

    // Render immediately; confirm or roll back the bubble after the server responds.
    if (selectedConversationId.current === activeConversation._id) {
      setMessages((existing) => [...existing, optimisticMessage]);
    }
    setDraft('');
    if (composerInputRef.current) composerInputRef.current.value = '';
    setConversations((existing) => [
      { _id: activeConversation._id, peer: activeConversation.peer, lastMessageAt: sentAt, lastMessage: { sender: user._id, text, createdAt: sentAt } },
      ...existing.filter((conversation) => conversation._id !== activeConversation._id)
    ]);
    try {
      setSending(true);
      setError('');
      const response = await messageAPI.sendMessage(activeConversation._id, { text });
      const savedMessage = response.data.message;
      if (selectedConversationId.current === activeConversation._id) setMessages((existing) => {
        const withoutPendingOrDuplicate = existing.filter((message) => (
          message._id !== temporaryId && String(message._id) !== String(savedMessage._id)
        ));
        return [...withoutPendingOrDuplicate, savedMessage];
      });
    } catch (sendError) {
      if (selectedConversationId.current === activeConversation._id) {
        setMessages((existing) => existing.filter((message) => message._id !== temporaryId));
      }
      setConversations((existing) => previousConversation
        ? [previousConversation, ...existing.filter((conversation) => conversation._id !== activeConversation._id)]
        : existing.filter((conversation) => conversation._id !== activeConversation._id));
      setDraft((current) => current ? `${text}\n${current}`.slice(0, 5000) : text);
      setError(sendError.message || 'The message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const orderedContacts = useMemo(() => {
    return sortContactsByRecentConversations(contacts, conversations);
  }, [contacts, conversations]);

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return orderedContacts;
    return orderedContacts.filter((contact) => `${contact.name || ''} ${contact.headline || ''}`.toLocaleLowerCase().includes(query));
  }, [orderedContacts, search]);

  const handleComposerKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ minWidth: 0 }}>
        <Skeleton variant="text" width={190} height={42} sx={{ mb: 2 }} />
        <Paper variant="outlined" sx={{ height: { xs: 'min(68dvh, 640px)', md: 'min(72dvh, 760px)' }, minHeight: { xs: 400, md: 520 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '360px minmax(0, 1fr)' }, overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderRight: { md: 1 }, borderColor: 'divider' }}>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="rounded" height={42} sx={{ my: 2 }} />
            {[0, 1, 2, 3].map((item) => <Stack key={item} direction="row" spacing={1.5} alignItems="center" sx={{ py: 1.25 }}><Skeleton variant="circular" width={48} height={48} /><Box sx={{ flex: 1 }}><Skeleton variant="text" width="55%" /><Skeleton variant="text" width="80%" /></Box></Stack>)}
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'grid' }, placeItems: 'center' }}><Skeleton variant="circular" width={48} height={48} /></Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ minWidth: 0 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
        <ChatBubbleOutlineRoundedIcon color="primary" />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" fontWeight={800}>Messages</Typography>
          <Typography variant="body2" color="text.secondary">Chat with your accepted connections on any device after you sign in</Typography>
        </Box>
      </Stack>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      {backupPrompt && (
        <Alert
          severity="info"
          sx={{ mb: 1.5, py: 0, alignItems: 'center', '& .MuiAlert-message': { py: 0.75 } }}
          action={<Button color="inherit" size="small" onClick={() => navigate('/settings#message-backup')}>Setup</Button>}
        >{backupPrompt === 'restore' ? 'Restore your saved recovery backup for older encrypted messages in Settings.' : 'Save a recovery backup for older encrypted messages in Settings.'}</Alert>
      )}
      <Paper
        variant="outlined"
        sx={{
          display: 'grid',
          gridTemplateColumns: mobile && active ? 'minmax(0, 1fr)' : { xs: 'minmax(0, 1fr)', md: '360px minmax(0, 1fr)' },
          height: { xs: 'min(68dvh, 640px)', md: 'min(72dvh, 760px)' },
          minHeight: { xs: 400, md: 520 },
          overflow: 'hidden',
          borderRadius: 3,
          bgcolor: 'background.paper',
        }}
      >
        {(!mobile || !active) && (
          <Box sx={{ borderRight: { md: 1 }, borderColor: 'divider', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ px: 2, py: 1.75 }}>
              <Avatar src={user?.profilePicture} alt="" sx={{ width: 38, height: 38 }}>{user?.name?.[0] || 'N'}</Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography fontWeight={750} noWrap>{user?.name || 'Nexora'}</Typography>
                <Typography variant="caption" color="text.secondary">Messages</Typography>
              </Box>
              <IconButton aria-label="Find a connection to message" onClick={() => searchRef.current?.focus()}>
                <EditNoteRoundedIcon />
              </IconButton>
            </Stack>
            <Box sx={{ px: 1.5, pb: 1.25 }}>
              <TextField
                inputRef={searchRef}
                fullWidth
                size="small"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search chats"
                inputProps={{ 'aria-label': 'Search accepted connections' }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" color="action" /></InputAdornment>,
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 5, bgcolor: 'action.hover' } }}
              />
            </Box>
            <Divider />
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={750}>Chats</Typography>
              <Typography variant="caption" color="text.secondary">{filteredContacts.length} {filteredContacts.length === 1 ? 'connection' : 'connections'}</Typography>
            </Stack>
            <Box sx={{ minHeight: 0, overflowY: 'auto', flex: 1 }}>
              {filteredContacts.length ? (
                <List disablePadding>
                  {filteredContacts.map((contact) => {
                    const conversation = conversations.find((item) => String(item.peer?._id) === String(contact._id));
                    const hasMessages = Boolean(conversation?.lastMessage);
                    const isOwnLastMessage = String(conversation?.lastMessage?.sender) === String(user?._id);
                    const preview = hasMessages
                      ? (conversation.lastMessage.text || (isOwnLastMessage ? 'You sent a message' : 'Message'))
                      : (contact.headline || 'Start a conversation');
                    return (
                      <ListItemButton
                        key={contact._id}
                        selected={String(active?.peer?._id) === String(contact._id)}
                        onClick={() => openConversation(contact)}
                        aria-label={`Open chat with ${contact.name || 'connection'}`}
                        sx={{
                          minWidth: 0,
                          minHeight: 76,
                          px: 1.75,
                          '&.Mui-selected': { bgcolor: 'action.selected' },
                          '&.Mui-selected:hover': { bgcolor: 'action.selected' },
                          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: '-2px' },
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: 62 }}><Avatar src={contact.profilePicture} alt="" sx={{ width: 50, height: 50 }}>{contact.name?.[0] || 'N'}</Avatar></ListItemAvatar>
                        <ListItemText
                          primary={contact.name || 'Nexora member'}
                          secondary={preview}
                          primaryTypographyProps={{ noWrap: true, fontWeight: 650 }}
                          secondaryTypographyProps={{ noWrap: true, fontSize: '0.78rem', color: 'text.secondary' }}
                        />
                        <Stack alignItems="flex-end" sx={{ pl: 1, minWidth: 0 }}>
                          {hasMessages && <Typography variant="caption" color="text.secondary" noWrap>{formatConversationTime(conversation.lastMessageAt || conversation.lastMessage.createdAt)}</Typography>}
                        </Stack>
                      </ListItemButton>
                    );
                  })}
                </List>
              ) : (
                <Stack alignItems="center" justifyContent="center" sx={{ px: 3, py: 5, textAlign: 'center' }}>
                  <Typography fontWeight={700}>{contacts.length ? 'No matches' : 'No chats yet'}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {contacts.length ? 'Try a different name or headline.' : 'Accepted connections will appear here when you are ready to message.'}
                  </Typography>
                </Stack>
              )}
            </Box>
          </Box>
        )}

        {(!mobile || active) && (
          <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
            {active ? (
              <>
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ px: { xs: 1, sm: 2 }, py: 1.4, borderBottom: 1, borderColor: 'divider', minWidth: 0 }}>
                  {mobile && <IconButton aria-label="Back to chats" onClick={() => { selectedConversationId.current = null; setActive(null); setMessages([]); }} size="small"><ArrowBackRoundedIcon /></IconButton>}
                  <Avatar src={active.peer.profilePicture} alt="" sx={{ width: 42, height: 42 }}>{active.peer.name?.[0] || 'N'}</Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>{active.peer.name}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>{active.peer.headline || 'Nexora connection'}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>Synced to your account</Typography>
                </Stack>
                <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: { xs: 1.5, sm: 2.5 }, display: 'flex', flexDirection: 'column', gap: 1.25, bgcolor: 'background.default' }} aria-live="polite" aria-label={`Conversation with ${active.peer.name}`}>
                  {loadingMessages && !messages.length ? <Stack spacing={1.25} sx={{ width: 'min(90%, 440px)', alignSelf: 'center', mt: 3 }}><Skeleton variant="rounded" width="62%" height={42} /><Skeleton variant="rounded" width="74%" height={42} sx={{ alignSelf: 'flex-end' }} /><Skeleton variant="rounded" width="55%" height={42} /></Stack> : null}
                  {messages.length === 0 && !loadingMessages && (
                    <Stack alignItems="center" justifyContent="center" sx={{ flex: 1, py: 5, textAlign: 'center' }}>
                      <Avatar src={active.peer.profilePicture} alt="" sx={{ width: 72, height: 72, mb: 1.5 }}>{active.peer.name?.[0] || 'N'}</Avatar>
                      <Typography variant="h6" fontWeight={700}>{active.peer.name}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 320 }}>Start a private conversation with your Nexora connection.</Typography>
                    </Stack>
                  )}
                  {messages.map((message) => {
                    const ownMessage = message.sender.toString() === user._id.toString();
                    const readByPeer = message.readBy?.some((id) => id.toString() === active.peer._id.toString());
                    return (
                      <Box key={message._id} sx={{ alignSelf: ownMessage ? 'flex-end' : 'flex-start', maxWidth: 'min(82%, 560px)', minWidth: 0 }}>
                        <Paper elevation={0} sx={{ px: 1.5, py: 1.1, borderRadius: 2.5, bgcolor: ownMessage ? 'primary.main' : 'action.hover', color: ownMessage ? 'primary.contrastText' : 'text.primary', overflowWrap: 'anywhere' }}>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{message.text}</Typography>
                        </Paper>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: ownMessage ? 'right' : 'left', mt: 0.4 }}>
                          {formatTimestamp(message.createdAt)}{ownMessage ? ` · ${message.pending ? 'Sending…' : readByPeer ? 'Read' : 'Sent'}` : ''}
                        </Typography>
                      </Box>
                    );
                  })}
                  <div ref={bottomRef} />
                </Box>
                <Box component="form" onSubmit={sendMessage} sx={{ p: { xs: 1, sm: 1.5 }, pb: 'max(12px, env(safe-area-inset-bottom))', borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'flex-end', bgcolor: 'background.paper' }}>
                  <EmojiPickerControl
                    disabled={sending}
                    onSelect={(emoji) => setDraft((current) => `${current}${emoji}`.slice(0, 5000))}
                  />
                  <TextField
                    fullWidth multiline maxRows={4} size="small" label="Message" value={draft}
                    sx={{ flex: 1, minWidth: 0 }}
                    inputRef={composerInputRef}
                    onChange={(event) => setDraft(event.target.value.slice(0, 5000))}
                    onInput={(event) => setDraft(event.currentTarget.value.slice(0, 5000))}
                    onFocus={(event) => setDraft(event.currentTarget.value.slice(0, 5000))}
                    onKeyDown={handleComposerKeyDown}
                    inputProps={{ maxLength: 5000, name: 'message' }}
                    placeholder="Write a message..."
                  />
                  <Button type="submit" variant="contained" aria-label="Send message" disabled={sending} sx={{ minWidth: 48, width: 48, height: 40, px: 0 }}>
                    {sending ? <CircularProgress size={18} color="inherit" /> : <SendRoundedIcon />}
                  </Button>
                </Box>
              </>
            ) : (
              <Stack alignItems="center" justifyContent="center" sx={{ flex: 1, minHeight: 300, p: 4, textAlign: 'center' }}>
                <ChatBubbleOutlineRoundedIcon color="primary" sx={{ fontSize: 42, mb: 1.5 }} />
                <Typography variant="h6" fontWeight={700}>Your messages</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380 }}>Choose a connection to open an existing chat or start a new one.</Typography>
              </Stack>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default MessagesPage;
