<template>
  <Modal
    :title="t('player.title')"
    :icon="modalIcon"
    :is-open="isOpen"
    :show-status-bar="true"
    :status-label="statusLabel"
    :cpu-usage="t('player.nowPlayingLabel', { track: track.title })"
    :ram-usage="`${formatTime(state.currentTime)} / ${formatTime(state.duration)}`"
    :shell-label="engineLabel"
    wide
    @close="handleClose"
    @minimize="emit('minimize')"
  >
    <section
      class="headspace"
      :class="{ 'headspace--playing': isPlaying, 'headspace--drawer': drawer !== null }"
      :aria-label="t('player.aria')"
    >
      <div class="headspace__stage">
        <span class="headspace__blob headspace__blob--a" aria-hidden="true" />
        <span class="headspace__blob headspace__blob--b" aria-hidden="true" />
        <span class="headspace__blob headspace__blob--c" aria-hidden="true" />

        <HeadspaceHead class="headspace__head" :mode="vizMode" @visor-click="cycleViz(1)" />

        <div class="headspace__viz">
          <button type="button" class="headspace__viz-arrow" :aria-label="t('player.prevViz')" @click="cycleViz(-1)">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="ICONS.chevronLeft" /></svg>
          </button>
          <span class="headspace__viz-name">
            <small>{{ t('player.visualization') }}</small>
            {{ t(`player.viz.${vizName}`) }}
          </span>
          <button type="button" class="headspace__viz-arrow" :aria-label="t('player.nextViz')" @click="cycleViz(1)">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="ICONS.chevronRight" /></svg>
          </button>
        </div>

        <p class="headspace__hint">{{ isActive ? t('player.visorHint') : t('player.sleepHint') }}</p>

        <Transition name="headspace-drawer">
          <aside v-if="drawer === 'playlist'" class="headspace__drawer" :aria-label="t('player.playlist')">
            <header class="headspace__drawer-head">
              <strong>{{ t('player.playlist') }}</strong>
              <span>{{ t('player.trackCount', { count: TRACKS.length }) }}</span>
            </header>

            <ol class="headspace__playlist">
              <li v-for="(item, index) in TRACKS" :key="item.videoId">
                <button
                  type="button"
                  class="headspace__track"
                  :class="{ 'headspace__track--current': index === state.index }"
                  :aria-current="index === state.index ? 'true' : undefined"
                  @click="player.select(index)"
                >
                  <span class="headspace__track-no">
                    <span v-if="index === state.index && isPlaying" class="headspace__mini-eq" aria-hidden="true">
                      <i /><i /><i />
                    </span>
                    <template v-else>{{ String(index + 1).padStart(2, '0') }}</template>
                  </span>
                  <span class="headspace__track-copy">
                    <strong>{{ item.title }}</strong>
                    <small>{{ item.artist }}</small>
                  </span>
                  <em>{{ formatTime(item.duration) }}</em>
                </button>
              </li>
            </ol>
          </aside>
        </Transition>

        <Transition name="headspace-drawer">
          <aside v-if="drawer === 'eq'" class="headspace__drawer" :aria-label="t('player.equalizer')">
            <header class="headspace__drawer-head">
              <strong>{{ t('player.equalizer') }}</strong>
              <select
                class="headspace__preset"
                :value="state.eqPreset"
                :aria-label="t('player.preset')"
                @change="player.applyEqPreset(($event.target as HTMLSelectElement).value)"
              >
                <option v-if="state.eqPreset === 'custom'" value="custom">{{ t('player.presets.custom') }}</option>
                <option v-for="preset in presetNames" :key="preset" :value="preset">{{ t(`player.presets.${preset}`) }}</option>
              </select>
            </header>

            <div class="headspace__eq">
              <label v-for="(band, index) in EQ_BANDS" :key="band" class="headspace__eq-band">
                <span class="headspace__eq-value">{{ state.eq[index] > 0 ? '+' : '' }}{{ state.eq[index] }}</span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  :value="state.eq[index]"
                  :aria-label="`${band} Hz`"
                  @input="player.setEqBand(index, Number(($event.target as HTMLInputElement).value))"
                >
                <span class="headspace__eq-label">{{ band }}</span>
              </label>
            </div>

            <p class="headspace__eq-note">{{ t('player.eqNote') }}</p>
          </aside>
        </Transition>
      </div>

      <div class="headspace__deck">
        <div class="headspace__lcd" aria-live="polite">
          <div class="headspace__lcd-top">
            <span class="headspace__lcd-status">
              <span class="headspace__lcd-dot" aria-hidden="true" />
              {{ statusLabel }}
            </span>
            <span>{{ state.index + 1 }}/{{ TRACKS.length }}</span>
          </div>

          <div class="headspace__marquee">
            <div class="headspace__marquee-track" :class="{ 'headspace__marquee-track--moving': isActive }">
              <span>{{ track.title }} — {{ track.artist }}</span>
              <span aria-hidden="true">{{ track.title }} — {{ track.artist }}</span>
            </div>
          </div>

          <div class="headspace__lcd-time">
            <strong>{{ formatTime(state.currentTime) }}</strong>
            <span>-{{ formatTime(state.duration - state.currentTime) }}</span>
          </div>
        </div>

        <input
          type="range"
          class="headspace__seek"
          min="0"
          :max="state.duration"
          step="0.5"
          :value="state.currentTime"
          :style="{ '--progress': `${progress}%` }"
          :aria-label="t('player.seek')"
          :disabled="!isActive"
          @input="player.seek(Number(($event.target as HTMLInputElement).value))"
        >

        <div class="headspace__transport">
          <button type="button" class="headspace__gel" :aria-label="t('player.prev')" @click="player.previous()">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="ICONS.prev" /></svg>
          </button>
          <button
            type="button"
            class="headspace__gel headspace__gel--play"
            :aria-label="isPlaying ? t('player.pause') : t('player.play')"
            @click="player.toggle()"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="isPlaying ? ICONS.pause : ICONS.play" /></svg>
          </button>
          <button type="button" class="headspace__gel" :aria-label="t('player.next')" @click="player.next()">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="ICONS.next" /></svg>
          </button>
          <button type="button" class="headspace__gel headspace__gel--stop" :aria-label="t('player.stop')" @click="player.stop()">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="ICONS.stop" /></svg>
          </button>
        </div>

        <div class="headspace__row">
          <button
            type="button"
            class="headspace__pill"
            :class="{ 'headspace__pill--active': state.muted }"
            :aria-label="t('player.mute')"
            :aria-pressed="state.muted"
            @click="player.toggleMute()"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="state.muted ? ICONS.muted : ICONS.volume" /></svg>
          </button>
          <input
            type="range"
            class="headspace__volume"
            min="0"
            max="100"
            :value="state.muted ? 0 : state.volume"
            :style="{ '--progress': `${state.muted ? 0 : state.volume}%` }"
            :aria-label="t('player.volume')"
            @input="player.setVolume(Number(($event.target as HTMLInputElement).value))"
          >
          <button
            type="button"
            class="headspace__pill"
            :class="{ 'headspace__pill--active': state.shuffle }"
            :aria-label="t('player.shuffle')"
            :aria-pressed="state.shuffle"
            @click="player.toggleShuffle()"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="ICONS.shuffle" /></svg>
          </button>
          <button
            type="button"
            class="headspace__pill"
            :class="{ 'headspace__pill--active': state.repeat }"
            :aria-label="t('player.repeat')"
            :aria-pressed="state.repeat"
            @click="player.toggleRepeat()"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="ICONS.repeat" /></svg>
          </button>
        </div>

        <div class="headspace__tabs">
          <button
            type="button"
            class="headspace__tab"
            :class="{ 'headspace__tab--active': drawer === 'playlist' }"
            :aria-pressed="drawer === 'playlist'"
            @click="toggleDrawer('playlist')"
          >
            {{ t('player.playlist') }}
          </button>
          <button
            type="button"
            class="headspace__tab"
            :class="{ 'headspace__tab--active': drawer === 'eq' }"
            :aria-pressed="drawer === 'eq'"
            @click="toggleDrawer('eq')"
          >
            {{ t('player.equalizer') }}
          </button>
        </div>
      </div>
    </section>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import HeadspaceHead from './HeadspaceHead.vue'
