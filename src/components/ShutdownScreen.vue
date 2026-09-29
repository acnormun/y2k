<template>
  <Teleport to="body">
    <div
      class="shutdown-screen theme-exempt"
      :class="`shutdown-screen--${phase}`"
      role="status"
      aria-live="polite"
      @click="powerOn"
    >
      <div v-if="phase === 'closing'" class="shutdown-screen__closing">
        <p>{{ t('shutdown.closing') }}</p>
        <span class="shutdown-screen__bar" aria-hidden="true"><span /></span>
      </div>

      <template v-else>
        <div class="shutdown-screen__crt" aria-hidden="true" />
        <p class="shutdown-screen__message">{{ t('shutdown.safe') }}</p>
        <p class="shutdown-screen__hint">{{ t('shutdown.powerOn') }}</p>
      </template>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { desktop } from '../stores/desktop'
import { player } from '../stores/player'

const { t } = useI18n()
const phase = ref<'closing' | 'safe'>('closing')
let timer: number | null = null

const powerOn = () => {
  if (phase.value === 'safe') {
    desktop.run('reboot')
  }
}

const handleKeydown = () => powerOn()

onMounted(() => {
  player.stop()
  timer = window.setTimeout(() => {
    phase.value = 'safe'
  }, 2200)
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  if (timer !== null) {
    window.clearTimeout(timer)
  }

  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.shutdown-screen {
  position: fixed;
  inset: 0;
  z-index: 210;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #000;
  cursor: pointer;
}

.shutdown-screen--closing {
  background: radial-gradient(ellipse at 50% 40%, #4b0f63 0%, #1a0629 50%, #06010d 100%);
  cursor: progress;
}

.shutdown-screen__closing {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #ffd6f7;
  font-family: var(--font-tertiary);
  font-size: clamp(1.1rem, 3vw, 1.6rem);
  animation: shutdown-fade 400ms ease both;
}

.shutdown-screen__bar {
  width: min(260px, 70vw);
  height: 12px;
  overflow: hidden;
  border: 2px solid #ffd6f7;
}

.shutdown-screen__bar span {
  display: block;
  width: 30%;
  height: 100%;
  background: linear-gradient(90deg, #29d9ff, #ff2bd6, #ffe14d);
  animation: shutdown-progress 1.2s linear infinite;
}

/* CRT power-off: the picture collapses into a line, then a dot. */
.shutdown-screen__crt {
  position: absolute;
  inset: 0;
  background: #fff;
  animation: shutdown-crt 700ms ease-in both;
  pointer-events: none;
}

.shutdown-screen__message {
  max-width: 20ch;
  color: #ff9a1f;
  font-family: var(--font-tertiary);
  font-size: clamp(1.8rem, 5vw, 3.2rem);
  font-weight: 700;
  line-height: 1.15;
  text-align: center;
  text-shadow: 0 0 18px rgba(255, 154, 31, 0.45);
  animation: shutdown-fade 900ms ease 900ms both;
}

.shutdown-screen__hint {
  color: rgba(255, 255, 255, 0.45);
  font-family: var(--font-secondary);
  font-size: 0.78rem;
  animation: shutdown-fade 900ms ease 2200ms both;
}

@keyframes shutdown-crt {
  0% {
    transform: scale(1, 1);
    opacity: 0.9;
  }

  55% {
    transform: scale(1, 0.004);
    opacity: 1;
  }

  85% {
    transform: scale(0.002, 0.004);
    opacity: 1;
  }

  100% {
    transform: scale(0, 0);
    opacity: 0;
  }
}

@keyframes shutdown-fade {
  from {
    opacity: 0;
  }
}

@keyframes shutdown-progress {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(340%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .shutdown-screen__crt {
    display: none;
  }
}
</style>
