<template>
  <Modal
    :title="t('player.title')"
    :icon="modalIcon"
    :is-open="isOpen"
    :show-status-bar="true"
    :status-label="isPlaying ? t('player.statusPlaying') : t('player.statusPaused')"
    :cpu-usage="t('player.nowPlayingLabel', { track: currentTrack.title })"
    :ram-usage="t('player.playlistCount', { count: tracks.length })"
    :shell-label="t('player.shellLabel')"
    @close="emit('close')"
  >
    <section class="media-player" :aria-label="t('player.aria')">
      <aside class="media-player__speaker media-player__speaker--left" aria-hidden="true">
        <span class="media-player__speaker-ring media-player__speaker-ring--large" />
        <span class="media-player__speaker-ring media-player__speaker-ring--small" />
      </aside>

      <div class="media-player__core">
        <div class="media-player__topbar">
          <div class="media-player__status-lights" aria-hidden="true">
            <span v-for="light in 5" :key="light" class="media-player__light" />
          </div>

          <div class="media-player__transport">
            <button type="button" class="media-player__transport-button" @click="previousTrack">
              {{ t('player.prev') }}
            </button>
            <button type="button" class="media-player__transport-button media-player__transport-button--play" @click="togglePlayback">
              {{ isPlaying ? t('player.pause') : t('player.play') }}
            </button>
            <button type="button" class="media-player__transport-button" @click="nextTrack">
              {{ t('player.next') }}
            </button>
          </div>
        </div>

        <div class="media-player__layout">
          <section class="media-player__mixer">
            <p class="media-player__panel-title">{{ t('player.equalizer') }}</p>
            <div class="media-player__sliders" :class="{ 'media-player__sliders--paused': !isPlaying }" aria-hidden="true">
              <div v-for="(level, index) in sliderLevels" :key="index" class="media-player__slider">
                <span class="media-player__slider-track" />
                <span class="media-player__slider-thumb" :style="{ bottom: `${level}%` }" />
              </div>
            </div>
            <div class="media-player__levels" :class="{ 'media-player__levels--paused': !isPlaying }">
              <span v-for="(level, index) in visualizerLevels" :key="index" class="media-player__level-bar" :style="{ height: `${level}%` }" />
            </div>
          </section>

          <section class="media-player__screen-wrap">
            <div class="media-player__screen">
              <div class="media-player__album">
                <div class="media-player__album-card" />
                <iframe
                  :key="playerFrameKey"
                  class="media-player__iframe media-player__iframe--audio-only"
                  :src="playerEmbedUrl"
                  :title="currentTrack.title"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                />
              </div>
              <div class="media-player__screen-copy">
                <p class="media-player__now-playing">{{ t('player.nowPlaying') }}</p>
                <h3>{{ currentTrack.title }}</h3>
                <p>{{ currentTrack.artist }}</p>
                <small>{{ currentTrack.length }}</small>
              </div>
            </div>
            <div class="media-player__dock">
              <button type="button" class="media-player__dock-button" @click="shuffleTrack">
                {{ t('player.shuffle') }}
              </button>
              <button type="button" class="media-player__dock-button" @click="nextTrack">
                {{ t('player.skip') }}
              </button>
            </div>
          </section>

          <section class="media-player__playlist">
            <div class="media-player__playlist-header">
              <p class="media-player__panel-title">{{ t('player.playlist') }}</p>
              <span>{{ tracks.length }}</span>
            </div>

            <button
              v-for="(track, index) in tracks"
              :key="track.title"
              type="button"
              class="media-player__track"
              :class="{ 'media-player__track--active': index === currentTrackIndex }"
              @click="selectTrack(index)"
            >
              <span>{{ String(index + 1).padStart(2, '0') }}</span>
              <div class="media-player__track-copy">
                <strong :class="{ 'media-player__track-marquee': index === currentTrackIndex }">
                  <span>{{ track.title }}</span>
                </strong>
                <small>{{ track.artist }}</small>
              </div>
              <em>{{ track.length }}</em>
            </button>
          </section>
        </div>
      </div>

      <aside class="media-player__speaker media-player__speaker--right" aria-hidden="true">
        <span class="media-player__speaker-ring media-player__speaker-ring--large" />
        <span class="media-player__speaker-ring media-player__speaker-ring--small" />
      </aside>
    </section>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from './Modal.vue'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()
const modalIcon = new URL('../assets/prompt.svg', import.meta.url).href

