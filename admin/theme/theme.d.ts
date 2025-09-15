import '@mui/material/Chip';

declare module '@mui/material/Chip' {
  interface ChipPropsVariantOverrides {
    tonal: true; // "tonal" variant 허용
  }
}
