import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  IconButton,
  Button,
  Stack,
  Box,
  Divider,
  Menu,
  MenuItem,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postAPI, commentAPI } from '../services/api';
import { formatTimeAgo } from '../utils/formatters';

const PostCard = ({ post, onPostDeleted, onPostUpdated }) => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [commentCount, setCommentCount] = useState(post.commentCount || (post.comments ? post.comments.length : 0));
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Edit post state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [savingEdit, setSavingEdit] = useState(false);

  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Snackbar state
  const [toastMessage, setToastMessage] = useState(null);

  const author = post.author || {};
  const isAuthor = currentUser && currentUser._id === (typeof author === 'string' ? author : author._id);

  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    // Optimistic update
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikeCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await postAPI.toggleLike(post._id);
    } catch (err) {
      // Revert on failure
      setIsLiked(!nextLiked);
      setLikeCount((prev) => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)));
      console.error('[Like Error]', err.message);
    }
  };

  const handleToggleComments = async () => {
    const nextShow = !showComments;
    setShowComments(nextShow);

    if (nextShow && comments.length === 0) {
      try {
        setLoadingComments(true);
        const res = await commentAPI.getPostComments(post._id);
        if (res.data.success) {
          setComments(res.data.comments || []);
        }
      } catch (err) {
        console.error('[Comments Load Error]', err.message);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const handleAddComment = async (e) => {
    e?.preventDefault();
    if (!newComment.trim()) return;

    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    try {
      setSubmittingComment(true);
      const res = await commentAPI.addComment(post._id, { content: newComment.trim() });
      if (res.data.success) {
        setComments((prev) => [...prev, res.data.comment]);
        setCommentCount((prev) => prev + 1);
        setNewComment('');
      }
    } catch (err) {
      console.error('[Add Comment Error]', err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await commentAPI.deleteComment(commentId);
      if (res.data.success) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        setCommentCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('[Delete Comment Error]', err.message);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setSavingEdit(true);
      const res = await postAPI.updatePost(post._id, { content: editContent });
      if (res.data.success) {
        setIsEditing(false);
        if (onPostUpdated) onPostUpdated(res.data.post);
        setToastMessage('Post updated successfully.');
      }
    } catch (err) {
      console.error('[Update Post Error]', err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeletePost = async () => {
    try {
      setDeleting(true);
      const res = await postAPI.deletePost(post._id);
      if (res.data.success) {
        setDeleteConfirmOpen(false);
        if (onPostDeleted) onPostDeleted(post._id);
      }
    } catch (err) {
      console.error('[Delete Post Error]', err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/post/${post._id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(postUrl);
      setToastMessage('Link copied to clipboard!');
    }
  };

  // Render text with clickable hashtag highlights
  const renderFormattedContent = (text) => {
    if (!text) return null;
    const parts = text.split(/(#[a-zA-Z0-9_]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <Typography
            key={i}
            component="span"
            sx={{
              color: 'primary.main',
              fontWeight: 600,
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' }
            }}
            onClick={() => navigate(`/search?q=${encodeURIComponent(part.substring(1))}`)}
          >
            {part}
          </Typography>
        );
      }
      return part;
    });
  };

  return (
    <>
      <Card sx={{ mb: 2.5, position: 'relative' }}>
        {/* Post Header */}
        <CardHeader
          avatar={
            <Avatar
              src={author.profilePicture}
              alt={author.name}
              sx={{ width: 48, height: 48, cursor: 'pointer' }}
              onClick={() => navigate(`/profile/${author._id}`)}
            >
              {author.name ? author.name[0] : 'U'}
            </Avatar>
          }
          action={
            isAuthor ? (
              <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
                <MoreVertRoundedIcon />
              </IconButton>
            ) : null
          }
          title={
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
              onClick={() => navigate(`/profile/${author._id}`)}
            >
              {author.name || 'NEXORA Member'}
            </Typography>
          }
          subheader={
            <Stack spacing={0.25}>
              <Typography variant="caption" color="text.secondary" noWrap>
                {author.headline || author.jobTitle || 'Professional'}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.75rem' }}>
                {formatTimeAgo(post.createdAt)}
              </Typography>
            </Stack>
          }
          sx={{ pb: 1 }}
        />

        {/* Post Author Options Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{ sx: { borderRadius: 2.5, minWidth: 140 } }}
        >
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              setIsEditing(true);
            }}
          >
            <EditOutlinedIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
            Edit Post
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              setDeleteConfirmOpen(true);
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteOutlineRoundedIcon fontSize="small" sx={{ mr: 1.5 }} />
            Delete Post
          </MenuItem>
        </Menu>

        {/* Post Content */}
        <CardContent sx={{ pt: 1, pb: 1.5 }}>
          {isEditing ? (
            <Box sx={{ mb: 2 }}>
              <TextField
                multiline
                rows={3}
                fullWidth
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                variant="outlined"
                sx={{ mb: 1.5 }}
              />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button size="small" variant="outlined" color="inherit" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </Stack>
            </Box>
          ) : (
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.65 }}>
              {renderFormattedContent(post.content)}
            </Typography>
          )}

          {/* Post Image Visual */}
          {post.image && (
            <Box
              sx={{
                mt: 2,
                borderRadius: 2.5,
                overflow: 'hidden',
                bgcolor: 'background.subtle',
                cursor: 'pointer',
                maxHeight: 480,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: (theme) => `1px solid ${theme.palette.divider}`,
              }}
              onClick={() => setImageModalOpen(true)}
            >
              <Box
                component="img"
                src={post.image}
                alt="Post visual attachment"
                sx={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: 480,
                  objectFit: 'cover',
                  transition: 'transform 0.25s ease',
                  '&:hover': { transform: 'scale(1.01)' }
                }}
              />
            </Box>
          )}
        </CardContent>

        {/* Counts Bar */}
        {(likeCount > 0 || commentCount > 0) && (
          <Box sx={{ px: 2.5, py: 0.75 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {likeCount > 0 && `❤️ ${likeCount} ${likeCount === 1 ? 'like' : 'likes'}`}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                onClick={handleToggleComments}
              >
                {commentCount > 0 && `${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`}
              </Typography>
            </Stack>
          </Box>
        )}

        <Divider />

        {/* Action Buttons */}
        <CardActions sx={{ px: 1, py: 0.5, justifyContent: 'space-around' }}>
          <Button
            size="small"
            startIcon={
              isLiked ? (
                <FavoriteRoundedIcon sx={{ color: '#EF4444', animation: 'pulse 0.3s' }} />
              ) : (
                <FavoriteBorderRoundedIcon />
              )
            }
            onClick={handleLikeToggle}
            sx={{
              color: isLiked ? '#EF4444' : 'text.secondary',
              fontWeight: 600,
              flex: 1,
            }}
          >
            Like
          </Button>

          <Button
            size="small"
            startIcon={<ChatBubbleOutlineRoundedIcon />}
            onClick={handleToggleComments}
            sx={{ color: 'text.secondary', fontWeight: 600, flex: 1 }}
          >
            Comment
          </Button>

          <Button
            size="small"
            startIcon={<ShareOutlinedIcon />}
            onClick={handleShare}
            sx={{ color: 'text.secondary', fontWeight: 600, flex: 1 }}
          >
            Share
          </Button>
        </CardActions>

        {/* Expandable Comments Section */}
        {showComments && (
          <Box sx={{ bgcolor: 'action.hover', p: 2, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
            {/* New Comment Input */}
            <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
              <Avatar
                src={currentUser?.profilePicture}
                alt={currentUser?.name}
                sx={{ width: 36, height: 36 }}
              >
                {currentUser?.name ? currentUser.name[0] : 'U'}
              </Avatar>
              <Box component="form" onSubmit={handleAddComment} sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Write a constructive comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={submittingComment}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        size="small"
                        color="primary"
                        type="submit"
                        disabled={!newComment.trim() || submittingComment}
                      >
                        {submittingComment ? <CircularProgress size={16} /> : <SendRoundedIcon fontSize="small" />}
                      </IconButton>
                    ),
                    sx: { bgcolor: 'background.paper', borderRadius: 3 }
                  }}
                />
              </Box>
            </Stack>

            {/* Comments List */}
            {loadingComments ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : comments.length > 0 ? (
              <Stack spacing={1.5}>
                {comments.map((comment) => {
                  const commentAuthor = comment.author || {};
                  const isCommentOwner =
                    currentUser &&
                    (currentUser._id === commentAuthor._id || currentUser._id === author._id);

                  return (
                    <Stack key={comment._id} direction="row" spacing={1.5} alignItems="flex-start">
                      <Avatar
                        src={commentAuthor.profilePicture}
                        alt={commentAuthor.name}
                        sx={{ width: 32, height: 32, cursor: 'pointer' }}
                        onClick={() => navigate(`/profile/${commentAuthor._id}`)}
                      >
                        {commentAuthor.name ? commentAuthor.name[0] : 'U'}
                      </Avatar>
                      <Box
                        sx={{
                          flex: 1,
                          p: 1.5,
                          borderRadius: 2.5,
                          bgcolor: 'background.paper',
                          border: (theme) => `1px solid ${theme.palette.divider}`,
                          position: 'relative',
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography
                            variant="caption"
                            fontWeight={700}
                            sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                            onClick={() => navigate(`/profile/${commentAuthor._id}`)}
                          >
                            {commentAuthor.name || 'User'}
                          </Typography>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                              {formatTimeAgo(comment.createdAt)}
                            </Typography>
                            {isCommentOwner && (
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteComment(comment._id)}
                                sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                              >
                                <DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            )}
                          </Stack>
                        </Stack>
                        <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.875rem' }}>
                          {comment.content}
                        </Typography>
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', py: 1 }}>
                No comments yet. Be the first to share your thoughts!
              </Typography>
            )}
          </Box>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Post?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to permanently delete this post? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={deleting} variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleDeletePost}
            disabled={deleting}
            variant="contained"
            color="error"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Lightbox Modal */}
      <Dialog
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        maxWidth="md"
        PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', overflow: 'hidden' } }}
      >
        <Box
          component="img"
          src={post.image}
          alt="Post full visual"
          sx={{ width: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 2 }}
        />
      </Dialog>

      {/* Toast alert */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3500}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PostCard;
