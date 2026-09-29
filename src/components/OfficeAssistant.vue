<template>
  <Transition name="assistant">
    <div
      v-if="desktop.state.isAssistantVisible && desktop.state.overlay === null"
      class="office-assistant theme-reinvert"
      :class="{
        'office-assistant--dragging': isDragging,
        'office-assistant--dancing': isDancing,
        'office-assistant--brows': browsUp || Boolean(balloon),
        'office-assistant--custom': position !== null,
      }"
      :style="rootStyle"
    >
      <Transition name="balloon">
        <div
          v-if="balloon"
          :key="balloonKey"
          class="assistant-balloon"
          :class="{ 'assistant-balloon--below': balloonBelow, 'assistant-balloon--left': balloonLeft }"
          role="dialog"
          :aria-label="t('assistant.aria')"
          @keydown.esc="closeBalloon"
        >
          <p v-if="balloon.title" class="assistant-balloon__title">{{ balloon.title }}</p>
          <p v-if="balloon.text" class="assistant-balloon__text" aria-live="polite">
            {{ typedText }}<span v-if="typedText.length < balloon.text.length" class="assistant-balloon__caret" aria-hidden="true">▌</span>
          </p>

          <ul v-if="balloon.options?.length" class="assistant-balloon__options">
            <li v-for="option in balloon.options" :key="option.label">
              <button type="button" class="assistant-balloon__option" @click="option.run()">
                {{ option.label }}
              </button>
            </li>
          </ul>

          <form v-if="balloon.search" class="assistant-balloon__search" @submit.prevent="runSearch">
            <textarea
              ref="searchRef"
              v-model="query"
              rows="2"
              :placeholder="t('assistant.searchPlaceholder')"
              :aria-label="t('assistant.searchPlaceholder')"
              @keydown.enter.exact.prevent="runSearch"
            />
          </form>

          <div v-if="balloon.buttons?.length" class="assistant-balloon__buttons">
            <button
              v-for="button in balloon.buttons"
              :key="button.label"
              type="button"
              class="assistant-balloon__button"
              @click="button.run()"
            >
              {{ button.label }}
            </button>
          </div>
        </div>
      </Transition>

      <Transition name="bulb">
        <button
          v-if="hasIdea && !balloon"
          type="button"
          class="office-assistant__bulb"
          :aria-label="t('assistant.bulb')"
          :title="t('assistant.bulb')"
          @click="showTip"
        >
          <svg viewBox="0 0 24 32" aria-hidden="true">
            <path d="M12 1.5a9 9 0 0 0-5 16.5c1 .8 1.5 2 1.5 3.2v1.3h7v-1.3c0-1.2.5-2.4 1.5-3.2a9 9 0 0 0-5-16.5Z" fill="#fff36b" stroke="#6b5a00" stroke-width="1.4" />
            <path d="M8.5 25h7M9 28h6M10.5 31h3" stroke="#6b5a00" stroke-width="1.8" stroke-linecap="round" />
            <path d="M9 9.5a3.5 3.5 0 0 1 3-3" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none" />
          </svg>
        </button>
      </Transition>

      <button
        ref="characterRef"
        type="button"
        class="office-assistant__character"
        :class="animation ? `office-assistant__character--${animation}` : ''"
        :aria-label="t('assistant.aria')"
        :aria-expanded="Boolean(balloon)"
        @pointerdown="handlePointerDown"
        @click="handleClick"
        @contextmenu.prevent="openContextMenu"
        @mouseenter="browsUp = true"
        @mouseleave="browsUp = false"
      >
        <svg class="clippy" viewBox="0 0 130 172" aria-hidden="true">
          <defs>
            <linearGradient id="clippy-wire" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stop-color="#5f6874" />
              <stop offset="0.32" stop-color="#f6f8fb" />
              <stop offset="0.62" stop-color="#aeb7c3" />
              <stop offset="1" stop-color="#565e69" />
            </linearGradient>
            <linearGradient id="clippy-paper" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stop-color="#fffbc7" />
              <stop offset="1" stop-color="#f3e27a" />
            </linearGradient>
          </defs>

          <g class="clippy__paper">
            <path d="M12 142 L96 128 Q104 127 108 134 L119 152 Q121 158 113 159 L28 169 Q20 170 18 163 Z" fill="url(#clippy-paper)" stroke="#a88f2a" stroke-width="1.5" />
            <path d="M30 149 L101 137 M33 156 L106 144 M36 163 L111 151" stroke="#8fb6e8" stroke-width="1.2" />
            <path d="M24 146 L28 166" stroke="#e88f8f" stroke-width="1.2" />
          </g>

          <g class="clippy__body">
            <path :d="CLIP_PATH" class="clippy__wire-shadow" transform="translate(2.5 2.5)" />
            <path :d="CLIP_PATH" class="clippy__wire" />
            <path :d="CLIP_PATH" class="clippy__wire-shine" transform="translate(-1.3 -1)" />

            <g v-for="eye in EYES" :key="eye.x" :transform="`translate(${eye.x} ${eye.y})`">
              <g class="clippy__eye" :class="{ 'clippy__eye--closed': isBlinking }">
                <ellipse rx="9.5" ry="11.5" fill="#fff" stroke="#1d1d1d" stroke-width="1.6" />
                <circle :cx="pupil.x" :cy="pupil.y" r="4.3" fill="#111" />
                <circle :cx="pupil.x - 1.5" :cy="pupil.y - 1.7" r="1.3" fill="#fff" />
              </g>
            </g>

            <path class="clippy__brow clippy__brow--left" d="M44 36 Q53 28 62 34" />
            <path class="clippy__brow clippy__brow--right" d="M67 34 Q76 28 85 36" />
          </g>
        </svg>
      </button>

      <ul v-if="contextMenu" class="office-assistant__menu" role="menu">
        <li><button type="button" role="menuitem" @click="hide">{{ t('assistant.hide') }}</button></li>
        <li><button type="button" role="menuitem" @click="animateRandom(); contextMenu = false">{{ t('assistant.animate') }}</button></li>
        <li><button type="button" role="menuitem" @click="showOptions(); contextMenu = false">{{ t('assistant.optionsMenu') }}</button></li>
      </ul>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { desktop, type DesktopAction, type WindowId } from '../stores/desktop'
