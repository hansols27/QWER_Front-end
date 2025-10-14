'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Paper, TextField, Button, Typography } from '@mui/material';
import axios from 'axios';

interface LoginResponse {
  success: boolean;
  message: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      // Next.js 내부 API 호출
      const res = await axios.post<LoginResponse>('/api/login', { email, password });

      if (res.data.success) {
        router.replace('/settings'); // 로그인 성공 시 이동
      } else {
        alert(res.data.message || '로그인 실패');
      }
    } catch (err: any) {
      console.error('로그인 에러:', err);
      alert(err.response?.data?.message || '로그인 실패');
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
