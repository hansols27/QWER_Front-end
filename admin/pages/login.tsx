'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Paper, TextField, Button, Typography } from '@mui/material';
import axios from 'axios';

interface LoginResponse {
  token: string;
}

// 안전하게 에러 메시지 추출
const getErrorMessage = (err: unknown): string => {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e.response?.data?.message ?? e.message ?? '로그인 실패';
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const res = await axios.post<LoginResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`, 
        { email, password }
      );

      localStorage.setItem('token', res.data.token);
      router.replace('/settings'); // 로그인 성공 시 이동
    } catch (err: unknown) {
      console.error('로그인 에러:', err);
      alert(getErrorMessage(err));
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
