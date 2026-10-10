import React, { useEffect, useState } from 'react';
import './WelcomeMoment.css';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const RollingGlyph = ({ character, index }) => {
  const [glyph, setGlyph] = useState(character);

  useEffect(() => {
    if (character === ' ') return undefined;

    const settleAfter = 1100 + index * 90;
    const startedAt = performance.now();
    const interval = window.setInterval(() => {
      if (performance.now() - startedAt >= settleAfter) {
        setGlyph(character);
        window.clearInterval(interval);
        return;
      }
      setGlyph(GLYPHS[Math.floor(Math.random() * GLYPHS.length)]);
    }, 30);

    return () => window.clearInterval(interval);
  }, [character, index]);

  return (
    <span
      className={character === ' ' ? 'welcome-moment__space' : 'welcome-moment__glyph'}
      style={{ '--glyph-index': index }}
      aria-hidden="true"
    >
      {glyph}
    </span>
  );
};

const WelcomeMoment = ({ message }) => {
  if (!message) return null;

  return (
    <div className="welcome-moment" role="status" aria-live="polite" aria-atomic="true">
      <span className="welcome-moment__accessible">{message}</span>
      <p className="welcome-moment__title" aria-hidden="true">
        {Array.from(message).map((character, index) => (
          <RollingGlyph key={`${index}-${character}`} character={character} index={index} />
        ))}
      </p>
    </div>
  );
};

export default WelcomeMoment;