const tracks = computed(() => [
  {
    title: 'Pump It',
    artist: 'The Black Eyed Peas',
    length: '03:33',
    videoId: 'aGj-tt1FeHQ',
  },
  {
    title: 'The Sweet Escape',
    artist: 'Gwen Stefani ft. Akon',
    length: '04:06',
    videoId: 'O0lf_fE3HwA',
  },
  {
    title: 'Hey Ya!',
    artist: 'Outkast',
    length: '03:55',
    videoId: 'RqIRp4QE-1k',
  },
  {
    title: 'The Adventures Of Rain Dance Maggie',
    artist: 'Red Hot Chili Peppers',
    length: '04:43',
    videoId: 'H8QoB3sifzw',
  },
  {
    title: 'Bye Bye Bye',
    artist: '*NSYNC',
    length: '03:21',
    videoId: 'C27NShgTQE4',
  },
])

const currentTrackIndex = ref(0)
const isPlaying = ref(false)

const currentTrack = computed(() => tracks.value[currentTrackIndex.value])
const playerFrameKey = computed(() => `${currentTrack.value.videoId}-${isPlaying.value ? 'playing' : 'paused'}`)
const playerEmbedUrl = computed(
  () =>
    isPlaying.value
      ? `https://www.youtube.com/embed/${currentTrack.value.videoId}?autoplay=1&controls=0&rel=0&modestbranding=1`
      : 'about:blank',
)
const sliderLevels = [68, 48, 76, 34, 57, 64, 40, 72]
const visualizerLevels = [35, 52, 44, 71, 63, 84, 58, 78, 46, 66]

const selectTrack = (index: number) => {
  currentTrackIndex.value = index
  isPlaying.value = true
}

const togglePlayback = () => {
  isPlaying.value = !isPlaying.value
}

const previousTrack = () => {
  currentTrackIndex.value = currentTrackIndex.value === 0 ? tracks.value.length - 1 : currentTrackIndex.value - 1
  isPlaying.value = true
}

const nextTrack = () => {
  currentTrackIndex.value = (currentTrackIndex.value + 1) % tracks.value.length
  isPlaying.value = true
}

const shuffleTrack = () => {
  currentTrackIndex.value = Math.floor(Math.random() * tracks.value.length)
  isPlaying.value = true
}
</script>

<style scoped>
.media-player {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr) 110px;
  gap: 1rem;
  min-height: 560px;
  padding: 0.2rem;
}

.media-player__speaker,
.media-player__core {
  border: 2px solid #000;
  background: linear-gradient(180deg, #b9ff62 0%, #59a925 100%);
  box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.4), inset -2px -2px 0 rgba(0, 0, 0, 0.2);
}

.media-player__speaker {
  display: grid;
  place-items: center;
  gap: 1rem;
  padding: 1rem 0.75rem;
}

