<template>
  <Teleport to="body">
    <div
      class="boot-screen theme-exempt"
      :class="{
        'boot-screen--logo': phase === 'logo',
        'boot-screen--leaving': isLeaving,
      }"
      role="status"
      aria-live="polite"
      @click="finish"
    >
      <div class="boot-screen__bios" aria-hidden="true">
        <p v-for="line in visibleBiosLines" :key="line">{{ line }}</p>
        <p class="boot-screen__cursor">_</p>
      </div>

      <div ref="sceneRef" class="boot-screen__scene" aria-hidden="true" />

      <div class="boot-screen__brand">
        <p class="boot-screen__kicker">{{ t('boot.kicker') }}</p>
        <h1 class="boot-screen__title">NORMUN<span>OS</span></h1>
        <p class="boot-screen__edition">{{ t('boot.edition') }}</p>
      </div>

      <div class="boot-screen__progress" aria-hidden="true">
        <span />
      </div>

      <p class="boot-screen__skip">{{ t('boot.skip') }}</p>
      <span class="boot-screen__sr">{{ t('boot.loading') }}</span>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { BootScene } from '../three/bootScene'
import { isWebGLAvailable } from '../three/utils'

const emit = defineEmits<{
  (e: 'done'): void
}>()

const BIOS_LINES = [
  'NORMUN BIOS v2.000  (C) 1999-2026 Normun Systems',
  'CPU: CREATIVE_CORE @ 2000 MHz ............ OK',
  'MEMORY TEST: 65536K ...................... OK',
  'DETECTING 3D ACCELERATOR ............. WEBGL2',
  'MOUNTING C:\\PORTFOLIO ................... OK',
  'LOADING Y2K_AESTHETICS.SYS ............... OK',
]
const LOGO_AT_MS = 1100
const AUTO_FINISH_MS = 4300
const LEAVE_MS = 550

const { t } = useI18n()
const sceneRef = ref<HTMLElement | null>(null)
const phase = ref<'bios' | 'logo'>('bios')
const biosCount = ref(0)
const isLeaving = ref(false)
const visibleBiosLines = computed(() => BIOS_LINES.slice(0, biosCount.value))

let scene: BootScene | null = null
let isUnmounted = false
const timers: number[] = []

const finish = () => {
  if (isLeaving.value) {
    return
  }

  isLeaving.value = true
  timers.push(window.setTimeout(() => emit('done'), LEAVE_MS))
}

const handleKeydown = () => finish()

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)

  BIOS_LINES.forEach((_, index) => {
    timers.push(window.setTimeout(() => {
      biosCount.value = index + 1
    }, 120 + index * 140))
  })
  timers.push(window.setTimeout(() => {
    phase.value = 'logo'
  }, LOGO_AT_MS))
  timers.push(window.setTimeout(finish, AUTO_FINISH_MS))

  if (!isWebGLAvailable()) {
    return
  }

  try {
    const { BootScene } = await import('../three/bootScene')

    if (!isUnmounted && sceneRef.value) {
      scene = new BootScene(sceneRef.value)
    }
  } catch (error) {
    console.warn('[y2k] boot logo disabled:', error)
  }
})

onBeforeUnmount(() => {
  isUnmounted = true
  window.removeEventListener('keydown', handleKeydown)
  timers.forEach((timer) => window.clearTimeout(timer))
  scene?.dispose()
  scene = null
})
</script>

<style scoped>
.boot-screen {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  grid-template-rows: 1fr auto auto auto;
  justify-items: center;
  gap: 1rem;
  padding: 2rem 1rem 2.5rem;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 36%, #4b0f63 0%, #1a0629 46%, #06010d 100%);
  color: #fffef6;
  cursor: pointer;
  transition: opacity 550ms ease, filter 550ms ease;
}

.boot-screen::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.22) 0 1px, transparent 1px 3px);
  pointer-events: none;
}

.boot-screen--leaving {
  opacity: 0;
  filter: brightness(2.2) saturate(1.4);
}

.boot-screen__bios {
  position: absolute;
  top: 1.25rem;
  left: 1.25rem;
  right: 1.25rem;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  color: #36ff20;
  font-family: var(--font-secondary);
  font-size: clamp(0.62rem, 1.4vw, 0.82rem);
  line-height: 1.4;
  text-shadow: 0 0 6px rgba(54, 255, 32, 0.55);
  white-space: pre;
  transition: opacity 400ms ease;
}

.boot-screen__cursor {
  animation: boot-blink 700ms steps(1) infinite;
}

.boot-screen--logo .boot-screen__bios {
  opacity: 0.18;
}

.boot-screen__scene {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 700ms ease;
}

.boot-screen--logo .boot-screen__scene {
  opacity: 1;
}

.boot-screen__scene :deep(.boot-scene__canvas) {
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
}

.boot-screen__brand,
.boot-screen__progress,
.boot-screen__skip {
  position: relative;
  z-index: 1;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 600ms ease 250ms, transform 600ms ease 250ms;
}

.boot-screen--logo .boot-screen__brand,
.boot-screen--logo .boot-screen__progress,
.boot-screen--logo .boot-screen__skip {
  opacity: 1;
  transform: none;
}

.boot-screen__brand {
  grid-row: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  text-align: center;
}

.boot-screen__kicker {
  color: #9ff3ff;
  font-family: var(--font-secondary);
  font-size: 0.72rem;
  letter-spacing: 0.4em;
}

.boot-screen__title {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  font-family: var(--font-tertiary);
  font-size: clamp(2.6rem, 8vw, 5.2rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
  background: linear-gradient(180deg, #ffffff 0%, #ffd6f7 38%, #b300b3 52%, #ff9be8 70%, #ffffff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 18px rgba(255, 43, 214, 0.55));
}

.boot-screen__title span {
  font-size: 0.45em;
  font-style: italic;
  background: linear-gradient(180deg, #d7ffcf 0%, #39ff5a 55%, #0b8d1b 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

.boot-screen__edition {
  color: #ffd6f7;
  font-family: var(--font-primary);
  font-size: clamp(0.9rem, 2vw, 1.1rem);
  font-style: italic;
  letter-spacing: 0.08em;
}

.boot-screen__progress {
  grid-row: 3;
  width: min(320px, 72vw);
  height: 20px;
  padding: 2px;
  border: 2px solid;
  border-color: #6d4a7d #fffef6 #fffef6 #6d4a7d;
  background: #12021c;
  overflow: hidden;
}

.boot-screen__progress span {
  display: block;
  width: 38%;
  height: 100%;
  background:
    repeating-linear-gradient(90deg, transparent 0 9px, #12021c 9px 12px),
    linear-gradient(90deg, #29d9ff 0%, #ff2bd6 55%, #ffe14d 100%);
  animation: boot-progress 1.35s linear infinite;
}

.boot-screen__skip {
  grid-row: 4;
  color: rgba(255, 254, 246, 0.6);
  font-family: var(--font-secondary);
  font-size: 0.72rem;
  letter-spacing: 0.06em;
}

.boot-screen__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@keyframes boot-progress {
  from {
    transform: translateX(-110%);
  }

  to {
    transform: translateX(280%);
  }
}

@keyframes boot-blink {
  50% {
    opacity: 0;
  }
}
</style>
