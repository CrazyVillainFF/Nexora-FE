import React from 'react';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import './WelcomeMoment.css';

const WelcomeMoment = ({ message }) => {
  if (!message) return null;

  return (
    <div className="welcome-moment" role="status" aria-live="polite" aria-atomic="true">
      <div className="welcome-moment__glow" aria-hidden="true" />
      <div className="welcome-moment__card">
        <span className="welcome-moment__mark" aria-hidden="true">
          <AutoAwesomeRoundedIcon />
        </span>
        <p className="welcome-moment__eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
        <h1 className="welcome-moment__title">{message}</h1>
        <p className="welcome-moment__caption">Good to have you with us.</p>
      </div>
    </div>
  );
};

export default WelcomeMoment;
