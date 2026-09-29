<template>
  <Transition name="start-menu">
    <div
      v-if="desktop.state.isStartMenuOpen"
      ref="menuRef"
      class="start-menu"
      role="menu"
      :aria-label="t('startMenu.aria')"
      @keydown.esc="desktop.closeStartMenu()"
    >
      <div class="start-menu__banner" aria-hidden="true">
        <span><strong>NORMUN</strong> OS 2000</span>
      </div>

      <ul class="start-menu__list">
        <li
          v-for="entry in entries"
          :key="entry.id"
          class="start-menu__entry"
          :class="{ 'start-menu__entry--separator': entry.separator }"
          @mouseenter="handleHover(entry)"
        >
          <button
            type="button"
            role="menuitem"
            class="start-menu__item"
            :class="{ 'start-menu__item--open': openSubmenu === entry.id }"
            :aria-haspopup="entry.children ? 'menu' : undefined"
            :aria-expanded="entry.children ? openSubmenu === entry.id : undefined"
            @click="activate(entry)"
          >
            <span class="start-menu__icon">
              <img v-if="entry.icon" :src="entry.icon" alt="">
              <span v-else aria-hidden="true">{{ entry.glyph }}</span>
            </span>
            <span class="start-menu__label">{{ entry.label }}</span>
            <span v-if="entry.children" class="start-menu__arrow" aria-hidden="true">▸</span>
          </button>

          <Transition name="start-submenu">
            <ul v-if="entry.children && openSubmenu === entry.id" class="start-menu__submenu" role="menu">
              <li v-for="child in entry.children" :key="child.id">
                <button
                  type="button"
                  :role="child.checked === undefined ? 'menuitem' : 'menuitemcheckbox'"
                  :aria-checked="child.checked"
                  class="start-menu__item start-menu__item--small"
                  @click="activate(child)"
                >
                  <span class="start-menu__icon start-menu__icon--small">
                    <img v-if="child.icon" :src="child.icon" alt="">
                    <span v-else aria-hidden="true">{{ child.glyph }}</span>
                  </span>
                  <span class="start-menu__label">{{ child.label }}</span>
                  <span v-if="child.checked" class="start-menu__check" aria-hidden="true">✓</span>
                </button>
              </li>
            </ul>
          </Transition>
        </li>
      </ul>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AppLocale } from '../i18n'
import { desktop } from '../stores/desktop'

type MenuEntry = {
  id: string
  label: string
  icon?: string
  glyph?: string
  checked?: boolean
  separator?: boolean
  children?: MenuEntry[]
  run?: () => void
}

const { t, locale } = useI18n()
const menuRef = ref<HTMLElement | null>(null)
const openSubmenu = ref<string | null>(null)

// Static URLs so Vite only bundles the icons actually used.
const ICON = {
  brain: new URL('../assets/brain.svg', import.meta.url).href,
  clip: new URL('../assets/clip.svg', import.meta.url).href,
  computer: new URL('../assets/computer.svg', import.meta.url).href,
  doc: new URL('../assets/doc.svg', import.meta.url).href,
  folder: new URL('../assets/folder.svg', import.meta.url).href,
  gear: new URL('../assets/gear.svg', import.meta.url).href,
  mic: new URL('../assets/mic.svg', import.meta.url).href,
  on: new URL('../assets/on.svg', import.meta.url).href,
  prompt: new URL('../assets/prompt.svg', import.meta.url).href,
}

const setLocale = (next: AppLocale) => {
  locale.value = next
}

const entries = computed<MenuEntry[]>(() => [
  {
    id: 'programs',
    label: t('startMenu.programs'),
    icon: ICON.folder,
    children: [
      { id: 'my-work', label: t('taskbar.windows.my-work'), icon: ICON.folder, run: () => desktop.run('my-work') },
      { id: 'player', label: t('taskbar.windows.media-player'), icon: ICON.mic, run: () => desktop.run('media-player') },
      { id: 'snake', label: t('taskbar.windows.snake'), icon: ICON.brain, run: () => desktop.run('snake') },
      { id: 'cmd', label: t('startMenu.msdos'), icon: ICON.prompt, run: () => desktop.run('terminal') },
      { id: 'bubbles', label: t('startMenu.screensaver'), glyph: '◎', run: () => desktop.run('screensaver') },
    ],
  },
  {
    id: 'documents',
    label: t('startMenu.documents'),
    icon: ICON.doc,
    children: [
      { id: 'resume', label: t('taskbar.windows.resume'), icon: ICON.doc, run: () => desktop.run('resume') },
      { id: 'about', label: t('taskbar.windows.about'), icon: ICON.doc, run: () => desktop.run('about') },
      { id: 'welcome', label: t('taskbar.windows.welcome'), icon: ICON.computer, run: () => desktop.run('welcome') },
    ],
  },
  {
    id: 'settings',
    label: t('startMenu.settings'),
    icon: ICON.gear,
    children: [
      { id: 'dark', label: t('startMenu.darkMode'), glyph: '◐', checked: desktop.state.isDarkMode, run: desktop.toggleDarkMode },
      { id: '3d', label: t('startMenu.wallpaper3d'), glyph: '✦', checked: desktop.state.isSceneEnabled, run: desktop.toggleScene },
      {
        id: 'assistant',
        label: t('startMenu.assistant'),
        icon: ICON.clip,
        checked: desktop.state.isAssistantVisible,
        run: () => (desktop.state.isAssistantVisible ? desktop.hideAssistant() : desktop.showAssistant()),
      },
      { id: 'en', label: 'English', glyph: 'EN', checked: locale.value === 'en', run: () => setLocale('en') },
      { id: 'pt-BR', label: 'Português (BR)', glyph: 'PT', checked: locale.value === 'pt-BR', run: () => setLocale('pt-BR') },
      { id: 'es', label: 'Español', glyph: 'ES', checked: locale.value === 'es', run: () => setLocale('es') },
    ],
  },
  { id: 'help', label: t('startMenu.help'), glyph: '?', run: () => desktop.run('assistant') },
  { id: 'run', label: t('startMenu.run'), icon: ICON.prompt, run: () => desktop.run('terminal') },
  { id: 'shutdown', label: t('startMenu.shutdown'), icon: ICON.on, separator: true, run: () => desktop.run('shutdown-dialog') },
])