import { player } from '../stores/player'
import { prefersReducedMotion } from '../three/utils'

type BalloonAction = { label: string; run: () => void }
type Balloon = {
  title?: string
  text?: string
  options?: BalloonAction[]
  buttons?: BalloonAction[]
  search?: boolean
  autoCloseMs?: number
}
type Animation = 'attention' | 'bounce' | 'spin' | 'wiggle' | 'think' | 'appear'

// Paperclip centreline: inner leg, bottom loop, right leg, head loop, outer leg and the curled foot.
const CLIP_PATH = 'M64 80 L64 118 Q64 130 74 130 Q84 130 84 118 L84 46 Q84 26 64 26 Q44 26 44 46 L44 126 Q44 145 63 145 Q80 145 88 136'
const EYES = [
  { x: 54, y: 52 },
  { x: 75, y: 52 },
]
const EYE_ANCHOR = { x: 64.5 / 130, y: 52 / 172 }
const MAIL = 'anaclaranoronha.m@gmail.com'
const SESSION_KEYS = { intro: 'portfolio-clippy-intro', contexts: 'portfolio-clippy-contexts' }

const SEARCH_INDEX: Array<{ action: DesktopAction; keywords: string[] }> = [
  { action: 'my-work', keywords: ['project', 'projeto', 'proyecto', 'work', 'trabalho', 'trabajo', 'portfolio', 'app'] },
  { action: 'resume', keywords: ['resume', 'cv', 'curriculo', 'currículo', 'experience', 'experiencia', 'experiência', 'job', 'emprego', 'empleo'] },
  { action: 'contact', keywords: ['contact', 'contato', 'contacto', 'email', 'mail', 'hire', 'contratar', 'linkedin', 'github'] },
  { action: 'about', keywords: ['about', 'sobre', 'who', 'quem', 'quien', 'quién', 'skill', 'habilidade', 'ana'] },
  { action: 'media-player', keywords: ['music', 'musica', 'música', 'song', 'player', 'headspace', 'audio'] },
  { action: 'snake', keywords: ['snake', 'game', 'jogo', 'juego', 'cobra', 'serpiente'] },
  { action: 'terminal', keywords: ['terminal', 'cmd', 'command', 'comando', 'dos', 'hack'] },
  { action: 'bsod', keywords: ['crash', 'bsod', 'blue screen', 'tela azul', 'pantalla azul', 'error'] },
]

