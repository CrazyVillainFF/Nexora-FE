import React, { useState, useEffect, useCallback } from 'react';
import { Container, Grid, Box, Stack, Chip, Typography, Button, CircularProgress } from '@mui/material';
import ProfileMiniCard from '../components/ProfileMiniCard';
import CreatePostCard from '../components/CreatePostCard';
import PostCard from '../components/PostCard';
import RightWidgets from '../components/RightWidgets';
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

      const params = {
        page: pageNum,
        limit: 10,
        ...(tag !== 'All' && { tag })
      };

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

  const handleTagFilter = (tag) => {
    setSelectedTag(tag);
    setPage(1);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(selectedTag, nextPage, true);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
  };

  return (
    <Container maxWidth="xl">
      <Grid container spacing={3}>
        {/* Left Column: Profile Mini Card (Sticky on desktop) */}
        <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box sx={{ position: 'sticky', top: 90 }}>
            <ProfileMiniCard />
          </Box>
        </Grid>

        {/* Center Column: Feed Composer & Post Stream */}
        <Grid item xs={12} md={6}>
          <CreatePostCard onPostCreated={handlePostCreated} />

          {/* Tag Filter Pills */}
          <Box sx={{ mb: 2.5, overflowX: 'auto', py: 0.5 }}>
            <Stack direction="row" spacing={1}>
              {FILTER_TOPICS.map((tag) => (
                <Chip
                  key={tag}
                  label={tag === 'All' ? '⚡ All Updates' : `#${tag}`}
                  clickable
                  onClick={() => handleTagFilter(tag)}
                  color={selectedTag === tag ? 'primary' : 'default'}
                  variant={selectedTag === tag ? 'filled' : 'outlined'}
                  sx={{
                    fontWeight: 600,
                    borderRadius: 3,
                    px: 0.5,
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* Feed Content Stream */}
          {loading ? (
            <Stack spacing={2}>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </Stack>
          ) : error ? (
            <ErrorState message={error} onRetry={() => fetchFeed(selectedTag, 1, false)} />
          ) : posts.length > 0 ? (
            <Stack spacing={0}>
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onPostDeleted={handlePostDeleted}
                  onPostUpdated={handlePostUpdated}
                />
              ))}

              {/* Load More Button */}
              {hasMore && (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    sx={{ px: 4, py: 1 }}
                  >
                    {loadingMore ? <CircularProgress size={20} /> : 'Load More Insights'}
                  </Button>
                </Box>
              )}
            </Stack>
          ) : (
            <EmptyState
              icon={DynamicFeedIcon}
              title="No posts found in this feed"
              description="Be the first professional to share an architectural breakthrough, design framework, or career milestone!"
              actionText="Share an Update"
              onAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
          )}
        </Grid>

        {/* Right Column: Discover & Suggested Widgets */}
        <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box sx={{ position: 'sticky', top: 90 }}>
            <RightWidgets />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HomePage;