const handleHover = (entry: MenuEntry) => {
  // Desktop behaviour: submenus fly out on hover. Touch devices rely on taps instead.
  if (window.matchMedia('(hover: hover)').matches) {
    openSubmenu.value = entry.children ? entry.id : null
  }
}

const activate = (entry: MenuEntry) => {
  if (entry.children) {
    // With a mouse the hover already opened it, so a click must not toggle it shut again.
    const canHover = window.matchMedia('(hover: hover)').matches
    openSubmenu.value = canHover || openSubmenu.value !== entry.id ? entry.id : null
    return
  }

  entry.run?.()

  // Toggles stay open so several settings can be flipped in a row.
  if (entry.checked === undefined) {
    desktop.closeStartMenu()
  }
}

const handleDocumentPointerDown = (event: PointerEvent) => {
  const target = event.target as HTMLElement | null

  if (!menuRef.value?.contains(target) && !target?.closest('[data-start-button]')) {
    desktop.closeStartMenu()
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    desktop.closeStartMenu()
  }
}

watch(
  () => desktop.state.isStartMenuOpen,
  (isOpen) => {
    openSubmenu.value = null

    if (isOpen) {
      document.addEventListener('pointerdown', handleDocumentPointerDown)
      document.addEventListener('keydown', handleKeydown)
    } else {
      document.removeEventListener('pointerdown', handleDocumentPointerDown)
      document.removeEventListener('keydown', handleKeydown)
    }
  },
)

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.start-menu {
  position: absolute;
  left: 0.4rem;
  bottom: calc(100% + 2px);
  z-index: 60;
  display: flex;
  width: 270px;
  border: 2px solid;
  border-color: #fff #404040 #404040 #fff;
  background: #c0c0c0;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.35), inset 1px 1px 0 #dfdfdf;
  font-family: var(--font-tertiary);
  transform-origin: bottom left;
}

.start-menu__banner {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 34px;
  padding: 0.6rem 0;
  overflow: hidden;
  background: linear-gradient(0deg, #b300b3 0%, #5a0a6e 45%, #12021c 100%);
}

.start-menu__banner::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.25), transparent 60%);
}

.start-menu__banner span {
  color: #ffd6f7;
  font-size: 1.15rem;
  letter-spacing: 0.02em;
  white-space: nowrap;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}

.start-menu__banner strong {
  color: #fff;
  font-weight: 800;
}

.start-menu__list {
  flex: 1;
  padding: 0.2rem;
}

.start-menu__entry {
  position: relative;
}

.start-menu__entry--separator {
  margin-top: 0.3rem;
  padding-top: 0.3rem;
  border-top: 2px groove #fff;
}

.start-menu__item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  min-height: 40px;
  padding: 0.3rem 0.5rem;
  border: 0;
  background: transparent;
  color: #111;
  font: inherit;
  font-size: 0.92rem;
  text-align: left;
  cursor: pointer;
}

.start-menu__item:hover,
.start-menu__item:focus-visible,
.start-menu__item--open {
  outline: none;
  background: linear-gradient(90deg, #b300b3, #d61bd6);
  color: #fff;
}

.start-menu__item:hover img,
.start-menu__item:focus-visible img,
.start-menu__item--open img {
  filter: brightness(0) invert(1);
}

.start-menu__icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 28px;
  height: 28px;
  font-family: var(--font-secondary);
  font-size: 0.8rem;
  font-weight: 700;
}

.start-menu__icon img {
  width: 24px;
  height: 24px;
}

.start-menu__icon--small {
  width: 20px;
  height: 20px;
}

.start-menu__icon--small img {
  width: 18px;
  height: 18px;
}

.start-menu__label {
  flex: 1;
}

.start-menu__arrow,
.start-menu__check {
  font-size: 0.75rem;
}

.start-menu__submenu {
  position: absolute;
  left: calc(100% - 4px);
  top: -4px;
  z-index: 1;
  min-width: 220px;
  padding: 0.2rem;
  border: 2px solid;
  border-color: #fff #404040 #404040 #fff;
  background: #c0c0c0;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.35);
}

.start-menu__item--small {
  min-height: 32px;
  font-size: 0.84rem;
}

.start-menu-enter-active,
.start-menu-leave-active {
  transition: transform 180ms cubic-bezier(0.2, 0.9, 0.3, 1.2), opacity 140ms ease;
}

.start-menu-enter-from,
.start-menu-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}

.start-submenu-enter-active {
  transition: clip-path 160ms ease-out;
}

.start-submenu-enter-from {
  clip-path: inset(0 100% 0 0);
}

@media (max-width: 720px) {
  .start-menu {
    right: 0.4rem;
    width: auto;
    max-height: calc(100dvh - var(--taskbar-height, 60px) - 1rem);
    overflow-y: auto;
  }

  .start-menu__submenu {
    position: static;
    min-width: 0;
    margin: 0 0 0.3rem 1.2rem;
    border-color: #808080 #fff #fff #808080;
    box-shadow: none;
  }
}
</style>
