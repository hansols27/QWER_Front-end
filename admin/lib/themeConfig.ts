import type { Mode, Skin } from '@theme/types'

export type Config = {
  templateName: string
  settingsCookieName: string
  mode: Mode
  layoutPadding: number
  compactContentWidth: number
  disableRipple: boolean
}

export const SkinType: Skin = 'default' // 필요에 따라 export 가능

const themeConfig: Config = {
  templateName: 'Materio',
  settingsCookieName: 'materio-mui-next-free-demo',
  mode: 'light',
  layoutPadding: 24,
  compactContentWidth: 1440,
  disableRipple: false
}

export default themeConfig
export type { Skin } // 
