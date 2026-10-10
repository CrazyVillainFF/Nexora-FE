import React from 'react';

const GameArtwork = ({ game, compact = false }) => (
  <span className={`satisfied-art satisfied-art--${game}${compact ? ' is-compact' : ''}`} role="img" aria-label={`${game.replaceAll('-', ' ')} animation preview`}>
    {game === 'binary-orbits' && <><i /><i /><i /><b /></>}
    {game === 'shatter-type' && <><strong>SHATTER</strong><i /><i /><i /></>}
    {game === 'stardust-cursor' && <><i /><i /><i /><b /></>}
  </span>
);

export default GameArtwork;
