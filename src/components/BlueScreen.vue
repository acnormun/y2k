<template>
  <Teleport to="body">
    <div class="bsod theme-exempt" role="alertdialog" aria-modal="true" :aria-label="t('bsod.aria')" @click="dismiss">
      <div class="bsod__inner">
        <p class="bsod__title"><span>NORMUN OS</span></p>
        <p>{{ t('bsod.exception') }}</p>
        <ul class="bsod__list">
          <li>{{ t('bsod.terminate') }}</li>
          <li>{{ t('bsod.restart') }}</li>
        </ul>
        <p class="bsod__continue">{{ t('bsod.continue') }} <span class="bsod__cursor">_</span></p>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { desktop } from '../stores/desktop'

// Ignore the key press / click that triggered the crash.
const ARM_DELAY_MS = 600

const { t } = useI18n()
let armedAt = 0

const dismiss = () => {
  if (performance.now() >= armedAt) {
    desktop.setOverlay(null)
  }
}

onMounted(() => {
  armedAt = performance.now() + ARM_DELAY_MS
  window.addEventListener('keydown', dismiss)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', dismiss)
})
</script>

<style scoped>
.bsod {
  position: fixed;
  inset: 0;
  z-index: 220;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: #0000aa;
  color: #fff;
  font-family: var(--font-secondary);
  font-size: clamp(0.85rem, 1.8vw, 1.15rem);
  line-height: 1.6;
  cursor: none;
  animation: bsod-flash 180ms steps(2) both;
}

.bsod__inner {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  max-width: 64ch;
}

.bsod__title {
  text-align: center;
}

.bsod__title span {
  padding: 0 0.5rem;
  background: #aaa;
  color: #0000aa;
  font-weight: 700;
}

.bsod__list {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.bsod__list li::before {
  content: '*  ';
}

.bsod__continue {
  text-align: center;
}

.bsod__cursor {
  animation: bsod-blink 900ms steps(1) infinite;
}

@keyframes bsod-flash {
  from {
    background: #fff;
  }
}

@keyframes bsod-blink {
  50% {
    opacity: 0;
  }
}
</style>
