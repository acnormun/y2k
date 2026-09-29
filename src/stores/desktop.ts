import { reactive, readonly, watch } from 'vue'
import { prefersReducedMotion } from '../three/utils'

export type WindowId = 'welcome' | 'my-work' | 'about' | 'resume' | 'contact' | 'snake' | 'media-player'
export type Overlay = 'boot' | 'screensaver' | 'shutdown-dialog' | 'shutdown' | 'bsod'
export type DesktopAction = WindowId | 'terminal' | Exclude<Overlay, 'boot'> | 'reboot' | 'assistant'

export const WINDOW_IDS: WindowId[] = ['welcome', 'my-work', 'about', 'resume', 'contact', 'snake', 'media-player']

const STORAGE = {
  theme: 'portfolio-dark-mode',
  scene: 'portfolio-3d',
  assistant: 'portfolio-assistant',
  assistantTips: 'portfolio-assistant-tips',
  booted: 'portfolio-booted',
}

const readStorage = (storage: 'localStorage' | 'sessionStorage', key: string) => {
  try {
    return typeof window === 'undefined' ? null : window[storage].getItem(key)
  } catch {
    return null
  }
}

const writeStorage = (storage: 'localStorage' | 'sessionStorage', key: string, value: string) => {
  try {
    window[storage].setItem(key, value)
  } catch {
    // Storage can be unavailable (private mode, blocked cookies); the preference just won't persist.
  }
}

// The boot animation plays once per browser session and never for reduced-motion users.
const shouldBoot = readStorage('sessionStorage', STORAGE.booted) !== 'true' && !prefersReducedMotion()

const state = reactive({
  activeWindow: 'welcome' as WindowId | null,
  openWindows: ['welcome'] as WindowId[],
  isTerminalOpen: false,
  isStartMenuOpen: false,
  overlay: (shouldBoot ? 'boot' : null) as Overlay | null,
  isDarkMode: readStorage('localStorage', STORAGE.theme) === 'true',
  isSceneEnabled: readStorage('localStorage', STORAGE.scene) !== 'false',
  isAssistantVisible: readStorage('localStorage', STORAGE.assistant) !== 'false',
  areAssistantTipsEnabled: readStorage('localStorage', STORAGE.assistantTips) !== 'false',
  // Bumps on every window/terminal open so observers (the assistant) can react to repeats too.
  lastOpened: null as { target: WindowId | 'terminal'; at: number } | null,
  assistantSummons: 0,
})

watch(() => state.isDarkMode, (value) => writeStorage('localStorage', STORAGE.theme, String(value)))
watch(() => state.isSceneEnabled, (value) => writeStorage('localStorage', STORAGE.scene, String(value)))
watch(() => state.isAssistantVisible, (value) => writeStorage('localStorage', STORAGE.assistant, String(value)))
watch(() => state.areAssistantTipsEnabled, (value) => writeStorage('localStorage', STORAGE.assistantTips, String(value)))

const openWindow = (id: WindowId) => {
  if (!state.openWindows.includes(id)) {
    state.openWindows.push(id)
  }

  state.activeWindow = id
  state.isStartMenuOpen = false
  state.lastOpened = { target: id, at: Date.now() }
}

const closeWindow = (id: WindowId) => {
  state.openWindows = state.openWindows.filter((windowId) => windowId !== id)

  if (state.activeWindow === id) {
    state.activeWindow = null
  }
}

const minimizeWindow = (id: WindowId) => {
  if (state.activeWindow === id) {
    state.activeWindow = null
  }
}

// Taskbar button behaviour: focus a background window, minimize the focused one.
const toggleTaskbarWindow = (id: WindowId) => {
  if (state.activeWindow === id) {
    minimizeWindow(id)
  } else {
    openWindow(id)
  }
}

const openTerminal = () => {
  state.isTerminalOpen = true
  state.isStartMenuOpen = false
  state.lastOpened = { target: 'terminal', at: Date.now() }
}

const closeTerminal = () => {
  state.isTerminalOpen = false
}

const setOverlay = (overlay: Overlay | null) => {
  state.overlay = overlay
  state.isStartMenuOpen = false
}

const finishBoot = () => {
  writeStorage('sessionStorage', STORAGE.booted, 'true')
  setOverlay(null)
}

const showAssistant = () => {
  state.isAssistantVisible = true
  state.assistantSummons += 1
  state.isStartMenuOpen = false
}

// Single entry point used by the Start menu, terminal, desktop icons and the assistant.
const run = (action: DesktopAction) => {
  switch (action) {
    case 'terminal':
      openTerminal()
      break
    case 'reboot':
      setOverlay('boot')
      break
    case 'screensaver':
    case 'shutdown-dialog':
    case 'shutdown':
    case 'bsod':
      setOverlay(action)
      break
    case 'assistant':
      showAssistant()
      break
    default:
      openWindow(action)
  }
}

export const desktop = {
  state: readonly(state),
  openWindow,
  closeWindow,
  minimizeWindow,
  toggleTaskbarWindow,
  openTerminal,
  closeTerminal,
  setOverlay,
  finishBoot,
  run,
  showAssistant,
  hideAssistant: () => {
    state.isAssistantVisible = false
  },
  setAssistantTips: (enabled: boolean) => {
    state.areAssistantTipsEnabled = enabled
  },
  toggleStartMenu: () => {
    state.isStartMenuOpen = !state.isStartMenuOpen
  },
  closeStartMenu: () => {
    state.isStartMenuOpen = false
  },
  toggleDarkMode: () => {
    state.isDarkMode = !state.isDarkMode
  },
  toggleScene: () => {
    state.isSceneEnabled = !state.isSceneEnabled
  },
}
