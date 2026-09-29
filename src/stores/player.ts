import { computed, reactive, readonly } from 'vue'

export type Track = {
  title: string
  artist: string
  videoId: string
  duration: number
  bpm: number
}

export const TRACKS: Track[] = [
  { title: 'Pump It', artist: 'The Black Eyed Peas', videoId: 'aGj-tt1FeHQ', duration: 213, bpm: 154 },
  { title: 'The Sweet Escape', artist: 'Gwen Stefani ft. Akon', videoId: 'O0lf_fE3HwA', duration: 246, bpm: 120 },
  { title: 'Hey Ya!', artist: 'Outkast', videoId: 'RqIRp4QE-1k', duration: 235, bpm: 159 },
  { title: 'The Adventures Of Rain Dance Maggie', artist: 'Red Hot Chili Peppers', videoId: 'H8QoB3sifzw', duration: 283, bpm: 104 },
  { title: 'Bye Bye Bye', artist: '*NSYNC', videoId: 'C27NShgTQE4', duration: 201, bpm: 173 },
]

export const EQ_BANDS = ['31', '62', '125', '250', '500', '1K', '2K', '4K', '8K', '16K'] as const

export const EQ_PRESETS: Record<string, number[]> = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  rock: [5, 4, 2, -1, -2, 0, 2, 4, 5, 5],
  pop: [-1, 1, 3, 4, 3, 0, -1, -1, 1, 2],
  techno: [6, 5, 1, -2, -1, 1, 3, 5, 5, 4],
  y2k: [4, 2, 0, 2, 4, 6, 4, 2, 4, 6],
}

type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused'
type PlayerEngine = 'none' | 'youtube' | 'offline'

const state = reactive({
  index: 0,
  status: 'idle' as PlayerStatus,
  engine: 'none' as PlayerEngine,
  currentTime: 0,
  duration: TRACKS[0].duration,
  volume: 70,
  muted: false,
  shuffle: false,
  repeat: false,
  eq: [...EQ_PRESETS.flat],
  eqPreset: 'flat',
})

// Wall-clock reference for the last known playhead so visuals can interpolate between polls.
let playheadSyncedAt = performance.now()

/* ------------------------------------------------------------------ */
/* Minimal YouTube IFrame API typings                                   */
/* ------------------------------------------------------------------ */

type YouTubePlayer = {
  loadVideoById: (videoId: string, startSeconds?: number) => void
  playVideo: () => void
  pauseVideo: () => void
  stopVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  setVolume: (volume: number) => void
  mute: () => void
  unMute: () => void
  getCurrentTime: () => number
  getDuration: () => number
  destroy: () => void
}

type YouTubeNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      width: string
      height: string
      videoId: string
      playerVars: Record<string, number | string>
      events: {
        onReady: () => void
        onStateChange: (event: { data: number }) => void
        onError: (event: { data: number }) => void
      }
    },
  ) => YouTubePlayer
}

declare global {
  interface Window {
    YT?: YouTubeNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

const YT_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3 } as const
const API_TIMEOUT_MS = 8000

let youtube: YouTubePlayer | null = null
let youtubeReady: Promise<YouTubePlayer | null> | null = null
let clock: number | null = null

const loadYouTubeApi = () =>
  new Promise<YouTubeNamespace>((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT)
      return
    }

    const timeout = window.setTimeout(() => reject(new Error('YouTube API timeout')), API_TIMEOUT_MS)
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      window.clearTimeout(timeout)
      if (window.YT) {
        resolve(window.YT)
      }
    }

    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.onerror = () => {
      window.clearTimeout(timeout)
      reject(new Error('YouTube API blocked'))
    }
    document.head.appendChild(script)
  })

// The audio engine lives outside the player window so music keeps going while it is minimized.
const ensureYouTube = () => {
  youtubeReady ??= loadYouTubeApi()
    .then(
      (YT) =>
        new Promise<YouTubePlayer>((resolve, reject) => {
          let isReady = false
          const host = document.createElement('div')
          host.className = 'y2k-audio-engine'
          host.setAttribute('aria-hidden', 'true')
          host.style.cssText = 'position:fixed;width:1px;height:1px;left:-10px;bottom:0;opacity:0.01;pointer-events:none;'
          const mount = document.createElement('div')
          host.appendChild(mount)
          document.body.appendChild(host)

          const player = new YT.Player(mount, {
            width: '1',
            height: '1',
            videoId: TRACKS[state.index].videoId,
            playerVars: { autoplay: 0, controls: 0, disablekb: 1, playsinline: 1, rel: 0, modestbranding: 1 },
            events: {
              onReady: () => {
                isReady = true
                player.setVolume(state.volume)
                if (state.muted) player.mute()
                resolve(player)
              },
              onStateChange: ({ data }) => handleYouTubeState(data),
              onError: () => (isReady ? switchToOffline() : reject(new Error('YouTube embed failed'))),
            },
          })
        }),
    )
    .then((player) => {
      youtube = player
      state.engine = 'youtube'
      return player
    })
    .catch(() => {
      switchToOffline()
      return null
    })

  return youtubeReady
}

