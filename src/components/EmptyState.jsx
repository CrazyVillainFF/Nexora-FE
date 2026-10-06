import React from 'react';
import { Card, CardContent, Typography, Box, Button, Stack } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

const EmptyState = ({
  icon: Icon = InboxOutlinedIcon,
  title = 'No items found',
  description = 'There are currently no records or updates to display in this view.',
  actionText,
  onAction,
  sx = {}
}) => {
  return (
    <Card sx={{ textAlign: 'center', py: 6, px: 3, ...sx }}>
      <CardContent>
        <Box
          sx={{
            display: 'inline-flex',
            p: 2.5,
            borderRadius: '50%',
            bgcolor: 'action.hover',
            color: 'primary.main',
            mb: 2,
          }}
        >
          <Icon sx={{ fontSize: 44 }} />
        </Box>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mb: actionText ? 3 : 0 }}>
          {description}
        </Typography>
        {actionText && onAction && (
          <Button variant="contained" color="primary" onClick={onAction} sx={{ px: 3 }}>
            {actionText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyState;
