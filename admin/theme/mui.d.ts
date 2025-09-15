import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Components {
    MuiTimeline?: {
      styleOverrides?: {
        root?: React.CSSProperties | ((ownerState: any) => React.CSSProperties);
      };
    };
    MuiTabPanel?: {
      styleOverrides?: {
        root?: React.CSSProperties | ((ownerState: any) => React.CSSProperties);
      };
    };
    // 필요한 다른 컴포넌트도 여기에 추가 가능
  }
}
