import React from 'react';
import { Box, Typography } from '@mui/material';
import ElectricLogo from './reactbits/ElectricLogo';
import { useThemeMode } from '../theme/ThemeContext';

const ReactableMark = ({ size = 38 }) => {
  const { mode } = useThemeMode();
  return (
    <Box
      role="img"
      aria-label="Reactable"
      sx={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        borderRadius: 1.25,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
      }}
    >
      <Typography component="span" sx={{ fontWeight: 800, fontSize: size * 0.72, lineHeight: 1, color: 'inherit' }}>
        R
      </Typography>
      <ElectricLogo
        src="/reactable-mark.svg"
        color={mode === 'light' ? '#FFFFFF' : '#F0F5F8'}
        glowColor={mode === 'light' ? '#75BDE9' : '#75BDE9'}
        theme={mode}
        scale={0.76}
        intensity={0.8}
        glow={0.55}
        thickness={1.2}
        strands={2}
        bend={0.28}
        crackle={0.35}
        arcs={0.25}
        flicker={0.15}
        fill={0}
        speed={0}
        interactive={false}
        className="reactable-mark__electric"
      />
    </Box>
  );
};

export default ReactableMark;
