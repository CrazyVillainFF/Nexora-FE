import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Avatar, Box, Button, CircularProgress, Container, Divider, IconButton,
  List, ListItemButton, ListItemAvatar, ListItemText, Paper, Stack, TextField,
  Typography, useMediaQuery
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { messageAPI } from '../services/api';
import { decryptMessage, encryptForConversation, ensureDeviceKeyPair, getKeyFingerprint } from '../utils/e2ee';

const formatTimestamp = (value) => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value));

const MessagesPage = () => {
  const { user } = useAuth();
  const userId = user?._id;
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('md'));
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [preparingContact, setPreparingContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [privateKey, setPrivateKey] = useState(null);
  const [signingPrivateKey, setSigningPrivateKey] = useState(null);
  const [ownPublicKey, setOwnPublicKey] = useState('');
  const [ownSigningPublicKey, setOwnSigningPublicKey] = useState('');
  const [fingerprints, setFingerprints] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const loadMessages = useCallback(async (conversationId, key, peerSigningPublicKey) => {
    if (!key || !userId) return;
    try {
      const response = await messageAPI.getMessages(conversationId);
      const decrypted = await Promise.all((response.data.messages || []).map(async (message) => {
        try {
          const senderSigningKey = message.sender.toString() === userId.toString()
            ? ownSigningPublicKey
            : peerSigningPublicKey;
          return { ...message, text: await decryptMessage(message, userId, key, senderSigningKey), decryptError: false };
        } catch {
          return { ...message, text: 'Unable to decrypt on this device.', decryptError: true };
        }
      }));
      setMessages(decrypted);
      setLoadingMessages(false);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load this conversation.');
      setLoadingMessages(false);
    }
  }, [userId, ownSigningPublicKey]);

  useEffect(() => {
    let cancelled = false;
    const initialize = async () => {
      try {
        setLoading(true);
        setError('');
        const devicePair = await ensureDeviceKeyPair(user._id, messageAPI);
        if (cancelled) return;

        setPrivateKey(devicePair.privateKey);
        setSigningPrivateKey(devicePair.signingPrivateKey);
        setOwnPublicKey(devicePair.serializedPublicKey);
        setOwnSigningPublicKey(devicePair.serializedSigningPublicKey);
        const [contactResponse, conversationResponse] = await Promise.all([
          messageAPI.getContacts(),
          messageAPI.getConversations()
        ]);
        if (cancelled) return;
        const nextContacts = contactResponse.data.contacts || [];
        setContacts(nextContacts);
        setConversations(conversationResponse.data.conversations || []);
        const ownFingerprint = await getKeyFingerprint(devicePair.serializedPublicKey, devicePair.serializedSigningPublicKey);
        const peerFingerprints = await Promise.all(nextContacts.filter((contact) => contact.encryptionPublicKey && contact.encryptionSigningPublicKey).map(async (contact) => [
          contact._id,
          await getKeyFingerprint(contact.encryptionPublicKey, contact.encryptionSigningPublicKey)
        ]));
        if (!cancelled) setFingerprints({ self: ownFingerprint, ...Object.fromEntries(peerFingerprints) });
      } catch (initializationError) {
        if (!cancelled) setError(initializationError.message || 'Encrypted messaging could not be initialized.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (user?._id) initialize();
    return () => { cancelled = true; };
  }, [user?._id]);

  useEffect(() => {
    const selectedConversation = active;
    if (!selectedConversation || !privateKey) return undefined;
    loadMessages(selectedConversation._id, privateKey, selectedConversation.peer.encryptionSigningPublicKey);
    const interval = window.setInterval(() => loadMessages(selectedConversation._id, privateKey, selectedConversation.peer.encryptionSigningPublicKey), 6000);
    return () => window.clearInterval(interval);
  }, [active, privateKey, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages.length]);

  const openConversation = useCallback(async (contact) => {
    try {
      setError('');
      setPreparingContact(contact);
      const response = await messageAPI.openConversation(contact._id);
      setMessages([]);
      setLoadingMessages(true);
      setActive({ ...response.data.conversation, peer: { ...contact, ...response.data.conversation.peer } });
      setPreparingContact(null);
    } catch (openError) {
      if (openError.message?.includes('Both people need to set up an encryption key')) return;
      setPreparingContact(null);
      setError(openError.message || 'Could not open this conversation.');
    }
  }, []);

  useEffect(() => {
    if (!preparingContact) return undefined;
    const interval = window.setInterval(() => openConversation(preparingContact), 10000);
    return () => window.clearInterval(interval);
  }, [preparingContact, openConversation]);

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !active || !privateKey || !signingPrivateKey || sending) return;
    try {
      setSending(true);
      setError('');
      const own = { _id: user._id, encryptionPublicKey: ownPublicKey };
      const encrypted = await encryptForConversation(draft.trim(), [own, active.peer], active._id, user._id, signingPrivateKey);
      await messageAPI.sendMessage(active._id, encrypted);
      setDraft('');
      await loadMessages(active._id, privateKey, active.peer.encryptionSigningPublicKey);
      setConversations((existing) => [
        { _id: active._id, peer: active.peer, lastMessageAt: new Date().toISOString() },
        ...existing.filter((conversation) => conversation._id !== active._id)
      ]);
    } catch (sendError) {
      setError(sendError.message || 'The encrypted message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const orderedContacts = useMemo(() => {
    const recentIds = conversations.map((conversation) => conversation.peer?._id);
    return [...contacts].sort((left, right) => recentIds.indexOf(left._id) - recentIds.indexOf(right._id));
  }, [contacts, conversations]);

  if (loading) {
    return <Container maxWidth="md"><Stack alignItems="center" spacing={2} sx={{ py: 8 }}><CircularProgress /><Typography color="text.secondary">Loading messages…</Typography></Stack></Container>;
  }

  return (
    <Container maxWidth="lg" sx={{ minWidth: 0 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
        <ChatBubbleOutlineRoundedIcon color="primary" />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" fontWeight={800}>Messages</Typography>
          <Typography variant="body2" color="text.secondary">Chat with your accepted connections</Typography>
        </Box>
      </Stack>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper variant="outlined" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '300px minmax(0, 1fr)' }, minHeight: { xs: 'min(68dvh, 650px)', md: 620 }, overflow: 'hidden' }}>
        {(!mobile || !active) && (
          <Box sx={{ borderRight: { md: 1 }, borderColor: 'divider', minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ px: 2, py: 1.5 }}>Accepted connections</Typography>
            <Divider />
            {orderedContacts.length ? (
              <List disablePadding>
                {orderedContacts.map((contact) => (
                  <ListItemButton key={contact._id} selected={active?.peer?._id === contact._id} onClick={() => openConversation(contact)} sx={{ minWidth: 0, alignItems: 'center' }}>
                    <ListItemAvatar><Avatar src={contact.profilePicture} alt="">{contact.name?.[0] || 'N'}</Avatar></ListItemAvatar>
                    <ListItemText
                      primary={contact.name}
                      secondary={contact.headline || 'Accepted connection'}
                      primaryTypographyProps={{ noWrap: true, fontWeight: 650 }}
                      secondaryTypographyProps={{ noWrap: true, fontSize: '0.7rem' }}
                    />
                  </ListItemButton>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 2.5 }}><Typography variant="body2" color="text.secondary">Your accepted connections will appear here. Direct messages are limited to accepted connections.</Typography></Box>
            )}
          </Box>
        )}

        {(!mobile || active) && (
          <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
            {active ? (
              <>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1.5, py: 1.25, borderBottom: 1, borderColor: 'divider', minWidth: 0 }}>
                  {mobile && <IconButton aria-label="Back to connections" onClick={() => setActive(null)} size="small"><ArrowBackRoundedIcon /></IconButton>}
                  <Avatar src={active.peer.profilePicture} alt="" sx={{ width: 38, height: 38 }}>{active.peer.name?.[0] || 'N'}</Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>{active.peer.name}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {fingerprints[active.peer._id] ? `Fingerprint ${fingerprints[active.peer._id]}` : active.peer.headline || 'Encrypted conversation'}
                    </Typography>
                  </Box>
                  <ChatBubbleOutlineRoundedIcon fontSize="small" color="primary" aria-label="Conversation" />
                </Stack>
                <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: { xs: 1.5, sm: 2.5 }, display: 'flex', flexDirection: 'column', gap: 1.25 }} aria-live="polite">
                  {loadingMessages && !messages.length ? <CircularProgress size={24} sx={{ alignSelf: 'center', mt: 3 }} /> : null}
                  {messages.length === 0 && !loadingMessages && (
                    <Stack alignItems="center" justifyContent="center" sx={{ flex: 1, py: 5, textAlign: 'center' }}>
                      <ChatBubbleOutlineRoundedIcon color="disabled" sx={{ fontSize: 34, mb: 1 }} />
                      <Typography fontWeight={700}>Start a conversation</Typography>
                      <Typography variant="body2" color="text.secondary">Only this connection can read messages in this chat.</Typography>
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
                          {formatTimestamp(message.createdAt)}{ownMessage ? ` · ${readByPeer ? 'Read' : 'Sent'}` : ''}
                        </Typography>
                      </Box>
                    );
                  })}
                  <div ref={bottomRef} />
                </Box>
                <Box component="form" onSubmit={sendMessage} sx={{ p: 1.25, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <TextField
                    fullWidth multiline maxRows={4} size="small" label="Message" value={draft}
                    onChange={(event) => setDraft(event.target.value.slice(0, 5000))}
                    inputProps={{ maxLength: 5000 }}
                    placeholder="Write a message…"
                  />
                  <Button type="submit" variant="contained" aria-label="Send message" disabled={!draft.trim() || sending || !active.peer.encryptionPublicKey || !active.peer.encryptionSigningPublicKey} sx={{ minWidth: 48, width: 48, height: 40, px: 0 }}>
                    {sending ? <CircularProgress size={18} color="inherit" /> : <SendRoundedIcon />}
                  </Button>
                </Box>
              </>
            ) : (
              <Stack alignItems="center" justifyContent="center" sx={{ flex: 1, minHeight: 300, p: 4, textAlign: 'center' }}>
                {preparingContact ? (
                  <>
                    <CircularProgress size={30} sx={{ mb: 1.5 }} />
                    <Typography variant="h6" fontWeight={700}>Getting your chat ready</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380 }}>
                      {preparingContact.name} will be ready to message after their next sign-in. This will update automatically.
                    </Typography>
                  </>
                ) : (
                  <>
                    <ChatBubbleOutlineRoundedIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                    <Typography variant="h6" fontWeight={700}>Your messages</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380 }}>Choose an accepted connection to start chatting.</Typography>
                  </>
                )}
              </Stack>
            )}
          </Box>
        )}
      </Paper>
      {active && fingerprints.self && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, overflowWrap: 'anywhere' }}>
          Your fingerprint: {fingerprints.self}. Compare both fingerprints out of band before sharing sensitive information.
        </Typography>
      )}
    </Container>
  );
};

export default MessagesPage;