.media-player__speaker-ring {
  display: block;
  border-radius: 999px;
  border: 4px solid #243313;
  background: radial-gradient(circle at 30% 30%, #f4ffd3 0%, #9fe34d 25%, #466c1f 58%, #17250f 100%);
  box-shadow: inset 0 0 0 4px rgba(255, 255, 255, 0.18);
}

.media-player__speaker-ring--large {
  width: 68px;
  height: 68px;
}

.media-player__speaker-ring--small {
  width: 44px;
  height: 44px;
}

.media-player__core {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border-radius: 28px;
}

.media-player__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.media-player__status-lights {
  display: flex;
  gap: 0.45rem;
}

.media-player__light {
  width: 12px;
  height: 12px;
  border: 2px solid #243313;
  border-radius: 999px;
  background: radial-gradient(circle, #ff8bff 0%, #d31ab5 100%);
}

.media-player__transport {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
}

.media-player__transport-button,
.media-player__dock-button {
  min-height: 36px;
  padding: 0.45rem 0.8rem;
  border: 2px solid #243313;
  background: linear-gradient(180deg, #e8ffd5 0%, #a7df6a 100%);
  box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.5);
  font-family: var(--font-secondary);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
}

.media-player__transport-button--play {
  min-width: 88px;
  background: linear-gradient(180deg, #fff4d6 0%, #ffb74a 100%);
}

.media-player__layout {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr) 240px;
  gap: 1rem;
  min-height: 0;
  flex: 1;
}

.media-player__mixer,
.media-player__screen-wrap,
.media-player__playlist {
  border: 2px solid #243313;
  background: linear-gradient(180deg, rgba(231, 255, 206, 0.92) 0%, rgba(124, 181, 58, 0.96) 100%);
  box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.45);
}

.media-player__mixer,
.media-player__playlist {
  padding: 0.85rem;
}

.media-player__panel-title,
.media-player__now-playing,
.media-player__track,
.media-player__playlist-header {
  font-family: var(--font-secondary);
}

.media-player__panel-title {
  margin: 0 0 0.8rem;
  color: #2d4118;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.media-player__sliders {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.5rem;
  align-items: end;
  height: 150px;
  margin-bottom: 1rem;
}

.media-player__slider {
  position: relative;
  height: 100%;
}

.media-player__slider-track {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 3px;
  transform: translateX(-50%);
  background: #36561b;
}

.media-player__slider-thumb {
  position: absolute;
  left: 50%;
  width: 16px;
  height: 10px;
  transform: translate(-50%, 50%);
  border: 2px solid #243313;
  background: #fef6ce;
  animation: media-player-slider-pulse 2.6s ease-in-out infinite;
}

.media-player__levels {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  align-items: end;
  gap: 0.3rem;
  min-height: 80px;
}

.media-player__level-bar {
  border: 1px solid #243313;
  background: linear-gradient(180deg, #ff7dea 0%, #6d00d2 100%);
  transform-origin: bottom;
  animation: media-player-level-bounce 1.5s ease-in-out infinite;
}

.media-player__slider:nth-child(2) .media-player__slider-thumb {
  animation-delay: -0.35s;
}

.media-player__slider:nth-child(3) .media-player__slider-thumb {
  animation-delay: -1.1s;
}

.media-player__slider:nth-child(4) .media-player__slider-thumb {
  animation-delay: -0.8s;
}

.media-player__slider:nth-child(5) .media-player__slider-thumb {
  animation-delay: -1.55s;
}

.media-player__slider:nth-child(6) .media-player__slider-thumb {
  animation-delay: -0.5s;
}

.media-player__slider:nth-child(7) .media-player__slider-thumb {
  animation-delay: -1.25s;
}

.media-player__slider:nth-child(8) .media-player__slider-thumb {
  animation-delay: -0.95s;
}

.media-player__sliders--paused .media-player__slider-thumb {
  animation-play-state: paused;
}

.media-player__level-bar:nth-child(2) {
  animation-delay: -0.2s;
}

.media-player__level-bar:nth-child(3) {
  animation-delay: -0.8s;
}

.media-player__level-bar:nth-child(4) {
  animation-delay: -0.35s;
}

.media-player__level-bar:nth-child(5) {
  animation-delay: -1.1s;
}

.media-player__level-bar:nth-child(6) {
  animation-delay: -0.55s;
}

.media-player__level-bar:nth-child(7) {
  animation-delay: -1.25s;
}

.media-player__level-bar:nth-child(8) {
  animation-delay: -0.7s;
}

.media-player__level-bar:nth-child(9) {
  animation-delay: -0.95s;
}

.media-player__level-bar:nth-child(10) {
  animation-delay: -0.45s;
}

.media-player__levels--paused .media-player__level-bar {
  animation-play-state: paused;
}

.media-player__screen-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 0.95rem;
  border-radius: 26px;
}

.media-player__screen {
  position: relative;
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 1rem;
  align-items: center;
  flex: 1;
  min-height: 300px;
  padding: 1rem;
  border: 2px solid #182112;
  background: radial-gradient(circle at top, #1b250f 0%, #091004 100%);
  overflow: hidden;
}

.media-player__album {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  min-height: 220px;
}

.media-player__album-card {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 18% 22%, rgba(112, 255, 218, 0.34), transparent 30%),
    radial-gradient(ellipse at 78% 26%, rgba(84, 162, 255, 0.26), transparent 34%),
    radial-gradient(ellipse at 52% 78%, rgba(255, 98, 210, 0.22), transparent 36%);
  mix-blend-mode: screen;
}

.media-player__iframe {
  position: relative;
  z-index: 1;
  width: min(100%, 320px);
  aspect-ratio: 16 / 9;
  border: 2px solid rgba(164, 255, 112, 0.4);
  background: rgba(0, 0, 0, 0.26);
  box-shadow: 0 0 28px rgba(125, 255, 107, 0.12);
}

.media-player__iframe--audio-only {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0.01;
  pointer-events: none;
  inset: auto;
}

.media-player__album-card::before,
.media-player__album-card::after {
  content: '';
  position: absolute;
  inset: -18%;
  background:
    linear-gradient(115deg, transparent 18%, rgba(88, 255, 210, 0.78) 38%, rgba(104, 167, 255, 0.42) 56%, transparent 74%);
  mix-blend-mode: screen;
  filter: blur(22px);
}

.media-player__album-card::before {
  transform: rotate(10deg) translateX(-8%);
  animation: media-player-aurora-drift 6s ease-in-out infinite alternate;
}

.media-player__album-card::after {
  background:
    linear-gradient(165deg, transparent 24%, rgba(255, 111, 213, 0.74) 40%, rgba(114, 255, 216, 0.34) 58%, transparent 76%);
  transform: rotate(-8deg) translateX(10%);
  animation: media-player-aurora-drift 7.5s ease-in-out infinite alternate-reverse;
}

.media-player__screen-copy {
  position: relative;
  z-index: 1;
  color: #c8ff9a;
}

.media-player__screen-copy h3 {
  margin: 0.3rem 0 0.45rem;
  font-family: var(--font-tertiary);
  font-size: clamp(1.25rem, 2vw, 1.85rem);
  line-height: 1.05;
  text-transform: uppercase;
}

.media-player__screen-copy p {
  margin: 0;
}

.media-player__screen-copy small {
  display: inline-block;
  margin-top: 0.7rem;
  color: #90c96d;
  font-family: var(--font-secondary);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
}

.media-player__now-playing {
  color: #ff7dea;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.media-player__dock {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
}

.media-player__playlist {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.media-player__playlist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: #2d4118;
  font-size: 0.72rem;
  font-weight: 700;
}

.media-player__track {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.65rem;
  align-items: center;
  min-height: 64px;
  padding: 0.55rem 0.65rem;
  border: 2px solid #243313;
  background: rgba(245, 255, 228, 0.72);
  color: #294017;
  text-align: left;
  cursor: pointer;
}

.media-player__track-copy {
  min-width: 0;
  overflow: hidden;
}

.media-player__track strong,
.media-player__track small,
.media-player__track em {
  display: block;
}

.media-player__track strong {
  font-size: 0.76rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.media-player__track small,
.media-player__track em {
  color: #4d6840;
  font-size: 0.64rem;
}

.media-player__track em {
  font-style: normal;
  justify-self: end;
}

.media-player__track--active {
  background: linear-gradient(180deg, #1d2d0f 0%, #395b20 100%);
  color: #eeffca;
}

.media-player__track-marquee {
  text-overflow: clip;
}

.media-player__track-marquee span {
  display: inline-block;
  padding-right: 1.5rem;
  animation: media-player-track-marquee 8s linear infinite;
}

.media-player__track--active small,
.media-player__track--active em {
  color: #b4f788;
}

@media (max-width: 980px) {
  .media-player {
    grid-template-columns: 1fr;
  }

  .media-player__speaker {
    grid-template-columns: repeat(2, 68px);
    justify-content: center;
    padding: 0.8rem;
  }

  .media-player__core {
    border-radius: 20px;
  }

  .media-player__layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .media-player {
    min-height: 0;
    gap: 0.75rem;
  }

  .media-player__core {
    padding: 0.8rem;
    border-radius: 16px;
  }

  .media-player__topbar {
    flex-direction: column;
    align-items: stretch;
  }

  .media-player__transport {
    justify-content: center;
  }

  .media-player__screen {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
    min-height: 0;
  }

  .media-player__dock {
    flex-direction: column;
  }

  .media-player__track {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .media-player__track em {
    grid-column: 2;
  }
}

@keyframes media-player-level-bounce {
  0%,
  100% {
    transform: scaleY(0.5);
    opacity: 0.72;
  }

  25% {
    transform: scaleY(1.1);
    opacity: 1;
  }

  50% {
    transform: scaleY(0.7);
    opacity: 0.82;
  }

  75% {
    transform: scaleY(1.28);
    opacity: 1;
  }
}

@keyframes media-player-slider-pulse {
  0%,
  100% {
    transform: translate(-50%, 50%) translateY(8px);
  }

  50% {
    transform: translate(-50%, 50%) translateY(-12px);
  }
}

@keyframes media-player-aurora-drift {
  0% {
    opacity: 0.48;
    transform: rotate(8deg) translate(-10%, -4%) scale(0.96);
  }

  50% {
    opacity: 0.82;
    transform: rotate(2deg) translate(4%, 2%) scale(1.08);
  }

  100% {
    opacity: 0.58;
    transform: rotate(-6deg) translate(10%, 6%) scale(1);
  }
}

@keyframes media-player-track-marquee {
  0%,
  12% {
    transform: translateX(0);
  }

  88% {
    transform: translateX(-55%);
  }

  100% {
    transform: translateX(0);
  }
}
</style>
