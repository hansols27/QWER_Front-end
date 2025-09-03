import type { ReactNode } from 'react'
import { Theme as MuiTheme } from '@mui/material/styles'

// ----------------------
// 공통 타입 정의
// ----------------------
export type Skin = 'default' | 'bordered'
export type Mode = 'light' | 'dark'
export type SystemMode = 'light' | 'dark'
export type Direction = 'ltr' | 'rtl'

export type ChildrenType = {
  children: ReactNode
}

export type ThemeColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'

// ----------------------
// MUI Theme 확장
// ----------------------
declare module '@mui/material/styles' {
  interface Theme {
    skin?: Skin
    mode?: Mode
    direction?: Direction
    colorSchemes?: {
      light: MuiTheme['palette']
      dark: MuiTheme['palette']
    }
    customShadows?: {
      xs?: string
      sm?: string
      md?: string
      lg?: string
      xl?: string
      [key: string]: string | undefined
    }
    mainColorChannels?: {
      light: string
      dark: string
      lightShadow: string
      darkShadow: string
    }
  }

  interface Shape {
    borderRadius: number
    customBorderRadius?: {
      xs?: number
      sm?: number
      md?: number
      lg?: number
      xl?: number
    }
  }

  interface ThemeOptions {
    skin?: Skin
    mode?: Mode
    direction?: Direction
    colorSchemes?: {
      light?: MuiTheme['palette']
      dark?: MuiTheme['palette']
    }
    customShadows?: {
      xs?: string
      sm?: string
      md?: string
      lg?: string
      xl?: string
      [key: string]: string | undefined
    }
    shape?: Shape
    mainColorChannels?: {
      light?: string
      dark?: string
      lightShadow?: string
      darkShadow?: string
    }
  }
}