const { t, tm } = useI18n()
const reducedMotion = prefersReducedMotion()

const characterRef = ref<HTMLElement | null>(null)
const searchRef = ref<HTMLTextAreaElement | null>(null)
const balloon = ref<Balloon | null>(null)
const balloonKey = ref(0)
const typedText = ref('')
const query = ref('')
const animation = ref<Animation | null>(null)
const pupil = ref({ x: 0, y: 0 })
const isBlinking = ref(false)
const browsUp = ref(false)
const hasIdea = ref(false)
const contextMenu = ref(false)
const position = ref<{ x: number; y: number } | null>(null)
const isDragging = ref(false)

let suppressClick = false
let dragStart = { pointerX: 0, pointerY: 0, x: 0, y: 0 }
let typeTimer: number | null = null
let blinkTimer: number | null = null
let idleTimer: number | null = null
let animationTimer: number | null = null
let autoCloseTimer: number | null = null
let introTimer: number | null = null
let lookFrame = 0

const readSession = (key: string) => {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

const writeSession = (key: string, value: string) => {
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    // Non-critical: the tip may just show again.
  }
}

const shownContexts = new Set((readSession(SESSION_KEYS.contexts) ?? '').split(',').filter(Boolean))

const isDancing = computed(() => player.isPlaying.value && !animation.value && !isDragging.value)

const rootStyle = computed(() => ({
  '--beat': `${60 / player.track.value.bpm}s`,
  ...(position.value ? { left: `${position.value.x}px`, top: `${position.value.y}px` } : {}),
}))

const balloonBelow = computed(() => position.value !== null && position.value.y < 330)
const balloonLeft = computed(() => position.value !== null && position.value.x + 65 < window.innerWidth / 2)

/* ------------------------------------------------------------------ */
/* Balloon                                                              */
/* ------------------------------------------------------------------ */

const clearTimer = (timer: number | null) => {
  if (timer !== null) window.clearTimeout(timer)
}

const say = (next: Balloon) => {
  contextMenu.value = false
  hasIdea.value = false
  balloon.value = next
  balloonKey.value += 1
  clearTimer(typeTimer)
  clearTimer(autoCloseTimer)

  const text = next.text ?? ''

  if (reducedMotion || !text) {
    typedText.value = text
  } else {
    typedText.value = ''
    let index = 0
    const typeNext = () => {
      index += 2
      typedText.value = text.slice(0, index)
      if (index < text.length) typeTimer = window.setTimeout(typeNext, 16)
    }
    typeNext()
  }

  if (next.autoCloseMs) {
    autoCloseTimer = window.setTimeout(closeBalloon, next.autoCloseMs)
  }

  if (next.search) {
    void nextTick(() => searchRef.value?.focus())
  }
}

const closeBalloon = () => {
  balloon.value = null
  query.value = ''
  clearTimer(typeTimer)
  clearTimer(autoCloseTimer)
}

const go = (action: DesktopAction) => () => {
  closeBalloon()
  desktop.run(action)
}

const neverAgain = (): BalloonAction => ({
  label: t('assistant.never'),
  run: () => {
    desktop.setAssistantTips(false)
    closeBalloon()
  },
})

const showMenu = () => {
  say({
    title: t('assistant.menuTitle'),
    options: [
      { label: t('assistant.menu.projects'), run: go('my-work') },
      { label: t('assistant.menu.resume'), run: go('resume') },
      { label: t('assistant.menu.contact'), run: go('contact') },
      {
        label: t('assistant.menu.music'),
        run: () => {
          player.play()
          go('media-player')()
        },
      },
      { label: t('assistant.menu.joke'), run: tellJoke },
      { label: t('assistant.menu.tip'), run: showTip },
    ],
    search: true,
    buttons: [
      { label: t('assistant.optionsButton'), run: showOptions },
      { label: t('assistant.search'), run: runSearch },
      { label: t('assistant.close'), run: closeBalloon },
    ],
  })
}

const showOptions = () => {
  say({
    title: t('assistant.optionsTitle'),
    options: [
      {
        label: `${desktop.state.areAssistantTipsEnabled ? '☑' : '☐'} ${t('assistant.tipsToggle')}`,
        run: () => {
          desktop.setAssistantTips(!desktop.state.areAssistantTipsEnabled)
          showOptions()
        },
      },
      { label: t('assistant.hide'), run: hide },
    ],
    buttons: [
      { label: t('assistant.back'), run: showMenu },
      { label: t('assistant.ok'), run: closeBalloon },
    ],
  })
}

