import '@mui/material/styles';
import '@mui/lab/Timeline';
import '@mui/lab/TabPanel';
import '@mui/material/Chip';

declare module '@mui/material/styles' {
  interface Components {
    MuiTimeline?: {
      styleOverrides?: { root?: React.CSSProperties | ((ownerState: any) => React.CSSProperties) };
      variants?: Array<{ props: any; style: React.CSSProperties | ((ownerState: any) => React.CSSProperties) }>;
    };
    MuiTimelineDot?: {
      styleOverrides?: { root?: React.CSSProperties | ((ownerState: any) => React.CSSProperties) };
      variants?: Array<{ props: any; style: React.CSSProperties | ((ownerState: any) => React.CSSProperties) }>;
    };
    MuiTimelineConnector?: { styleOverrides?: { root?: React.CSSProperties | ((ownerState: any) => React.CSSProperties) } };
    MuiTimelineContent?: { styleOverrides?: { root?: React.CSSProperties | ((ownerState: any) => React.CSSProperties) } };
    MuiTabPanel?: { styleOverrides?: { root?: React.CSSProperties | ((ownerState: any) => React.CSSProperties) } };
    MuiChip?: { variants?: Array<{ props: any; style: React.CSSProperties | ((ownerState: any) => React.CSSProperties) }> };
  }
}
