import React, { useState, useRef } from 'react';
import {
  Card,
  CardContent,
  Avatar,
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  IconButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert
} from '@mui/material';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import TagOutlinedIcon from '@mui/icons-material/TagOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { useAuth } from '../context/AuthContext';
import { postAPI } from '../services/api';

const POPULAR_TAGS = ['#engineering', '#productdesign', '#ai', '#leadership', '#techtrends'];

const CreatePostCard = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [openModal, setOpenModal] = useState(false);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size exceeds 10MB.');
      return;
    }

    setError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddTag = (tag) => {
    if (!content.includes(tag)) {
      setContent((prev) => (prev ? `${prev} ${tag}` : tag));
    }
  };

  const handlePublish = async () => {
    if (!content.trim() && !imageFile) {
      setError('Please add some text or an image to share.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const formData = new FormData();
      if (content.trim()) formData.append('content', content.trim());
      if (imageFile) formData.append('image', imageFile);

      const res = await postAPI.createPost(formData);
      if (res.data.success && res.data.post) {
        if (onPostCreated) onPostCreated(res.data.post);
        setContent('');
        handleRemoveImage();
        setOpenModal(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to publish post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card sx={{ mb: 3, p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={user?.profilePicture}
            alt={user?.name}
            sx={{ width: 44, height: 44 }}
          >
            {user?.name ? user.name[0] : 'U'}
          </Avatar>
          <Box
            onClick={() => setOpenModal(true)}
            sx={{
              flex: 1,
              py: 1.25,
              px: 2.5,
              borderRadius: 6,
              bgcolor: 'action.hover',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'action.selected',
                borderColor: 'primary.light',
              }
            }}
          >
            <Typography variant="body2" color="text.secondary">
              What breakthrough or insight are you working on, {user?.name?.split(' ')[0] || 'there'}?
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 1.75 }} />

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              startIcon={<ImageOutlinedIcon sx={{ color: '#0EA5E9' }} />}
              onClick={() => {
                setOpenModal(true);
                setTimeout(() => fileInputRef.current?.click(), 200);
              }}
              sx={{ color: 'text.secondary', fontWeight: 500 }}
            >
              Photo / Visual
            </Button>
            <Button
              size="small"
              startIcon={<TagOutlinedIcon sx={{ color: '#8B5CF6' }} />}
              onClick={() => setOpenModal(true)}
              sx={{ color: 'text.secondary', fontWeight: 500 }}
            >
              Topic Tag
            </Button>
          </Stack>

          <Button
            variant="contained"
            size="small"
            onClick={() => setOpenModal(true)}
            sx={{ px: 2.5 }}
          >
            Create Post
          </Button>
        </Stack>
      </Card>

      {/* Expandable Composer Dialog */}
      <Dialog
        open={openModal}
        onClose={submitting ? undefined : () => setOpenModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar src={user?.profilePicture} alt={user?.name} sx={{ width: 40, height: 40 }}>
              {user?.name ? user.name[0] : 'U'}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                {user?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Publishing to Public Network
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={() => setOpenModal(false)} disabled={submitting} size="small">
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ my: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            placeholder="Share an achievement, architectural perspective, or industry question..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: { fontSize: '1.05rem', lineHeight: 1.6 }
            }}
          />

          {/* Hidden Image Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            style={{ display: 'none' }}
          />

          {/* Image Preview */}
          {imagePreview && (
            <Box sx={{ position: 'relative', mt: 2, borderRadius: 2.5, overflow: 'hidden' }}>
              <Box
                component="img"
                src={imagePreview}
                alt="Post upload preview"
                sx={{
                  width: '100%',
                  maxHeight: 280,
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
              <IconButton
                onClick={handleRemoveImage}
                disabled={submitting}
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  bgcolor: 'rgba(0,0,0,0.65)',
                  color: '#fff',
                  '&:hover': { bgcolor: 'rgba(239,68,68,0.9)' }
                }}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
          )}

          {/* Suggested Topic Tags */}
          <Box sx={{ mt: 2.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 1 }}>
              Suggested Tags:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {POPULAR_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  clickable
                  onClick={() => handleAddTag(tag)}
                  sx={{
                    bgcolor: content.includes(tag) ? 'primary.main' : 'action.hover',
                    color: content.includes(tag) ? '#fff' : 'text.primary',
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                />
              ))}
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, pb: 2, justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1}>
            <IconButton
              color="primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting}
            >
              <ImageOutlinedIcon />
            </IconButton>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {content.length} / 5000
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handlePublish}
              disabled={submitting || (!content.trim() && !imageFile)}
              endIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SendRoundedIcon />}
              sx={{ px: 3 }}
            >
              {submitting ? 'Publishing...' : 'Publish'}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CreatePostCard;
