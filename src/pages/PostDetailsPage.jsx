import React, { useCallback, useEffect, useState } from 'react';
import { Button, Container, Stack } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { useNavigate, useParams } from 'react-router-dom';
import { postAPI } from '../services/api';
import PostCard from '../components/PostCard';
import { PostSkeleton } from '../components/LoadingSkeleton';
import ErrorState from '../components/ErrorState';

const PostDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPost = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await postAPI.getPostById(id);
      setPost(response.data.post || null);
    } catch (requestError) {
      setError(requestError.message || 'This post could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadPost(); }, [loadPost]);

  return (
    <Container maxWidth="md" sx={{ minWidth: 0 }}>
      <Stack direction="row" sx={{ mb: 2 }}>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(-1)}>Back</Button>
      </Stack>
      {loading ? <PostSkeleton /> : error ? <ErrorState title="Post unavailable" message={error} onRetry={loadPost} /> : post ? (
        <PostCard post={post} onPostDeleted={() => navigate('/home', { replace: true })} onPostUpdated={setPost} />
      ) : <ErrorState title="Post unavailable" message="This post may have been deleted or is no longer visible." onRetry={() => navigate('/home')} />}
    </Container>
  );
};

export default PostDetailsPage;