import Modal from './Modal.vue'
import { EQ_BANDS, EQ_PRESETS, TRACKS, formatTime, player } from '../stores/player'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'minimize'): void
}>()

const VISUALIZATIONS = ['bars', 'ambience', 'battery', 'scope'] as const

const ICONS = {
  play: 'M8 5.5v13a1 1 0 0 0 1.5.86l10.2-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z',
  pause: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z',
  prev: 'M6 5h2.4v14H6zM20 5.8v12.4a.8.8 0 0 1-1.25.66L9.6 12.66a.8.8 0 0 1 0-1.32l9.15-6.2A.8.8 0 0 1 20 5.8Z',
  next: 'M15.6 5H18v14h-2.4zM4 5.8v12.4a.8.8 0 0 0 1.25.66l9.15-6.2a.8.8 0 0 0 0-1.32L5.25 5.14A.8.8 0 0 0 4 5.8Z',
  stop: 'M6.5 6.5h11v11h-11z',
  volume: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15 8.5a5 5 0 0 1 0 7M17.5 6a8.5 8.5 0 0 1 0 12',
  muted: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9.5l5 5M20.5 9.5l-5 5',
  shuffle: 'M3 7h3.5c4 0 5.5 10 10 10H21M18 14l3 3-3 3M3 17h3.5c1.6 0 2.8-1.6 3.8-3.4M13.7 10.4C14.7 8.6 15.9 7 17.5 7H21M18 4l3 3-3 3',
  repeat: 'M4 12V9.5A3.5 3.5 0 0 1 7.5 6H19M16 3l3 3-3 3M20 12v2.5a3.5 3.5 0 0 1-3.5 3.5H5M8 21l-3-3 3-3',
  chevronLeft: 'M14.5 5.5 8 12l6.5 6.5',
  chevronRight: 'M9.5 5.5 16 12l-6.5 6.5',
}