const pick = (key: string) => {
  const list = tm(key) as string[]
  return list[Math.floor(Math.random() * list.length)] ?? ''
}

const tellJoke = () => {
  playAnimation('wiggle')
  say({
    title: t('assistant.jokesTitle'),
    text: pick('assistant.jokes'),
    buttons: [
      { label: t('assistant.another'), run: tellJoke },
      { label: t('assistant.ok'), run: closeBalloon },
    ],
  })
}

const showTip = () => {
  playAnimation('think')
  say({
    title: t('assistant.tipsTitle'),
    text: pick('assistant.tips'),
    buttons: [
      { label: t('assistant.another'), run: showTip },
      { label: t('assistant.ok'), run: closeBalloon },
    ],
  })
}

const runSearch = () => {
  const text = query.value.trim()

  if (!text) {
    searchRef.value?.focus()
    return
  }

  const normalized = text.toLowerCase()
  const matches = SEARCH_INDEX.filter(({ keywords }) => keywords.some((keyword) => normalized.includes(keyword)))
  playAnimation('think')

  if (matches.length === 0) {
    say({
      text: t('assistant.searchNone', { query: text }),
      options: [
        { label: t('assistant.searchHire'), run: go('contact') },
        { label: t('assistant.searchAgain'), run: showMenu },
      ],
    })
    return
  }

  say({
    text: t('assistant.searchFound', { query: text }),
    options: matches.map(({ action }) => ({ label: t(`assistant.results.${action}`), run: go(action) })),
    buttons: [{ label: t('assistant.back'), run: showMenu }],
  })
}

const showIntro = () => {
  writeSession(SESSION_KEYS.intro, 'true')
  playAnimation('attention')
  say({
    text: t('assistant.intro.text'),
    options: [
      {
        label: t('assistant.intro.help'),
        run: () => {
          say({
            text: t('assistant.intro.helped'),
            options: [
              { label: t('assistant.menu.projects'), run: go('my-work') },
              { label: t('assistant.menu.resume'), run: go('resume') },
              { label: t('assistant.menu.contact'), run: go('contact') },
            ],
          })
        },
      },
      { label: t('assistant.intro.skip'), run: closeBalloon },
      neverAgain(),
    ],
  })
}

const CONTEXT_ACTIONS: Partial<Record<WindowId | 'terminal', () => void>> = {
  'my-work': go('resume'),
  resume: go('contact'),
  contact: () => {
    say({
      text: t('assistant.letterHelp'),
      options: [
        {
          label: t('assistant.openMail'),
          run: () => {
            window.location.href = `mailto:${MAIL}?subject=${encodeURIComponent(t('assistant.mailSubject'))}`
            closeBalloon()
          },
        },
      ],
      buttons: [{ label: t('assistant.close'), run: closeBalloon }],
    })
  },
  'media-player': () => {
    player.play()
    closeBalloon()
  },
  snake: () => {
    say({ text: t('assistant.procrastinateHelp'), buttons: [{ label: t('assistant.ok'), run: closeBalloon }] })
  },
  about: go('resume'),
  terminal: closeBalloon,
}

const showContextTip = (target: WindowId | 'terminal') => {
  const action = CONTEXT_ACTIONS[target]

  if (!action || shownContexts.has(target)) {
    return
  }

  shownContexts.add(target)
  writeSession(SESSION_KEYS.contexts, [...shownContexts].join(','))
  playAnimation('attention')
  say({
    text: t(`assistant.context.${target}`),
    options: [
      { label: t(`assistant.contextActions.${target}`), run: action },
      { label: t('assistant.skip'), run: closeBalloon },
      neverAgain(),
    ],
  })
}

/* ------------------------------------------------------------------ */
/* Character: animations, eyes, blinking                                */
/* ------------------------------------------------------------------ */

const ANIMATION_MS: Record<Animation, number> = {
  attention: 1300,
  bounce: 900,
  spin: 900,
  wiggle: 900,
  think: 1800,
  appear: 700,
}

