import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, AlertTitle, Avatar, Box, Button, CircularProgress, Container, Divider, FormControl, IconButton, InputAdornment, List,
  ListItemButton, ListItemAvatar, ListItemText, MenuItem, Paper, Select, Skeleton, Stack, TextField,
  Typography, useMediaQuery
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { messageAPI } from '../services/api';
import { decryptMessage, encryptForConversation, ensureDeviceKeyPair, getDeviceKeyPair, getKeyFingerprint, saveDeviceKeyPair } from '../utils/e2ee';
import { createEncryptedKeyBackup, restoreEncryptedKeyBackup } from '../utils/keyBackup';
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
  const navigate = useNavigate();
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
  const [search, setSearch] = useState('');
  const [keyBackups, setKeyBackups] = useState([]);
  const [legacyKeyUnavailable, setLegacyKeyUnavailable] = useState(false);
  const [backupStatusUnknown, setBackupStatusUnknown] = useState(false);
  const [backupPassphrase, setBackupPassphrase] = useState('');
  const [backupPassphraseAgain, setBackupPassphraseAgain] = useState('');
  const [recoveryPassphrase, setRecoveryPassphrase] = useState('');
  const [restoreBackupId, setRestoreBackupId] = useState('');
  const [backupError, setBackupError] = useState('');
  const [backupMessage, setBackupMessage] = useState('');
  const [savingBackup, setSavingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);
  const bottomRef = useRef(null);
  const searchRef = useRef(null);
  const selectedConversationId = useRef(null);
  const messageRequestId = useRef(0);
  const openRequestId = useRef(0);

  const loadMessages = useCallback(async (conversationId, key, peerSigningPublicKey) => {
    if (!key || !userId) return;
    const requestId = ++messageRequestId.current;
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
      if (requestId !== messageRequestId.current || selectedConversationId.current !== conversationId) return;
      setMessages(decrypted);
      setLoadingMessages(false);
    } catch (requestError) {
      if (requestId !== messageRequestId.current || selectedConversationId.current !== conversationId) return;
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
        const [contactResponse, conversationResponse] = await Promise.all([
          messageAPI.getContacts(),
          messageAPI.getConversations()
        ]);
        if (cancelled) return;
        const nextContacts = contactResponse.data.contacts || [];
        setContacts(nextContacts);
        setConversations(conversationResponse.data.conversations || []);

        let devicePair;
        try {
          devicePair = await ensureDeviceKeyPair(user._id, messageAPI);
        } catch (keyError) {
          if (!keyError.message?.includes('does not have the private key for existing encrypted messages')) throw keyError;
          setLegacyKeyUnavailable(true);
          try {
            const backupResponse = await messageAPI.getOwnKeyBackups();
            if (cancelled) return;
            const backups = backupResponse.data.backups || [];
            setKeyBackups(backups);
            setRestoreBackupId(String(backups[backups.length - 1]?._id || ''));
          } catch {
            if (!cancelled) {
              setBackupStatusUnknown(true);
              setBackupError('The encrypted recovery backup status could not be checked. Reload this page while online to try again.');
            }
          }
          return;
        }
        if (cancelled) return;
        setPrivateKey(devicePair.privateKey);
        setSigningPrivateKey(devicePair.signingPrivateKey);
        setOwnPublicKey(devicePair.serializedPublicKey);
        setOwnSigningPublicKey(devicePair.serializedSigningPublicKey);
        const ownFingerprint = await getKeyFingerprint(devicePair.serializedPublicKey, devicePair.serializedSigningPublicKey);
        const peerFingerprints = await Promise.all(nextContacts.filter((contact) => contact.encryptionPublicKey && contact.encryptionSigningPublicKey).map(async (contact) => [
          contact._id,
          await getKeyFingerprint(contact.encryptionPublicKey, contact.encryptionSigningPublicKey)
        ]));
        if (!cancelled) {
          setFingerprints({ self: ownFingerprint, ...Object.fromEntries(peerFingerprints) });
          try {
            const backupResponse = await messageAPI.getOwnKeyBackups();
            if (!cancelled) setKeyBackups(backupResponse.data.backups || []);
          } catch {
            if (!cancelled) setBackupError('Could not check the encrypted recovery backup status. Messaging can still be used on this device.');
          }
        }
      } catch (initializationError) {
        if (!cancelled) {
          const message = initializationError.message || 'Encrypted messaging could not be initialized.';
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
    if (!selectedConversation || !privateKey) return undefined;
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
    if (!privateKey) {
      setError('This browser does not have the private key for your existing messages. Open Messages on the browser and device where you first set it up to preserve your history.');
      return;
    }
    const requestId = ++openRequestId.current;
    try {
      setError('');
      selectedConversationId.current = null;
      messageRequestId.current += 1;
      setActive(null);
      setMessages([]);
      setLoadingMessages(true);
      setPreparingContact(contact);
      const response = await messageAPI.openConversation(contact._id);
      if (requestId !== openRequestId.current) return;
      setMessages([]);
      setLoadingMessages(true);
      const conversation = { ...response.data.conversation, peer: { ...contact, ...response.data.conversation.peer } };
      selectedConversationId.current = conversation._id;
      setActive(conversation);
      setPreparingContact(null);
    } catch (openError) {
      if (requestId !== openRequestId.current) return;
      if (openError.message?.includes('Both people need to set up an encryption key')) {
        setPreparingContact(contact);
        return;
      }
      setPreparingContact(null);
      setError(openError.message || 'Could not open this conversation.');
    }
  }, [privateKey]);

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
      setConversations((existing) => [
        { _id: active._id, peer: active.peer, lastMessageAt: new Date().toISOString(), lastMessage: { sender: user._id } },
        ...existing.filter((conversation) => conversation._id !== active._id)
      ]);
      await loadMessages(active._id, privateKey, active.peer.encryptionSigningPublicKey);
    } catch (sendError) {
      setError(sendError.message || 'The encrypted message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const saveRecoveryBackup = async (event) => {
    event.preventDefault();
    if (backupPassphrase !== backupPassphraseAgain) {
      setBackupError('The recovery passphrases do not match.');
      return;
    }
    try {
      setSavingBackup(true);
      setBackupError('');
      setBackupMessage('');
      const devicePair = await getDeviceKeyPair(userId);
      if (!devicePair) throw new Error('This device key is not available. Reload Messages and try again.');
      const backup = await createEncryptedKeyBackup(devicePair, userId, backupPassphrase);
      await messageAPI.saveOwnKeyBackup(backup);
      setBackupMessage('Encrypted recovery backup saved. Keep your passphrase somewhere safe. Nexora cannot recover it for you.');
      setBackupPassphrase('');
      setBackupPassphraseAgain('');
      try {
        const response = await messageAPI.getOwnKeyBackups();
        setKeyBackups(response.data.backups || []);
      } catch {
        setKeyBackups((existing) => [...existing, { ...backup, _id: `local-${Date.now()}`, createdAt: new Date().toISOString() }]);
      }
    } catch (backupSaveError) {
      setBackupError(backupSaveError.message || 'The encrypted recovery backup could not be saved.');
    } finally {
      setSavingBackup(false);
    }
  };

  const restoreRecoveryBackup = async (event) => {
    event.preventDefault();
    const backup = keyBackups.find((item) => String(item._id) === String(restoreBackupId));
    if (!backup) {
      setBackupError('Choose an available encrypted recovery backup.');
      return;
    }
    try {
      setRestoringBackup(true);
      setBackupError('');
      const response = await messageAPI.getOwnKey();
      const pair = await restoreEncryptedKeyBackup(
        backup,
        userId,
        recoveryPassphrase,
        response.data.publicKey,
        response.data.signingPublicKey,
      );
      if (pair.keyVersion !== response.data.keyVersion) throw new Error('This recovery backup belongs to a different account key version.');
      await saveDeviceKeyPair(userId, pair);
      setPrivateKey(pair.privateKey);
      setSigningPrivateKey(pair.signingPrivateKey);
      setOwnPublicKey(pair.serializedPublicKey);
      setOwnSigningPublicKey(pair.serializedSigningPublicKey);
      const ownFingerprint = await getKeyFingerprint(pair.serializedPublicKey, pair.serializedSigningPublicKey);
      const peerFingerprints = await Promise.all(contacts.filter((contact) => contact.encryptionPublicKey && contact.encryptionSigningPublicKey).map(async (contact) => [
        contact._id,
        await getKeyFingerprint(contact.encryptionPublicKey, contact.encryptionSigningPublicKey),
      ]));
      setFingerprints({ self: ownFingerprint, ...Object.fromEntries(peerFingerprints) });
      setLegacyKeyUnavailable(false);
      setRecoveryPassphrase('');
      setBackupMessage('This device is ready. Your existing messages remain encrypted and were not changed.');
    } catch (restoreError) {
      setBackupError(restoreError.message || 'This recovery backup could not be restored.');
    } finally {
      setRestoringBackup(false);
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
          <Typography variant="body2" color="text.secondary">Private conversations with your connections</Typography>
        </Box>
      </Stack>

      {error && (
        <Alert severity={error.includes('does not have the private key') ? 'info' : 'warning'} sx={{ mb: 2 }}>
          {error.includes('does not have the private key')
            ? (
              <>
                <AlertTitle>Messages are locked on this browser</AlertTitle>
                Your private key is stored in this browser, not on Nexora’s servers. To keep your history, open Messages using the exact same Nexora address and browser/device where you first set it up. Do not clear that site’s data or reset the key. If the original browser storage is gone, old encrypted messages cannot be recovered.
                <Typography component="span" variant="caption" sx={{ display: 'block', mt: 0.75, overflowWrap: 'anywhere' }}>
                  Current site: {window.location.origin}
                </Typography>
              </>
            )
            : error}
        </Alert>
      )}
      {backupError && <Alert severity="warning" sx={{ mb: 2 }}>{backupError}</Alert>}
      {backupMessage && <Alert severity="success" sx={{ mb: 2 }}>{backupMessage}</Alert>}

      {legacyKeyUnavailable && (
        <Alert severity={keyBackups.length ? 'info' : 'warning'} sx={{ mb: 2, alignItems: 'flex-start' }}>
          <AlertTitle>{backupStatusUnknown ? 'Recovery backup status unavailable' : keyBackups.length ? 'Restore this device from an encrypted backup' : 'This device has no copy of your message key'}</AlertTitle>
          {keyBackups.length ? (
            <>
              Choose a backup and enter the recovery passphrase you created on the original device. The passphrase is used in this browser and is never sent to Nexora.
              <Box component="form" onSubmit={restoreRecoveryBackup} sx={{ mt: 1.5, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(180px, 1fr) minmax(220px, 1.3fr) auto' }, gap: 1, alignItems: 'center' }}>
                <FormControl size="small" fullWidth>
                  <Select aria-label="Recovery backup" value={restoreBackupId} onChange={(event) => setRestoreBackupId(event.target.value)} displayEmpty>
                    {keyBackups.map((backup) => <MenuItem key={backup._id} value={String(backup._id)}>Backup from {formatConversationTime(backup.createdAt) || 'an earlier date'}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField fullWidth size="small" type="password" label="Recovery passphrase" value={recoveryPassphrase} onChange={(event) => setRecoveryPassphrase(event.target.value)} autoComplete="off" />
                <Button type="submit" variant="contained" disabled={restoringBackup || !recoveryPassphrase} sx={{ minHeight: 40, whiteSpace: 'nowrap' }}>
                  {restoringBackup ? <CircularProgress size={18} color="inherit" /> : 'Restore device'}
                </Button>
              </Box>
            </>
          ) : backupStatusUnknown ? (
            <>Your local private key is not available here. The original device still has not been changed. Reload Messages when online to check whether an encrypted recovery backup exists.</>
          ) : (
            <>Open Messages on the original device and browser to keep using this account’s existing history. No encrypted recovery backup is available for this account. Do not reset the key or clear the original browser’s site data. A legacy non-exportable key cannot be backed up by this recovery format.</>
          )}
        </Alert>
      )}

      {privateKey && (
        <Alert severity={keyBackups.length ? 'success' : 'info'} sx={{ mb: 2, alignItems: 'flex-start' }}>
          <AlertTitle>Encrypted device recovery</AlertTitle>
          {privateKey.extractable && signingPrivateKey?.extractable ? (
            <>
              Create a recovery backup to restore this same account key on another device. Nexora stores only AES-GCM ciphertext; the passphrase is not sent to the server. Use a unique passphrase of at least 16 characters, keep it safe, and do not use your Nexora account password.
              <Typography variant="caption" component="span" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                {keyBackups.length} of 5 recovery backups saved. A lost recovery passphrase cannot be reset by Nexora.
              </Typography>
              <Box component="form" onSubmit={saveRecoveryBackup} sx={{ mt: 1.5, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) minmax(0, 1fr) auto' }, gap: 1, alignItems: 'center' }}>
                <TextField fullWidth size="small" type="password" label="Create recovery passphrase" value={backupPassphrase} onChange={(event) => setBackupPassphrase(event.target.value)} autoComplete="new-password" inputProps={{ minLength: 16, maxLength: 256 }} />
                <TextField fullWidth size="small" type="password" label="Confirm recovery passphrase" value={backupPassphraseAgain} onChange={(event) => setBackupPassphraseAgain(event.target.value)} autoComplete="new-password" inputProps={{ minLength: 16, maxLength: 256 }} />
                <Button type="submit" variant="contained" disabled={savingBackup || keyBackups.length >= 5 || backupPassphrase.length < 16 || !backupPassphraseAgain} sx={{ minHeight: 40, whiteSpace: 'nowrap' }}>
                  {savingBackup ? <CircularProgress size={18} color="inherit" /> : 'Save backup'}
                </Button>
              </Box>
            </>
          ) : (
            <>This existing key was created in a legacy non-exportable format. It remains available on this device, but cannot be exported for cross-device recovery. Keep this browser’s site data intact. Nexora has not replaced or reset the key.</>
          )}
        </Alert>
      )}
      <Paper
        variant="outlined"
        sx={{
          display: 'grid',
          gridTemplateColumns: mobile && (active || preparingContact) ? 'minmax(0, 1fr)' : { xs: 'minmax(0, 1fr)', md: '360px minmax(0, 1fr)' },
          height: { xs: 'min(68dvh, 640px)', md: 'min(72dvh, 760px)' },
          minHeight: { xs: 400, md: 520 },
          overflow: 'hidden',
          borderRadius: 3,
          bgcolor: 'background.paper',
        }}
      >
        {(!mobile || (!active && !preparingContact)) && (
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
                    const preview = !privateKey
                      ? 'Open on your original device to preserve history'
                      : hasMessages
                        ? (isOwnLastMessage ? 'You sent a message' : 'Encrypted message')
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
                          {!privateKey && <LockRoundedIcon sx={{ fontSize: 15, color: 'text.secondary', mt: 0.5 }} aria-label="Private key is on another device" />}
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

        {(!mobile || active || preparingContact) && (
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
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.secondary', flexShrink: 0 }} title="Messages are encrypted on your device">
                    <LockRoundedIcon fontSize="small" />
                    <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' } }}>Encrypted</Typography>
                  </Stack>
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
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{message.decryptError ? 'This encrypted message could not be verified on this device.' : message.text}</Typography>
                        </Paper>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: ownMessage ? 'right' : 'left', mt: 0.4 }}>
                          {formatTimestamp(message.createdAt)}{ownMessage ? ` · ${readByPeer ? 'Read' : 'Sent'}` : ''}
                        </Typography>
                      </Box>
                    );
                  })}
                  <div ref={bottomRef} />
                </Box>
                <Box component="form" onSubmit={sendMessage} sx={{ p: { xs: 1, sm: 1.5 }, pb: 'max(12px, env(safe-area-inset-bottom))', borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'flex-end', bgcolor: 'background.paper' }}>
                  <TextField
                    fullWidth multiline maxRows={4} size="small" label="Message" value={draft}
                    onChange={(event) => setDraft(event.target.value.slice(0, 5000))}
                    onKeyDown={handleComposerKeyDown}
                    inputProps={{ maxLength: 5000 }}
                    placeholder="Write a message..."
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
                      {preparingContact.name} needs to sign in once to finish setting up encrypted messages. Nexora will check again automatically.
                    </Typography>
                  </>
                ) : (
                  <>
                    <ChatBubbleOutlineRoundedIcon color="primary" sx={{ fontSize: 42, mb: 1.5 }} />
                    <Typography variant="h6" fontWeight={700}>Your messages</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380 }}>Choose a connection to open an existing chat or start a new one.</Typography>
                  </>
                )}
              </Stack>
            )}
          </Box>
        )}
      </Paper>
      {active && fingerprints.self && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, overflowWrap: 'anywhere' }}>
          Your safety fingerprint: {fingerprints.self}. Compare it with your connection through another trusted channel.
        </Typography>
      )}
    </Container>
  );
};

export default MessagesPage;
