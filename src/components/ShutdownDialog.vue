<template>
  <div class="shutdown-dialog" @keydown.esc="cancel">
    <div class="shutdown-dialog__dither" aria-hidden="true" @click="cancel" />

    <form
      ref="dialogRef"
      class="shutdown-dialog__window"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shutdown-dialog-title"
      @submit.prevent="confirm"
    >
      <header class="shutdown-dialog__title">
        <span id="shutdown-dialog-title">{{ t('shutdown.title') }}</span>
        <button type="button" class="shutdown-dialog__x" :aria-label="t('modal.close')" @click="cancel">×</button>
      </header>

      <div class="shutdown-dialog__body">
        <img class="shutdown-dialog__icon" src="../assets/computer.svg" alt="">

        <fieldset class="shutdown-dialog__options">
          <legend>{{ t('shutdown.question') }}</legend>
          <label v-for="option in options" :key="option" class="shutdown-dialog__option">
            <input v-model="choice" type="radio" name="shutdown-choice" :value="option">
            <span>{{ t(`shutdown.options.${option}`) }}</span>
          </label>
        </fieldset>
      </div>

      <footer class="shutdown-dialog__buttons">
        <button type="submit" class="shutdown-dialog__button shutdown-dialog__button--default">OK</button>
        <button type="button" class="shutdown-dialog__button" @click="cancel">{{ t('shutdown.cancel') }}</button>
        <button type="button" class="shutdown-dialog__button" @click="help">{{ t('shutdown.help') }}</button>
      </footer>
    </form>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { desktop } from '../stores/desktop'

const options = ['standby', 'shutdown', 'restart'] as const

const { t } = useI18n()
const dialogRef = ref<HTMLFormElement | null>(null)
const choice = ref<(typeof options)[number]>('shutdown')

const cancel = () => desktop.setOverlay(null)

const confirm = () => {
  if (choice.value === 'standby') {
    desktop.run('screensaver')
  } else if (choice.value === 'restart') {
    desktop.run('reboot')
  } else {
    desktop.run('shutdown')
  }
}

const help = () => {
  desktop.setOverlay(null)
  desktop.run('assistant')
}

onMounted(async () => {
  await nextTick()
  dialogRef.value?.querySelector<HTMLInputElement>('input:checked')?.focus()
})
</script>

<style scoped>
.shutdown-dialog {
  position: fixed;
  inset: 0;
  z-index: 150;
  display: grid;
  place-items: center;
  padding: 1rem;
}

/* The famous Windows 98 "dimmed desktop": a 50% checkerboard of black pixels. */
.shutdown-dialog__dither {
  position: absolute;
  inset: 0;
  background: repeating-conic-gradient(rgba(0, 0, 0, 0.6) 0 25%, transparent 0 50%) 0 0 / 2px 2px;
  animation: shutdown-dither 450ms steps(4) both;
}

.shutdown-dialog__window {
  position: relative;
  width: min(420px, 100%);
  border: 2px solid;
  border-color: #fff #404040 #404040 #fff;
  background: #c0c0c0;
  box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.45);
  font-family: var(--font-tertiary);
  animation: shutdown-pop 260ms cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
}

.shutdown-dialog__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.35rem 0.4rem 0.35rem 0.6rem;
  background: linear-gradient(90deg, #5a0a6e 0%, #b300b3 60%, #ff66d9 100%);
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
}

.shutdown-dialog__x {
  display: grid;
  place-items: center;
  width: 22px;
  height: 20px;
  padding: 0;
  border: 2px solid;
  border-color: #fff #404040 #404040 #fff;
  background: #c0c0c0;
  color: #000;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
}

.shutdown-dialog__body {
  display: flex;
  gap: 1.1rem;
  padding: 1.2rem 1.2rem 0.6rem;
}

.shutdown-dialog__icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
}

.shutdown-dialog__options {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin: 0;
  padding: 0;
  border: 0;
}

.shutdown-dialog__options legend {
  margin-bottom: 0.6rem;
  font-size: 0.92rem;
}

.shutdown-dialog__option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.shutdown-dialog__option input {
  accent-color: #b300b3;
}

.shutdown-dialog__buttons {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.8rem 1.2rem 1.1rem;
}

.shutdown-dialog__button {
  min-width: 78px;
  padding: 0.35rem 0.8rem;
  border: 2px solid;
  border-color: #fff #404040 #404040 #fff;
  background: #c0c0c0;
  color: #000;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}

.shutdown-dialog__button--default {
  outline: 1px solid #000;
  outline-offset: 0;
}

.shutdown-dialog__button:active {
  border-color: #404040 #fff #fff #404040;
}

@keyframes shutdown-dither {
  from {
    opacity: 0;
  }
}

@keyframes shutdown-pop {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
}
</style>