const playAnimation = (name: Animation) => {
  if (reducedMotion) {
    return
  }

  clearTimer(animationTimer)
  animation.value = null

  // Restart the CSS animation even when the same one is requested twice in a row.
  requestAnimationFrame(() => {
    animation.value = name
    animationTimer = window.setTimeout(() => {
      animation.value = null
    }, ANIMATION_MS[name])
  })
}

const animateRandom = () => {
  const choices: Animation[] = ['bounce', 'spin', 'wiggle', 'think', 'attention']
  playAnimation(choices[Math.floor(Math.random() * choices.length)])
}

const scheduleBlink = () => {
  blinkTimer = window.setTimeout(() => {
    isBlinking.value = true
    window.setTimeout(() => {
      isBlinking.value = false
    }, 130)
    scheduleBlink()
  }, 2200 + Math.random() * 3800)
}

// Every so often, do something to remind people Clippy is alive (just like the original).
const scheduleIdle = () => {
  idleTimer = window.setTimeout(() => {
    const canAct = desktop.state.isAssistantVisible && desktop.state.overlay === null && !balloon.value && !isDragging.value

    if (canAct) {
      if (desktop.state.areAssistantTipsEnabled && Math.random() < 0.35) {
        hasIdea.value = true
      } else {
        animateRandom()
      }
    }

    scheduleIdle()
  }, 16000 + Math.random() * 14000)
}

const handleLook = (event: PointerEvent) => {
  cancelAnimationFrame(lookFrame)
  lookFrame = requestAnimationFrame(() => {
    const rect = characterRef.value?.getBoundingClientRect()

    if (!rect || animation.value === 'think') {
      return
    }

    const dx = event.clientX - (rect.left + rect.width * EYE_ANCHOR.x)
    const dy = event.clientY - (rect.top + rect.height * EYE_ANCHOR.y)
    const distance = Math.hypot(dx, dy) || 1
    const reach = Math.min(1, distance / 160)
    pupil.value = { x: (dx / distance) * 3.8 * reach, y: (dy / distance) * 4.6 * reach }
  })
}

watch(animation, (value) => {
  if (value === 'think') {
    pupil.value = { x: -3, y: -4.5 }
  }
})

/* ------------------------------------------------------------------ */
/* Pointer: click, drag, context menu                                   */
/* ------------------------------------------------------------------ */

const clampPosition = (x: number, y: number) => {
  const width = characterRef.value?.offsetWidth ?? 130
  const height = characterRef.value?.offsetHeight ?? 172
  return {
    x: Math.min(Math.max(4, x), window.innerWidth - width - 4),
    y: Math.min(Math.max(4, y), window.innerHeight - height - 4),
  }
}

const handleDragMove = (event: PointerEvent) => {
  const dx = event.clientX - dragStart.pointerX
  const dy = event.clientY - dragStart.pointerY

  if (!isDragging.value && Math.hypot(dx, dy) < 6) {
    return
  }

  isDragging.value = true
  suppressClick = true
  position.value = clampPosition(dragStart.x + dx, dragStart.y + dy)
}

const stopDrag = () => {
  isDragging.value = false
  window.removeEventListener('pointermove', handleDragMove)
  window.removeEventListener('pointerup', stopDrag)
}

const handlePointerDown = (event: PointerEvent) => {
  if (event.button !== 0) {
    return
  }

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  suppressClick = false
  dragStart = { pointerX: event.clientX, pointerY: event.clientY, x: rect.left, y: rect.top }
  window.addEventListener('pointermove', handleDragMove)
  window.addEventListener('pointerup', stopDrag)
}

const handleClick = () => {
  if (suppressClick) {
    suppressClick = false
    return
  }

  contextMenu.value = false

  if (balloon.value) {
    closeBalloon()
    return
  }

  playAnimation('bounce')
  showMenu()
}

const openContextMenu = () => {
  closeBalloon()
  contextMenu.value = !contextMenu.value
}

const handleDocumentPointerDown = (event: PointerEvent) => {
  if (contextMenu.value && !(event.target as HTMLElement).closest('.office-assistant')) {
    contextMenu.value = false
  }
}

const hide = () => {
  closeBalloon()
  contextMenu.value = false
  desktop.hideAssistant()
}

const handleResize = () => {
  if (position.value) {
    position.value = clampPosition(position.value.x, position.value.y)
  }
}

/* ------------------------------------------------------------------ */
/* Reactions to the rest of the desktop                                 */
/* ------------------------------------------------------------------ */

