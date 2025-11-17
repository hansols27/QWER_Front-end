'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Paper, TextField, Button, Typography } from '@mui/material';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        alert('로그인 실패');
        return;
      }

      const data = await res.json();
      localStorage.setItem('token', data.token);

      router.replace('/settings'); // 로그인 성공 후 이동
    } catch (error) {
      console.error('로그인 에러:', error);
      alert('로그인 중 오류가 발생했습니다.');
    }
  };

  return (    
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Paper sx={{ p: 6, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" align="center" gutterBottom>
          로그인
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
        <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handleLogin}>
          로그인
        </Button>
      </Paper>
    </Box>    
  );
}