const switchToOffline = () => {
  // Embeds can be blocked (network policy, region, embedding disabled): keep the UI alive with a simulated clock.
  youtube = null
  state.engine = 'offline'

  if (state.status === 'loading') {
    state.status = 'playing'
    syncPlayhead()
  }
}

const handleYouTubeState = (code: number) => {
  if (code === YT_STATE.PLAYING) {
    state.status = 'playing'
  } else if (code === YT_STATE.PAUSED && state.status !== 'idle') {
    state.status = 'paused'
  } else if (code === YT_STATE.BUFFERING) {
    state.status = 'loading'
  } else if (code === YT_STATE.ENDED) {
    handleTrackEnd()
  }

  syncPlayhead()
}

const syncPlayhead = () => {
  playheadSyncedAt = performance.now()
}

const tick = () => {
  if (state.engine === 'youtube' && youtube) {
    state.currentTime = youtube.getCurrentTime() || 0
    state.duration = youtube.getDuration() || TRACKS[state.index].duration
    syncPlayhead()
    return
  }

  if (state.status === 'playing') {
    state.currentTime += 0.25
    syncPlayhead()

    if (state.currentTime >= state.duration) {
      handleTrackEnd()
    }
  }
}

const startClock = () => {
  clock ??= window.setInterval(tick, 250)
}

const stopClock = () => {
  if (clock !== null) {
    window.clearInterval(clock)
    clock = null
  }
}

const handleTrackEnd = () => {
  if (state.repeat) {
    seek(0)
    return
  }

  next()
}

const loadTrack = async (index: number) => {
  state.index = (index + TRACKS.length) % TRACKS.length
  state.currentTime = 0
  state.duration = TRACKS[state.index].duration
  state.status = 'loading'
  syncPlayhead()
  startClock()

  const player = await ensureYouTube()

  if (player && state.engine === 'youtube') {
    player.loadVideoById(TRACKS[state.index].videoId)
  } else {
    state.status = 'playing'
  }
}

/* ------------------------------------------------------------------ */
/* Public controls                                                      */
/* ------------------------------------------------------------------ */

const play = () => {
  if (state.status === 'idle') {
    void loadTrack(state.index)
    return
  }

  state.status = 'playing'
  syncPlayhead()
  startClock()
  youtube?.playVideo()
}

const pause = () => {
  if (state.status === 'idle') {
    return
  }

  state.status = 'paused'
  syncPlayhead()
  youtube?.pauseVideo()
}

const toggle = () => (state.status === 'playing' || state.status === 'loading' ? pause() : play())

const stop = () => {
  youtube?.stopVideo()
  state.status = 'idle'
  state.currentTime = 0
  syncPlayhead()
  stopClock()
}

const select = (index: number) => void loadTrack(index)

const next = () => {
  if (state.shuffle && TRACKS.length > 1) {
    let candidate = state.index

    while (candidate === state.index) {
      candidate = Math.floor(Math.random() * TRACKS.length)
    }

    void loadTrack(candidate)
    return
  }

  void loadTrack(state.index + 1)
}

const previous = () => {
  if (state.currentTime > 3 && state.status !== 'idle') {
    seek(0)
    return
  }

  void loadTrack(state.index - 1)
}

const seek = (seconds: number) => {
  state.currentTime = Math.max(0, Math.min(seconds, state.duration))
  syncPlayhead()
  youtube?.seekTo(state.currentTime, true)
}

const setVolume = (volume: number) => {
  state.volume = Math.max(0, Math.min(100, Math.round(volume)))
  state.muted = state.volume === 0
  youtube?.setVolume(state.volume)
  state.muted ? youtube?.mute() : youtube?.unMute()
}

const toggleMute = () => {
  state.muted = !state.muted
  state.muted ? youtube?.mute() : youtube?.unMute()
}

const toggleShuffle = () => {
  state.shuffle = !state.shuffle
}

const toggleRepeat = () => {
  state.repeat = !state.repeat
}

const setEqBand = (band: number, gain: number) => {
  state.eq[band] = gain
  state.eqPreset = 'custom'
}

const applyEqPreset = (preset: string) => {
  const gains = EQ_PRESETS[preset]

  if (gains) {
    state.eq = [...gains]
    state.eqPreset = preset
  }
}

// Playhead extrapolated from the last poll, for smooth 60fps visuals.
const getPlayhead = () =>
  state.status === 'playing'
    ? Math.min(state.duration, state.currentTime + (performance.now() - playheadSyncedAt) / 1000)
    : state.currentTime

export const player = {
  state: readonly(state),
  track: computed(() => TRACKS[state.index]),
  isPlaying: computed(() => state.status === 'playing'),
  isActive: computed(() => state.status !== 'idle'),
  play,
  pause,
  toggle,
  stop,
  select,
  next,
  previous,
  seek,
  setVolume,
  toggleMute,
  toggleShuffle,
  toggleRepeat,
  setEqBand,
  applyEqPreset,
  getPlayhead,
}

export const formatTime = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds))
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}
