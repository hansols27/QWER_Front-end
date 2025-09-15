import type { Mode, Skin } from '../theme/types'

export type Config = {
  templateName: string
  settingsCookieName: string
  mode: Mode
  layoutPadding: number
  compactContentWidth: number
  disableRipple: boolean
}

// Skin 값
export const skinType: Skin = 'default'

// Skin 타입 export
export type { Skin }

const themeConfig: Config = {
  templateName: 'Materio',
  settingsCookieName: 'materio-mui-next-free-demo',
  mode: 'light',
  layoutPadding: 24,
  compactContentWidth: 1440,
  disableRipple: false
}

export default themeConfig
