import '@mui/material/Chip';

declare module '@mui/material/Chip' {
  interface ChipPropsVariantOverrides {
    tonal: true; // "tonal" variant 허용
  }
}

import '@mui/material/Pagination';

declare module '@mui/material/Pagination' {
  interface PaginationPropsVariantOverrides {
    tonal: true; // "tonal" variant 허용
  }
}