const { t } = useI18n()
const modalIcon = new URL('../assets/prompt.svg', import.meta.url).href
const state = player.state
const track = player.track
const isPlaying = player.isPlaying
const isActive = player.isActive
const presetNames = Object.keys(EQ_PRESETS)
const vizMode = ref(0)
// On narrow screens the drawer would cover the head, so it starts closed.
const drawer = ref<'playlist' | 'eq' | null>(window.innerWidth > 900 ? 'playlist' : null)

const vizName = computed(() => VISUALIZATIONS[vizMode.value])
const progress = computed(() => (state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0))

const statusLabel = computed(() => {
  switch (state.status) {
    case 'playing':
      return t('player.statusPlaying')
    case 'paused':
      return t('player.statusPaused')
    case 'loading':
      return t('player.statusLoading')
    default:
      return t('player.statusIdle')
  }
})

const engineLabel = computed(() => (state.engine === 'offline' ? t('player.offline') : t('player.shellLabel')))

const cycleViz = (direction: number) => {
  vizMode.value = (vizMode.value + direction + VISUALIZATIONS.length) % VISUALIZATIONS.length
}

const toggleDrawer = (next: 'playlist' | 'eq') => {
  drawer.value = drawer.value === next ? null : next
}

// Closing the player window stops the music; minimizing keeps it playing.
const handleClose = () => {
  player.stop()
  emit('close')
}
</script>

<style scoped>
.headspace {
  --hs-lime: #9dff4a;
  --hs-green: #4fc41f;
  --hs-deep: #0f3006;
  --hs-ink: #06180a;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 1rem;
  min-height: 540px;
  padding: 0.25rem;
}

/* ---------------- Stage (the head) ---------------- */

