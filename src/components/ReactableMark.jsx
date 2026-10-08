import React from 'react';
import { Box, useMediaQuery } from '@mui/material';
import ElectricLogo from './reactbits/ElectricLogo';
import { useThemeMode } from '../theme/ThemeContext';

const ReactableMark = ({ size = 38, electric = false, interactive = false, symbolOnly = false }) => {
  const { mode } = useThemeMode();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
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
        borderRadius: '22%',
        background: symbolOnly ? 'linear-gradient(135deg, #17AEEB 0%, #0AD3DC 100%)' : 'transparent',
      }}
    >
      <Box
        component="img"
        src={symbolOnly ? '/reactable-network-white.png' : '/reactable-icon.png'}
        alt=""
        draggable={false}
        sx={symbolOnly
          ? { position: 'absolute', inset: 0, m: 'auto', zIndex: 2, width: '58%', height: '58%', objectFit: 'contain' }
          : { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {electric && !reduceMotion && <ElectricLogo
        src="/reactable-network-white.png"
        color={mode === 'light' ? '#FFFFFF' : '#F0F5F8'}
        glowColor={mode === 'light' ? '#D4F5FF' : '#AEEBFF'}
        theme={mode}
        scale={0.54}
        intensity={0.35}
        glow={0.2}
        thickness={0.8}
        strands={1}
        bend={0.12}
        crackle={0.12}
        arcs={0}
        flicker={0}
        fill={0}
        speed={0.3}
        interactive={interactive}
        className={`reactable-mark__electric${interactive ? ' reactable-mark__electric--interactive' : ''}`}
      />}
    </Box>
  );
};

export default ReactableMark;
