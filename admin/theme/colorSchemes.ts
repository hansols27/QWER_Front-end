// colorSchemes.ts
import type { Theme } from '@mui/material/styles'

// Skin 타입 정의 및 export
export type Skin = 'default' | 'bordered'

const colorSchemes = (skin: Skin = 'default'): Theme['colorSchemes'] => {
  return {
    light: {
      palette: {
        mode: 'light',
        primary: { main: '#8C57FF', light: '#A379FF', dark: '#7E4EE6', contrastText: '#fff' },
        secondary: { main: '#8A8D93', light: '#A1A4A9', dark: '#7C7F84', contrastText: '#fff' },
        error: { main: '#FF4C51', light: '#FF7074', dark: '#E64449', contrastText: '#fff' },
        warning: { main: '#FFB400', light: '#FFC333', dark: '#E6A200', contrastText: '#fff' },
        info: { main: '#16B1FF', light: '#45C1FF', dark: '#149FE6', contrastText: '#fff' },
        success: { main: '#56CA00', light: '#78D533', dark: '#4DB600', contrastText: '#fff' },
        text: { primary: '#000', secondary: '#666', disabled: '#999', primaryChannel: '', secondaryChannel: '' },
        divider: '#ddd',
        background: { default: '#fff', paper: '#fff' },
        action: {
          active: '#000',
          hover: '#0000',
          selected: '#0001',
          disabled: '#0002',
          disabledBackground: '#0003',
          focus: '#0004',
          hoverOpacity: 0.04,
          disabledOpacity: 0.12,
          selectedOpacity: 0.08,
          focusOpacity: 0.1,
          activatedOpacity: 0.12,
        },
      },
    },
    dark: {
      palette: {
        mode: 'dark',
        primary: { main: '#8C57FF', light: '#A379FF', dark: '#7E4EE6', contrastText: '#fff' },
        secondary: { main: '#8A8D93', light: '#A1A4A9', dark: '#7C7F84', contrastText: '#fff' },
        error: { main: '#FF4C51', light: '#FF7074', dark: '#E64449', contrastText: '#fff' },
        warning: { main: '#FFB400', light: '#FFC333', dark: '#E6A200', contrastText: '#fff' },
        info: { main: '#16B1FF', light: '#45C1FF', dark: '#149FE6', contrastText: '#fff' },
        success: { main: '#56CA00', light: '#78D533', dark: '#4DB600', contrastText: '#fff' },
        text: { primary: '#fff', secondary: '#ccc', disabled: '#999', primaryChannel: '', secondaryChannel: '' },
        divider: '#444',
        background: { default: '#28243D', paper: '#312D4B' },
        action: {
          active: '#fff',
          hover: '#fff0',
          selected: '#fff1',
          disabled: '#fff2',
          disabledBackground: '#fff3',
          focus: '#fff4',
          hoverOpacity: 0.04,
          disabledOpacity: 0.12,
          selectedOpacity: 0.08,
          focusOpacity: 0.1,
          activatedOpacity: 0.12,
        },
      },
    },
  } as unknown as Theme['colorSchemes']
}

export default colorSchemes
