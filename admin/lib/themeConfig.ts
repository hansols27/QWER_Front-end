import type { Mode, Skin } from '../theme/types'

export type Config = {
  templateName: string
  settingsCookieName: string
  mode: Mode
  layoutPadding: number
  compactContentWidth: number
  disableRipple: boolean
}

// SkinType은 필요 시 export 가능
export const SkinType: Skin = 'default'

const themeConfig: Config = {
  templateName: 'Materio',
  settingsCookieName: 'materio-mui-next-free-demo',
  mode: 'light',
  layoutPadding: 24,
  compactContentWidth: 1440,
  disableRipple: false
}

export default themeConfig