const canComment = () =>
  desktop.state.isAssistantVisible && desktop.state.areAssistantTipsEnabled && desktop.state.overlay === null

watch(
  () => desktop.state.lastOpened,
  (opened) => {
    if (opened && canComment() && !balloon.value) {
      window.setTimeout(() => {
        if (canComment() && !balloon.value) showContextTip(opened.target)
      }, 900)
    }
  },
)

watch(
  () => desktop.state.assistantSummons,
  async () => {
    await nextTick()
    playAnimation('appear')
    showMenu()
  },
)

watch(
  () => desktop.state.isDarkMode,
  (isDark) => {
    if (canComment() && !balloon.value) {
      playAnimation('spin')
      say({ text: isDark ? t('assistant.darkOn') : t('assistant.darkOff'), autoCloseMs: 3800 })
    }
  },
)

let hasCommentedOnMusic = false

watch(player.isPlaying, (isPlaying) => {
  if (isPlaying && !hasCommentedOnMusic && canComment() && !balloon.value) {
    hasCommentedOnMusic = true
    say({ text: t('assistant.music'), autoCloseMs: 3500 })
  }
})

// Introduce himself once per session, after the boot screen and a short pause.
const scheduleIntro = () => {
  clearTimer(introTimer)

  if (readSession(SESSION_KEYS.intro) === 'true') {
    return
  }

  introTimer = window.setTimeout(() => {
    if (canComment() && !balloon.value && readSession(SESSION_KEYS.intro) !== 'true') {
      showIntro()
    }
  }, 9000)
}

watch(
  () => desktop.state.overlay,
  (overlay) => {
    if (overlay === null) scheduleIntro()
    else closeBalloon()
  },
)