.headspace__stage {
  position: relative;
  min-height: 520px;
  overflow: hidden;
  /* clip (not just hidden): focus must never scroll the stage while a drawer slides out. */
  overflow: clip;
  border: 2px solid var(--hs-deep);
  border-radius: 32px;
  background:
    radial-gradient(ellipse at 50% 108%, rgba(15, 48, 6, 0.55) 0%, transparent 45%),
    radial-gradient(circle at 30% 20%, #eaffc9 0%, #b9ff7a 30%, #5fca28 68%, #2d7a12 100%);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.6),
    inset 0 -18px 40px rgba(15, 48, 6, 0.35);
  isolation: isolate;
}

.headspace__blob {
  position: absolute;
  z-index: -1;
  border-radius: 58% 42% 55% 45% / 45% 55% 45% 55%;
  filter: blur(2px);
  opacity: 0.55;
  animation: headspace-blob 14s ease-in-out infinite alternate;
}

.headspace__blob--a {
  width: 280px;
  height: 260px;
  left: -60px;
  top: -40px;
  background: radial-gradient(circle at 40% 40%, #fdffe0, #c7ff8a 70%);
}

.headspace__blob--b {
  width: 220px;
  height: 240px;
  right: -40px;
  bottom: 40px;
  background: radial-gradient(circle at 60% 40%, #7dffc4, #3fc46a 70%);
  animation-duration: 18s;
}

.headspace__blob--c {
  width: 120px;
  height: 120px;
  right: 18%;
  top: 12%;
  background: radial-gradient(circle, #ffb3ec, #ff4fd8 75%);
  opacity: 0.35;
  animation-duration: 11s;
}

.headspace--playing .headspace__blob {
  animation-duration: 6s;
}

.headspace__head {
  position: absolute;
  inset: 0 0 56px;
  transition: right 420ms cubic-bezier(0.2, 0.9, 0.25, 1.1);
}

/* The head slides aside when a drawer is pulled out, so it's never hidden. */
.headspace--drawer .headspace__head {
  right: min(312px, 55%);
}

.headspace__viz {
  position: absolute;
  left: 50%;
  transition: left 420ms cubic-bezier(0.2, 0.9, 0.25, 1.1);
  bottom: 14px;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem;
  border: 2px solid var(--hs-deep);
  border-radius: 999px;
  background: rgba(6, 24, 10, 0.82);
  box-shadow: 0 6px 18px rgba(15, 48, 6, 0.35), inset 0 1px 0 rgba(157, 255, 74, 0.35);
  color: var(--hs-lime);
  transform: translateX(-50%);
  backdrop-filter: blur(6px);
}

.headspace--drawer .headspace__viz {
  left: calc((100% - min(312px, 55%)) / 2);
}

.headspace__viz-name {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 118px;
  font-family: var(--font-secondary);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1.1;
  text-transform: uppercase;
  text-shadow: 0 0 8px rgba(157, 255, 74, 0.6);
}

.headspace__viz-name small {
  color: rgba(157, 255, 74, 0.55);
  font-size: 0.58rem;
}

.headspace__viz-arrow {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #efffd6, var(--hs-lime) 40%, #2f8f10 100%);
  color: var(--hs-ink);
  cursor: pointer;
}

.headspace__viz-arrow svg,
.headspace__gel svg,
.headspace__pill svg {
  width: 60%;
  height: 60%;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.headspace__hint {
  position: absolute;
  top: 14px;
  left: 16px;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
  color: var(--hs-deep);
  font-family: var(--font-secondary);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

/* ---------------- Drawers ---------------- */

.headspace__drawer {
  position: absolute;
  top: 12px;
  right: 12px;
  bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: min(300px, calc(100% - 24px));
  padding: 0.85rem;
  border: 2px solid var(--hs-deep);
  border-radius: 24px 24px 24px 24px;
  background: linear-gradient(180deg, rgba(8, 30, 10, 0.92) 0%, rgba(6, 22, 8, 0.96) 100%);
  box-shadow: -10px 12px 30px rgba(15, 48, 6, 0.45), inset 0 1px 0 rgba(157, 255, 74, 0.3);
  color: #e6ffd0;
  backdrop-filter: blur(8px);
}

.headspace__drawer::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 50%;
  width: 12px;
  height: 64px;
  border: 2px solid var(--hs-deep);
  border-right: 0;
  border-radius: 12px 0 0 12px;
  background: linear-gradient(90deg, var(--hs-green), var(--hs-lime));
  transform: translateY(-50%);
}

.headspace-drawer-enter-active,
.headspace-drawer-leave-active {
  transition: transform 420ms cubic-bezier(0.2, 0.9, 0.25, 1.1), opacity 300ms ease;
}

.headspace-drawer-enter-from,
.headspace-drawer-leave-to {
  opacity: 0;
  transform: translateX(calc(100% + 24px)) rotate(2deg);
}

.headspace__drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(157, 255, 74, 0.25);
  font-family: var(--font-secondary);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.headspace__drawer-head strong {
  color: var(--hs-lime);
}

.headspace__drawer-head span {
  color: rgba(230, 255, 208, 0.6);
}

.headspace__playlist {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-height: 0;
  overflow-y: auto;
}

.headspace__track {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) auto;
  gap: 0.6rem;
  align-items: center;
  width: 100%;
  padding: 0.55rem 0.6rem;
  border: 1px solid rgba(157, 255, 74, 0.18);
  border-radius: 14px;
  background: rgba(157, 255, 74, 0.05);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 180ms ease, border-color 180ms ease, transform 180ms ease;
}

.headspace__track:hover {
  border-color: rgba(157, 255, 74, 0.5);
  background: rgba(157, 255, 74, 0.12);
  transform: translateX(-3px);
}

.headspace__track--current {
  border-color: var(--hs-lime);
  background: linear-gradient(90deg, rgba(157, 255, 74, 0.28), rgba(157, 255, 74, 0.08));
  box-shadow: 0 0 18px rgba(157, 255, 74, 0.2);
}

.headspace__track-no,
.headspace__track em {
  color: var(--hs-lime);
  font-family: var(--font-secondary);
  font-size: 0.72rem;
  font-style: normal;
}

.headspace__track-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.headspace__track-copy strong,
.headspace__track-copy small {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.headspace__track-copy strong {
  font-family: var(--font-tertiary);
  font-size: 0.86rem;
}

.headspace__track-copy small {
  color: rgba(230, 255, 208, 0.6);
  font-family: var(--font-secondary);
  font-size: 0.66rem;
}

.headspace__mini-eq {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  height: 14px;
}

.headspace__mini-eq i {
  width: 4px;
  background: var(--hs-lime);
  animation: headspace-eq 700ms ease-in-out infinite alternate;
}

.headspace__mini-eq i:nth-child(2) {
  animation-delay: -250ms;
}

.headspace__mini-eq i:nth-child(3) {
  animation-delay: -480ms;
}

.headspace__preset {
  padding: 0.25rem 0.5rem;
  border: 1px solid rgba(157, 255, 74, 0.5);
  border-radius: 999px;
  background: #0b2a0d;
  color: var(--hs-lime);
  font-family: var(--font-secondary);
  font-size: 0.7rem;
}

.headspace__eq {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 0.2rem;
  flex: 1;
  min-height: 0;
}

.headspace__eq-band {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  min-height: 0;
}

.headspace__eq-band input {
  flex: 1;
  width: 22px;
  min-height: 120px;
  writing-mode: vertical-lr;
  direction: rtl;
  accent-color: var(--hs-lime);
  cursor: pointer;
}

.headspace__eq-value,
.headspace__eq-label {
  font-family: var(--font-secondary);
  font-size: 0.56rem;
}

.headspace__eq-value {
  color: var(--hs-lime);
}

.headspace__eq-label {
  color: rgba(230, 255, 208, 0.6);
}

.headspace__eq-note {
  color: rgba(230, 255, 208, 0.5);
  font-family: var(--font-secondary);
  font-size: 0.6rem;
  line-height: 1.4;
}

/* ---------------- Deck (controls) ---------------- */

.headspace__deck {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid var(--hs-deep);
  border-radius: 32px;
  background:
    linear-gradient(160deg, rgba(185, 255, 122, 0.35) 0%, transparent 35%),
    linear-gradient(180deg, #2d7a12 0%, #174a08 100%);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.35),
    inset 0 -10px 24px rgba(0, 0, 0, 0.3),
    0 10px 24px rgba(15, 48, 6, 0.25);
}

.headspace__lcd {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.85rem 0.95rem;
  overflow: hidden;
  border: 2px solid var(--hs-deep);
  border-radius: 20px;
  background: radial-gradient(ellipse at 50% 0%, #143d12 0%, #051405 80%);
  box-shadow: inset 0 0 24px rgba(0, 0, 0, 0.7), 0 1px 0 rgba(255, 255, 255, 0.3);
  color: var(--hs-lime);
  font-family: var(--font-secondary);
  text-shadow: 0 0 8px rgba(157, 255, 74, 0.55);
}

.headspace__lcd::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.25) 0 1px, transparent 1px 3px);
  pointer-events: none;
}

.headspace__lcd-top {
  display: flex;
  justify-content: space-between;
  font-size: 0.64rem;
  letter-spacing: 0.1em;
  opacity: 0.8;
}

.headspace__lcd-status {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.headspace__lcd-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3a6b1f;
}

.headspace--playing .headspace__lcd-dot {
  background: var(--hs-lime);
  box-shadow: 0 0 8px var(--hs-lime);
  animation: headspace-pulse 1s ease-in-out infinite;
}

.headspace__marquee {
  min-width: 0;
  overflow: hidden;
  mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
}

.headspace__marquee-track {
  display: flex;
  gap: 3rem;
  width: max-content;
  font-family: var(--font-tertiary);
  font-size: 1.05rem;
  font-weight: 700;
  white-space: nowrap;
}

.headspace__marquee-track--moving {
  animation: headspace-marquee 12s linear infinite;
}

.headspace__lcd-time {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.headspace__lcd-time strong {
  font-size: 1.9rem;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.headspace__lcd-time span {
  font-size: 0.78rem;
  opacity: 0.7;
}

.headspace__seek,
.headspace__volume {
  --progress: 0%;
  width: 100%;
  height: 14px;
  appearance: none;
  border: 2px solid var(--hs-deep);
  border-radius: 999px;
  background:
    linear-gradient(90deg, var(--hs-lime) 0%, #e8ff9e var(--progress), #0b2a0d var(--progress));
  box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.35);
  cursor: pointer;
}

.headspace__seek:disabled {
  opacity: 0.55;
  cursor: default;
}

.headspace__seek::-webkit-slider-thumb,
.headspace__volume::-webkit-slider-thumb {
  width: 22px;
  height: 22px;
  appearance: none;
  border: 2px solid var(--hs-deep);
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ffffff, var(--hs-lime) 45%, #2f8f10 100%);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
}

.headspace__seek::-moz-range-thumb,
.headspace__volume::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border: 2px solid var(--hs-deep);
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ffffff, var(--hs-lime) 45%, #2f8f10 100%);
}

.headspace__transport {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
}

.headspace__gel {
  position: relative;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  padding: 0;
  border: 2px solid var(--hs-deep);
  border-radius: 50%;
  background: radial-gradient(circle at 50% 30%, #f4ffd9 0%, var(--hs-lime) 38%, #3fa313 78%, #1e5a0a 100%);
  box-shadow: 0 4px 0 var(--hs-deep), 0 8px 14px rgba(0, 0, 0, 0.3);
  color: var(--hs-ink);
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease, filter 160ms ease;
}

.headspace__gel::after {
  content: '';
  position: absolute;
  top: 5px;
  left: 50%;
  width: 60%;
  height: 34%;
  border-radius: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0));
  transform: translateX(-50%);
  pointer-events: none;
}

.headspace__gel:hover {
  filter: brightness(1.08) saturate(1.1);
  transform: translateY(-1px);
}

.headspace__gel:active {
  box-shadow: 0 1px 0 var(--hs-deep), 0 2px 6px rgba(0, 0, 0, 0.3);
  transform: translateY(3px);
}

.headspace__gel svg {
  fill: currentColor;
  stroke: none;
}

.headspace__gel--play {
  width: 72px;
  height: 72px;
  background: radial-gradient(circle at 50% 30%, #fff3fb 0%, #ff8ae6 38%, #d31ab5 78%, #6d0a5c 100%);
  color: #2a0424;
}

.headspace__gel--stop {
  width: 40px;
  height: 40px;
}

.headspace__row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  gap: 0.5rem;
  align-items: center;
}

.headspace__pill {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 2px solid var(--hs-deep);
  border-radius: 12px;
  background: linear-gradient(180deg, #d9ffa8 0%, #7fd94a 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
  color: var(--hs-ink);
  cursor: pointer;
}

.headspace__pill--active {
  background: linear-gradient(180deg, #ffd6f5 0%, #ff4fd8 100%);
  box-shadow: 0 0 12px rgba(255, 79, 216, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.headspace__tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-top: auto;
}

.headspace__tab {
  padding: 0.6rem 0.4rem;
  border: 2px solid var(--hs-deep);
  border-radius: 14px;
  background: rgba(6, 24, 10, 0.5);
  color: var(--hs-lime);
  font-family: var(--font-secondary);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease;
}

.headspace__tab--active {
  background: var(--hs-lime);
  color: var(--hs-ink);
  box-shadow: 0 0 14px rgba(157, 255, 74, 0.45);
}

@keyframes headspace-blob {
  0% {
    border-radius: 58% 42% 55% 45% / 45% 55% 45% 55%;
    transform: translate(0, 0) rotate(0deg);
  }

  100% {
    border-radius: 40% 60% 42% 58% / 60% 38% 62% 40%;
    transform: translate(18px, -14px) rotate(24deg);
  }
}

@keyframes headspace-eq {
  from {
    height: 3px;
  }

  to {
    height: 14px;
  }
}

@keyframes headspace-pulse {
  50% {
    opacity: 0.4;
  }
}

@keyframes headspace-marquee {
  to {
    transform: translateX(calc(-50% - 1.5rem));
  }
}

@media (prefers-reduced-motion: reduce) {
  .headspace__blob,
  .headspace__marquee-track--moving,
  .headspace__mini-eq i {
    animation: none;
  }
}

@media (max-width: 900px) {
  .headspace {
    grid-template-columns: minmax(0, 1fr);
  }

  .headspace__stage {
    min-height: 380px;
  }
}

@media (max-width: 720px) {
  .headspace__stage {
    min-height: 340px;
    border-radius: 24px;
  }

  .headspace__deck {
    border-radius: 24px;
  }

  .headspace__hint {
    display: none;
  }
}
</style>
