import React, { useEffect, useState } from 'react';
import {
  Box, Button, Dialog, DialogContent, IconButton, Stack, Typography,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SportsEsportsRoundedIcon from '@mui/icons-material/SportsEsportsRounded';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GameArtwork from './games/GameArtwork';

const STORAGE_KEY = 'vuprise.satisfied-games.prompt-seen.v1';
const previews = [
  { title: 'Binary Orbits', game: 'binary-orbits' },
  { title: 'Shatter Type', game: 'shatter-type' },
  { title: 'Stardust Cursor', game: 'stardust-cursor' },
];

const SatisfiedGamesPrompt = () => {
  const { loading, welcomeMessage, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const isAuthPage = ['/signin', '/signup', '/forgot-password'].includes(location.pathname);
    if (loading || welcomeMessage || location.pathname === '/satisfied-games' || (isAuthPage && !isAuthenticated)) return undefined;
    try { if (localStorage.getItem(STORAGE_KEY)) return undefined; } catch { /* show once for this mounted session */ }
    const timeout = window.setTimeout(() => {
      setOpen(true);
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* state still keeps this mount one-shot */ }
    }, 850);
    return () => window.clearTimeout(timeout);
  }, [isAuthenticated, loading, location.pathname, welcomeMessage]);

  const close = () => {
    setOpen(false);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* no-op */ }
  };

  return (
    <Dialog open={open} onClose={close} aria-labelledby="satisfied-games-prompt-title" maxWidth="sm" fullWidth PaperProps={{ sx: { overflow: 'hidden', bgcolor: 'background.paper' } }}>
      <IconButton onClick={close} aria-label="Close game invitation" sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, bgcolor: 'rgba(10,16,24,.72)' }}>
        <CloseRoundedIcon />
      </IconButton>
      <DialogContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack direction="row" spacing={1} alignItems="center" color="primary.main" sx={{ mb: 0.5 }}>
          <SportsEsportsRoundedIcon fontSize="small" />
          <Typography variant="overline" fontWeight={750}>A quick break</Typography>
        </Stack>
        <Typography id="satisfied-games-prompt-title" variant="h5" fontWeight={800}>Try Satisfied Games</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.6 }}>Explore a few playful visual experiments, made to try on any screen.</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
          {previews.map((item) => <Box key={item.title} sx={{ minWidth: 0 }}>
            <GameArtwork game={item.game} compact />
            <Typography variant="caption" fontWeight={700} noWrap display="block" sx={{ mt: 0.6 }}>{item.title}</Typography>
          </Box>)}
        </Box>
        <Button fullWidth variant="contained" size="large" onClick={() => { close(); navigate('/satisfied-games'); }} sx={{ mt: 2 }}>
          Explore games
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default SatisfiedGamesPrompt;
