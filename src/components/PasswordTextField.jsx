import React, { useState } from 'react';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';

const PasswordTextField = ({ InputProps, ...props }) => {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      InputProps={{
        ...InputProps,
        endAdornment: (
          <InputAdornment position="end">
            {InputProps?.endAdornment}
            <IconButton
              aria-label={visible ? 'Hide password' : 'Show password'}
              onClick={() => setVisible((current) => !current)}
              edge="end"
              size="small"
            >
              {visible ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
};

export default PasswordTextField;