onMounted(() => {
  window.addEventListener('pointermove', handleLook, { passive: true })
  window.addEventListener('resize', handleResize)
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  scheduleBlink()
  scheduleIdle()

  if (desktop.state.overlay === null) {
    scheduleIntro()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', handleLook)
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  stopDrag()
  cancelAnimationFrame(lookFrame)
  ;[typeTimer, blinkTimer, idleTimer, animationTimer, autoCloseTimer, introTimer].forEach(clearTimer)
})
</script>

<style scoped>
.office-assistant {
  position: fixed;
  right: 16px;
  bottom: calc(var(--taskbar-height, 56px) + 10px);
  z-index: 52;
  width: 124px;
}

.office-assistant--custom {
  right: auto;
  bottom: auto;
}

/* ---------------- Character ---------------- */

.office-assistant__character {
  display: block;
  width: 124px;
  height: 164px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: grab;
  touch-action: none;
  filter: drop-shadow(0 10px 12px rgba(0, 0, 0, 0.22));
  animation: clippy-float 3.2s ease-in-out infinite;
}

.office-assistant--dragging .office-assistant__character {
  cursor: grabbing;
  animation: none;
  transform: scale(1.06) rotate(-4deg);
}

.office-assistant--dancing .office-assistant__character {
  animation: clippy-dance var(--beat) ease-in-out infinite alternate;
}

.clippy {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.clippy__body {
  transform-box: fill-box;
  transform-origin: 50% 100%;
}

.clippy__wire,
.clippy__wire-shadow,
.clippy__wire-shine {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.clippy__wire {
  stroke: url(#clippy-wire);
  stroke-width: 7.5;
}

.clippy__wire-shadow {
  stroke: #2d3138;
  stroke-width: 8.5;
  opacity: 0.25;
}

.clippy__wire-shine {
  stroke: #fff;
  stroke-width: 1.6;
  opacity: 0.75;
}

.clippy__eye {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 90ms ease;
}

.clippy__eye--closed {
  transform: scaleY(0.08);
}

.clippy__eye circle {
  transition: cx 120ms ease-out, cy 120ms ease-out;
}

.clippy__brow {
  fill: none;
  stroke: #151515;
  stroke-width: 3.6;
  stroke-linecap: round;
  transition: transform 220ms cubic-bezier(0.3, 1.6, 0.5, 1);
}

.office-assistant--brows .clippy__brow {
  transform: translateY(-5px);
}

.office-assistant__character--think .clippy__brow--left {
  transform: translateY(-7px) rotate(-8deg);
}

.office-assistant__character--think .clippy__brow--right {
  transform: translateY(1px);
}

.office-assistant__character--attention {
  animation: clippy-attention 1.3s ease-in-out both !important;
}

.office-assistant__character--bounce {
  animation: clippy-bounce 0.9s cubic-bezier(0.3, 1.4, 0.5, 1) both !important;
}

.office-assistant__character--spin {
  animation: clippy-spin 0.9s ease-in-out both !important;
}

.office-assistant__character--wiggle {
  animation: clippy-wiggle 0.9s ease-in-out both !important;
}

.office-assistant__character--think {
  animation: clippy-think 1.8s ease-in-out both !important;
}

.office-assistant__character--appear {
  animation: clippy-appear 0.7s cubic-bezier(0.2, 1.4, 0.4, 1) both !important;
}

/* ---------------- Light bulb ---------------- */

.office-assistant__bulb {
  position: absolute;
  top: -34px;
  left: 50%;
  width: 30px;
  height: 40px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  filter: drop-shadow(0 0 10px rgba(255, 240, 80, 0.9));
  transform: translateX(-50%);
  animation: clippy-bulb 1.4s ease-in-out infinite;
}

.bulb-enter-active,
.bulb-leave-active {
  transition: opacity 220ms ease, transform 300ms cubic-bezier(0.3, 1.5, 0.5, 1);
}

.bulb-enter-from,
.bulb-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px) scale(0.4);
}

/* ---------------- Office 97 balloon ---------------- */

.assistant-balloon {
  position: absolute;
  right: 12px;
  bottom: calc(100% + 14px);
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  width: min(290px, calc(100vw - 24px));
  padding: 0.8rem 0.9rem 0.85rem;
  border: 1px solid #000;
  border-radius: 12px;
  background: #ffffe1;
  box-shadow: 3px 4px 0 rgba(0, 0, 0, 0.18), 0 10px 26px rgba(0, 0, 0, 0.12);
  color: #000;
  font-family: Tahoma, Verdana, 'Segoe UI', var(--font-primary), sans-serif;
  font-size: 0.8rem;
  line-height: 1.4;
  transform-origin: 85% 100%;
}

/* Speech tail pointing at Clippy. */
.assistant-balloon::after,
.assistant-balloon::before {
  content: '';
  position: absolute;
  right: 34px;
  width: 0;
  height: 0;
  border-style: solid;
}

.assistant-balloon::before {
  bottom: -17px;
  border-width: 17px 0 0 17px;
  border-color: #000 transparent transparent transparent;
}

.assistant-balloon::after {
  bottom: -15px;
  right: 35px;
  border-width: 15px 0 0 15px;
  border-color: #ffffe1 transparent transparent transparent;
}

.assistant-balloon--left {
  right: auto;
  left: 12px;
  transform-origin: 15% 100%;
}

.assistant-balloon--left::before,
.assistant-balloon--left::after {
  right: auto;
  left: 34px;
  border-width: 17px 17px 0 0;
}

.assistant-balloon--left::after {
  left: 35px;
  border-width: 15px 15px 0 0;
}

.assistant-balloon--below {
  top: calc(100% + 14px);
  bottom: auto;
  transform-origin: 85% 0%;
}

.assistant-balloon--below::before {
  top: -17px;
  bottom: auto;
  border-width: 0 0 17px 17px;
  border-color: transparent transparent #000 transparent;
}

.assistant-balloon--below::after {
  top: -15px;
  bottom: auto;
  border-width: 0 0 15px 15px;
  border-color: transparent transparent #ffffe1 transparent;
}

.balloon-enter-active {
  transition: opacity 160ms ease, transform 260ms cubic-bezier(0.2, 1.4, 0.4, 1);
}

.balloon-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
}

.balloon-enter-from,
.balloon-leave-to {
  opacity: 0;
  transform: scale(0.7);
}

.assistant-balloon__title {
  font-weight: 700;
}

.assistant-balloon__caret {
  animation: clippy-caret 600ms steps(1) infinite;
}

.assistant-balloon__options {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.assistant-balloon__option {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  width: 100%;
  padding: 0.2rem 0.3rem;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #000;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

/* Office 97's blue bullet buttons. */
.assistant-balloon__option::before {
  content: '';
  flex-shrink: 0;
  width: 11px;
  height: 11px;
  margin-top: 0.2rem;
  border: 1px solid #0a2c7a;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #d3e8ff 0%, #4d93f0 45%, #123f9c 100%);
}

.assistant-balloon__option:hover,
.assistant-balloon__option:focus-visible {
  border-color: #7f9db9;
  outline: none;
  background: #fff;
  color: #0b37a8;
  text-decoration: underline;
}

.assistant-balloon__search textarea {
  width: 100%;
  padding: 0.35rem 0.45rem;
  border: 2px solid;
  border-color: #808080 #fff #fff #808080;
  background: #fff;
  color: #000;
  font: inherit;
  resize: none;
}

.assistant-balloon__buttons {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.assistant-balloon__button {
  min-width: 64px;
  padding: 0.2rem 0.6rem;
  border: 2px solid;
  border-color: #fff #404040 #404040 #fff;
  background: #d4d0c8;
  color: #000;
  font: inherit;
  cursor: pointer;
}

.assistant-balloon__button:active {
  border-color: #404040 #fff #fff #404040;
}

/* ---------------- Right-click menu ---------------- */

.office-assistant__menu {
  position: absolute;
  right: 60%;
  bottom: 60%;
  min-width: 150px;
  padding: 0.15rem;
  border: 2px solid;
  border-color: #fff #404040 #404040 #fff;
  background: #c0c0c0;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.35);
  font-family: Tahoma, Verdana, var(--font-primary), sans-serif;
  font-size: 0.8rem;
}

.office-assistant__menu button {
  width: 100%;
  padding: 0.3rem 0.8rem;
  border: 0;
  background: transparent;
  color: #000;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.office-assistant__menu button:hover {
  background: #b300b3;
  color: #fff;
}

/* ---------------- Show / hide ---------------- */

.assistant-enter-active {
  transition: opacity 250ms ease, transform 500ms cubic-bezier(0.2, 1.4, 0.4, 1);
}

.assistant-leave-active {
  transition: opacity 350ms ease, transform 400ms cubic-bezier(0.6, -0.4, 0.8, 0.4);
}

.assistant-enter-from,
.assistant-leave-to {
  opacity: 0;
  transform: scale(0.1) rotate(-25deg);
}

@keyframes clippy-float {
  50% {
    transform: translateY(-4px);
  }
}

@keyframes clippy-dance {
  from {
    transform: translateY(0) rotate(-5deg) scaleY(1.02);
  }

  to {
    transform: translateY(-9px) rotate(5deg) scaleY(0.97);
  }
}

@keyframes clippy-attention {
  0% {
    transform: none;
  }

  25% {
    transform: scale(1.35) translateY(-18px);
  }

  35%,
  55% {
    transform: scale(1.35) translateY(-18px) rotate(-6deg);
  }

  45%,
  65% {
    transform: scale(1.38) translateY(-14px) rotate(4deg);
  }

  100% {
    transform: none;
  }
}

@keyframes clippy-bounce {
  0%,
  100% {
    transform: none;
  }

  30% {
    transform: translateY(4px) scale(1.08, 0.9);
  }

  55% {
    transform: translateY(-26px) scale(0.94, 1.08);
  }

  80% {
    transform: translateY(0) scale(1.05, 0.95);
  }
}

@keyframes clippy-spin {
  from {
    transform: perspective(400px) rotateY(0);
  }

  to {
    transform: perspective(400px) rotateY(360deg);
  }
}

@keyframes clippy-wiggle {
  0%,
  100% {
    transform: none;
  }

  20%,
  60% {
    transform: rotate(-9deg) skewX(4deg);
  }

  40%,
  80% {
    transform: rotate(9deg) skewX(-4deg);
  }
}

@keyframes clippy-think {
  0%,
  100% {
    transform: none;
  }

  20%,
  80% {
    transform: rotate(-6deg) translateX(-4px);
  }
}

@keyframes clippy-appear {
  from {
    transform: scale(0.2) translateY(40px);
  }
}

@keyframes clippy-bulb {
  50% {
    transform: translate(-50%, -4px) rotate(6deg);
  }
}

@keyframes clippy-caret {
  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .office-assistant__character,
  .office-assistant--dancing .office-assistant__character,
  .office-assistant__bulb {
    animation: none;
  }
}

@media (max-width: 720px) {
  .office-assistant {
    right: 8px;
    width: 92px;
  }

  .office-assistant__character {
    width: 92px;
    height: 122px;
  }

  .assistant-balloon {
    right: 0;
  }
}
</style>
