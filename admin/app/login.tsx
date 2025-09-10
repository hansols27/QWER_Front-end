'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Paper, TextField, Button, Typography } from '@mui/material';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push('/admin/settings');
    } else {
      alert('로그인 실패');
    }
  };

  return (
    <Box className="flex items-center justify-center min-h-screen bg-gray-100">
      <Paper className="p-6 w-full max-w-md">
        <Typography variant="h5" align="center" gutterBottom>
          Admin Login
        </Typography>
        <TextField
          fullWidth
          margin="normal"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          fullWidth
          margin="normal"
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          fullWidth
          variant="contained"
          sx={{ mt: 2 }}
          onClick={handleLogin}
        >
          로그인
        </Button>
      </Paper>
    </Box>
  );
}
