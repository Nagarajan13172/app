'use client';

import { useState } from 'react';
import {
  IconButton,
  InputAdornment,
  TextField,
  type TextFieldProps,
} from '@mui/material';
import { LockOutlined, Visibility, VisibilityOff } from '@mui/icons-material';

// A password TextField with a lock adornment and a show/hide toggle.
export default function PasswordField(props: TextFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <TextField
      {...props}
      type={show ? 'text' : 'password'}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <LockOutlined fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShow((s) => !s)}
                edge="end"
                size="small"
                aria-label={show ? 'Hide password' : 'Show password'}
              >
                {show ? (
                  <VisibilityOff fontSize="small" />
                ) : (
                  <Visibility fontSize="small" />
                )}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
