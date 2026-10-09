import React, { useState, useEffect, useCallback } from 'react';
import { Container, Box, Stack, Chip, Typography, Button, CircularProgress } from '@mui/material';
import PostCard from '../components/PostCard';
import { PostSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { postAPI } from '../services/api';
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed';

const FILTER_TOPICS = ['All', 'designsystems', 'ai', 'distributedsystems', 'startups', 'leadership'];

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTag, setSelectedTag] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchFeed = useCallback(async (tag = selectedTag, pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      const params = { page: pageNum, limit: 10, ...(tag !== 'All' && { tag }) };
      const res = await postAPI.getFeed(params);
      if (res.data.success) {
        const newPosts = res.data.posts || [];
        setPosts((prev) => (append ? [...prev, ...newPosts] : newPosts));
        setHasMore(pageNum < (res.data.totalPages || 1));
      }
    } catch (err) {
      console.error('[Feed Error]', err.message);
      setError('Unable to load feed discussions. Please check your network connection.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedTag]);

  useEffect(() => {
    fetchFeed(selectedTag, 1, false);
  }, [fetchFeed, selectedTag]);

  useEffect(() => {
    const handleCreated = (event) => {
      if (event.detail) setPosts((prev) => [event.detail, ...prev]);
    };
    window.addEventListener('nexora:post-created', handleCreated);
    return () => window.removeEventListener('nexora:post-created', handleCreated);
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(selectedTag, nextPage, true);
    }
  };

  const openComposer = () => window.dispatchEvent(new Event('nexora:create-post'));

  return (
    <Container maxWidth="md" sx={{ width: '100%', minWidth: 0 }}>
      <Box sx={{ mb: 2.5, py: 0.5, minWidth: 0 }} aria-label="Filter posts by topic">
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {FILTER_TOPICS.map((tag) => (
            <Chip
              key={tag}
              label={tag === 'All' ? 'All updates' : `#${tag}`}
              clickable
              onClick={() => {
                setSelectedTag(tag);
                setPage(1);
              }}
              color={selectedTag === tag ? 'primary' : 'default'}
              variant={selectedTag === tag ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600, borderRadius: 3, px: 0.5, maxWidth: '100%' }}
            />
          ))}
        </Stack>
      </Box>

      {loading ? (
        <Stack spacing={2}><PostSkeleton /><PostSkeleton /><PostSkeleton /></Stack>
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchFeed(selectedTag, 1, false)} />
      ) : posts.length > 0 ? (
        <Stack spacing={0} sx={{ minWidth: 0, width: '100%' }}>
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onPostDeleted={(postId) => setPosts((prev) => prev.filter((item) => item._id !== postId))}
              onPostUpdated={(updatedPost) => setPosts((prev) => prev.map((item) => item._id === updatedPost._id ? updatedPost : item))}
            />
          ))}
          {hasMore && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Button variant="outlined" onClick={handleLoadMore} disabled={loadingMore} sx={{ px: 4, py: 1 }}>
                {loadingMore ? <CircularProgress size={20} /> : 'Load More Posts'}
              </Button>
            </Box>
          )}
        </Stack>
      ) : (
        <EmptyState
          icon={DynamicFeedIcon}
          title="Your feed is ready for its first post"
          description="Share a project, an idea, or a question with your network."
          actionText="Create a post"
          onAction={openComposer}
        />
      )}
      <Typography component="span" sx={{ display: 'none' }} aria-live="polite">
        {posts.length} posts loaded
      </Typography>
    </Container>
  );
};

export default HomePage;
