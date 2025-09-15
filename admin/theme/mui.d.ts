import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Components {
    MuiTabPanel?: {
      styleOverrides?: {
        root?: React.CSSProperties | ((ownerState: any) => React.CSSProperties);
      };
    };
  }
}
