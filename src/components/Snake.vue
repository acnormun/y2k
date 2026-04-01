<template>
  <Modal
    title="SNAKE_OS // RETRO_GRID"
    :icon="modalIcon"
    :is-open="isOpen"
    :show-status-bar="true"
    :status-label="statusLabel"
    :cpu-usage="`SCORE: ${score.toString().padStart(3, '0')}`"
    :ram-usage="`HIGH: ${highScore.toString().padStart(3, '0')}`"
    :shell-label="shellLabel"
    @close="emit('close')"
  >
    <section class="snake-modal" aria-label="Retro snake game">
      <div class="snake-modal__shell">
        <header class="snake-modal__header">
          <div>
            <p class="snake-modal__eyebrow">ARCADE.EXE</p>
            <h3 class="snake-modal__title">snake protocol online</h3>
          </div>

          <div class="snake-modal__stats" aria-label="Game stats">
            <span>score {{ score.toString().padStart(3, '0') }}</span>
            <span>high {{ highScore.toString().padStart(3, '0') }}</span>
            <span>speed {{ tickMs }}ms</span>
          </div>
        </header>

        <div class="snake-modal__layout">
          <div class="snake-modal__board-wrap">
            <div
              class="snake-modal__board"
              role="application"
              aria-label="Snake board"
              tabindex="0"
              @keydown="handleKeydown"
            >
              <div
                v-for="cell in cells"
                :key="`${cell.x}-${cell.y}`"
                class="snake-modal__cell"
                :class="cell.className"
              />

              <div v-if="gameOver" class="snake-modal__overlay">
                <p class="snake-modal__overlay-title">signal lost</p>
                <p class="snake-modal__overlay-copy">pressione restart para jogar de novo</p>
              </div>

              <div v-else-if="!hasStarted" class="snake-modal__overlay">
                <p class="snake-modal__overlay-title">ready player one</p>
                <p class="snake-modal__overlay-copy">use as setas ou wasd para iniciar</p>
              </div>

              <div v-else-if="isPaused" class="snake-modal__overlay">
                <p class="snake-modal__overlay-title">paused</p>
                <p class="snake-modal__overlay-copy">aperte space para continuar</p>
              </div>
            </div>
          </div>

          <aside class="snake-modal__panel">
            <p class="snake-modal__panel-title">control matrix</p>

            <ul class="snake-modal__keys">
              <li><strong>w / ↑</strong> move up</li>
              <li><strong>s / ↓</strong> move down</li>
              <li><strong>a / ←</strong> move left</li>
              <li><strong>d / →</strong> move right</li>
              <li><strong>space</strong> pause</li>
            </ul>

            <p class="snake-modal__hint">
              coma os pixels magenta, cresça e não bata nas bordas nem em você mesma.
            </p>

            <div class="snake-modal__actions">
              <button type="button" class="snake-modal__button" @click="startGame(true)">
                restart
              </button>
              <button
                type="button"
                class="snake-modal__button snake-modal__button--secondary"
                @click="togglePause"
              >
                {{ isPaused ? 'resume' : 'pause' }}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  </Modal>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Modal from './Modal.vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

type Direction = 'up' | 'down' | 'left' | 'right'
type CellClass = 'snake-modal__cell--snake' | 'snake-modal__cell--head' | 'snake-modal__cell--food' | ''
type Segment = { x: number; y: number }

const modalIcon = new URL('../assets/prompt_red.svg', import.meta.url).href

const COLS = 18
const ROWS = 18
const INITIAL_SNAKE: Segment[] = [
  { x: 8, y: 9 },
  { x: 7, y: 9 },
  { x: 6, y: 9 },
]
const STORAGE_KEY = 'retro-snake-high-score'

const snake = ref<Segment[]>([])
const food = ref<Segment>({ x: 12, y: 9 })
const direction = ref<Direction>('right')
const queuedDirection = ref<Direction>('right')
const tickMs = ref(180)
const score = ref(0)
const highScore = ref(0)
const hasStarted = ref(false)
const isPaused = ref(false)
const gameOver = ref(false)

let gameTimer: number | null = null

const isOppositeDirection = (next: Direction, current: Direction) => {
  return (
    (next === 'up' && current === 'down') ||
    (next === 'down' && current === 'up') ||
    (next === 'left' && current === 'right') ||
    (next === 'right' && current === 'left')
  )
}

const randomFood = () => {
  const occupied = new Set(snake.value.map((segment) => `${segment.x}-${segment.y}`))
  const available: Segment[] = []

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (!occupied.has(`${x}-${y}`)) {
        available.push({ x, y })
      }
    }
  }

  if (available.length === 0) {
    return { x: 0, y: 0 }
  }

  return available[Math.floor(Math.random() * available.length)]
}

const clearGameTimer = () => {
  if (gameTimer !== null) {
    window.clearInterval(gameTimer)
    gameTimer = null
  }
}

const persistHighScore = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, String(highScore.value))
  }
}

const finishGame = () => {
  gameOver.value = true
  hasStarted.value = false
  isPaused.value = false
  clearGameTimer()
}

const step = () => {
  const activeDirection = queuedDirection.value
  direction.value = activeDirection

  const head = snake.value[0]
  const nextHead = { x: head.x, y: head.y }

  if (activeDirection === 'up') nextHead.y -= 1
  if (activeDirection === 'down') nextHead.y += 1
  if (activeDirection === 'left') nextHead.x -= 1
  if (activeDirection === 'right') nextHead.x += 1

  const hitWall =
    nextHead.x < 0 ||
    nextHead.x >= COLS ||
    nextHead.y < 0 ||
    nextHead.y >= ROWS

  const hitSelf = snake.value.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y)

  if (hitWall || hitSelf) {
    finishGame()
    return
  }

  const nextSnake = [nextHead, ...snake.value]
  const ateFood = nextHead.x === food.value.x && nextHead.y === food.value.y

  if (!ateFood) {
    nextSnake.pop()
  } else {
    score.value += 10
    highScore.value = Math.max(highScore.value, score.value)
    persistHighScore()
    tickMs.value = Math.max(80, tickMs.value - 6)
    food.value = randomFood()
  }

  snake.value = nextSnake
}

const startLoop = () => {
  clearGameTimer()
  gameTimer = window.setInterval(step, tickMs.value)
}

const resetState = () => {
  snake.value = INITIAL_SNAKE.map((segment) => ({ ...segment }))
  direction.value = 'right'
  queuedDirection.value = 'right'
  score.value = 0
  tickMs.value = 180
  hasStarted.value = false
  isPaused.value = false
  gameOver.value = false
  food.value = randomFood()
}

const startGame = (forceReset = false) => {
  if (forceReset || gameOver.value || snake.value.length === 0) {
    resetState()
  }

  if (hasStarted.value && !forceReset) {
    return
  }

  hasStarted.value = true
  isPaused.value = false
  gameOver.value = false
  startLoop()
}

const queueDirection = (next: Direction) => {
  const baseDirection = hasStarted.value ? queuedDirection.value : direction.value

  if (isOppositeDirection(next, baseDirection)) {
    return
  }

  queuedDirection.value = next

  if (!hasStarted.value) {
    startGame()
  }
}

const togglePause = () => {
  if (!hasStarted.value || gameOver.value) {
    return
  }

  isPaused.value = !isPaused.value

  if (isPaused.value) {
    clearGameTimer()
    return
  }

  startLoop()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!props.isOpen) {
    return
  }

  const key = event.key.toLowerCase()

  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(key)) {
    event.preventDefault()
  }

  if (key === ' ' || key === 'spacebar') {
    togglePause()
    return
  }

  if (key === 'arrowup' || key === 'w') queueDirection('up')
  if (key === 'arrowdown' || key === 's') queueDirection('down')
  if (key === 'arrowleft' || key === 'a') queueDirection('left')
  if (key === 'arrowright' || key === 'd') queueDirection('right')
}

const cells = computed(() => {
  const snakeMap = new Map(snake.value.map((segment, index) => [`${segment.x}-${segment.y}`, index]))
  const head = snake.value[0]
  const list: Array<{ x: number; y: number; className: CellClass }> = []

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      let className: CellClass = ''
      const snakeIndex = snakeMap.get(`${x}-${y}`)

      if (food.value.x === x && food.value.y === y) {
        className = 'snake-modal__cell--food'
      }

      if (snakeIndex !== undefined) {
        className = snakeIndex === 0 && head ? 'snake-modal__cell--head' : 'snake-modal__cell--snake'
      }

      list.push({ x, y, className })
    }
  }

  return list
})

const statusLabel = computed(() => {
  if (gameOver.value) return 'GAME OVER'
  if (isPaused.value) return 'PAUSED'
  if (!hasStarted.value) return 'READY'
  return 'RUNNING'
})

const shellLabel = computed(() => {
  return hasStarted.value && !isPaused.value ? 'ARCADE_LINKED' : 'WAITING_INPUT'
})

watch(tickMs, () => {
  if (hasStarted.value && !isPaused.value && !gameOver.value) {
    startLoop()
  }
})

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      resetState()
      return
    }

    clearGameTimer()
  },
  { immediate: true },
)

onMounted(() => {
  if (typeof window !== 'undefined') {
    const storedHighScore = Number(window.localStorage.getItem(STORAGE_KEY) ?? '0')
    highScore.value = Number.isFinite(storedHighScore) ? storedHighScore : 0
  }

  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  clearGameTimer()
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.snake-modal {
  min-height: 100%;
  padding: 0.15rem;
}

.snake-modal__shell {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 100%;
  padding: 1rem;
  border: 2px solid #1a1a1a;
  background:
    radial-gradient(circle at top, rgba(255, 83, 205, 0.12), transparent 32%),
    linear-gradient(180deg, #0b110b 0%, #131e13 100%);
  color: #d7ffb8;
  box-shadow:
    inset 0 0 0 2px rgba(135, 255, 117, 0.15),
    inset 0 0 32px rgba(53, 255, 73, 0.08);
}

.snake-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.snake-modal__eyebrow,
.snake-modal__stats,
.snake-modal__panel-title,
.snake-modal__keys,
.snake-modal__hint,
.snake-modal__button,
.snake-modal__overlay-copy {
  font-family: var(--font-secondary);
}

.snake-modal__eyebrow {
  margin: 0 0 0.25rem;
  color: #ff6ce1;
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.snake-modal__title {
  margin: 0;
  color: #f6ffd7;
  font-family: var(--font-tertiary);
  font-size: clamp(1.15rem, 2vw, 1.6rem);
  text-transform: uppercase;
}

.snake-modal__stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.65rem;
  color: #9ff3ff;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.snake-modal__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 1rem;
  min-height: 0;
}

.snake-modal__board-wrap,
.snake-modal__panel {
  border: 2px solid #6d7766;
  background: rgba(2, 7, 2, 0.72);
  box-shadow:
    inset 1px 1px 0 rgba(255, 255, 255, 0.1),
    inset -1px -1px 0 rgba(0, 0, 0, 0.5);
}

.snake-modal__board-wrap {
  padding: 0.9rem;
}

.snake-modal__board {
  position: relative;
  display: grid;
  grid-template-columns: repeat(18, minmax(0, 1fr));
  gap: 2px;
  aspect-ratio: 1;
  width: min(100%, 520px);
  margin: 0 auto;
  padding: 0.45rem;
  outline: none;
  background:
    linear-gradient(180deg, rgba(138, 255, 129, 0.06) 0%, rgba(0, 0, 0, 0) 100%),
    #040804;
  box-shadow:
    inset 0 0 0 2px rgba(122, 255, 114, 0.18),
    inset 0 0 28px rgba(31, 255, 31, 0.08);
}

.snake-modal__board::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(123, 255, 114, 0.06) 50%, transparent 50%);
  background-size: 100% 6px;
  pointer-events: none;
}

.snake-modal__cell {
  border: 1px solid rgba(178, 255, 174, 0.08);
  background: rgba(123, 255, 114, 0.03);
}

.snake-modal__cell--snake {
  background: linear-gradient(180deg, #7aff72 0%, #2bd535 100%);
  box-shadow: 0 0 8px rgba(88, 255, 88, 0.3);
}

.snake-modal__cell--head {
  background: linear-gradient(180deg, #d6ff6c 0%, #69ff48 100%);
  box-shadow: 0 0 12px rgba(214, 255, 108, 0.35);
}

.snake-modal__cell--food {
  background: linear-gradient(180deg, #ff8be9 0%, #ff3bc1 100%);
  box-shadow: 0 0 12px rgba(255, 97, 214, 0.38);
}

.snake-modal__overlay {
  position: absolute;
  inset: 1rem;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 0.45rem;
  padding: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.15);
  background: rgba(4, 8, 4, 0.82);
  text-align: center;
}

.snake-modal__overlay-title {
  margin: 0;
  color: #ff77e6;
  font-family: var(--font-tertiary);
  font-size: 1.4rem;
  text-transform: uppercase;
}

.snake-modal__overlay-copy {
  margin: 0;
  color: #ddfacc;
  font-size: 0.8rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.snake-modal__panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.snake-modal__panel-title {
  margin: 0;
  color: #ff77e6;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.snake-modal__keys {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
  color: #dfffc9;
  font-size: 0.82rem;
}

.snake-modal__keys strong {
  color: #9ff3ff;
  text-transform: uppercase;
}

.snake-modal__hint {
  margin: 0;
  color: #a8c7a1;
  font-size: 0.78rem;
  line-height: 1.6;
}

.snake-modal__actions {
  display: flex;
  gap: 0.75rem;
  margin-top: auto;
}

.snake-modal__button {
  flex: 1;
  min-height: 42px;
  border: 2px solid #0d0d0d;
  background: linear-gradient(180deg, #ff6ce1 0%, #d626b2 100%);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.28);
}

.snake-modal__button--secondary {
  background: linear-gradient(180deg, #2dff89 0%, #11943b 100%);
}

.snake-modal__button:hover {
  filter: brightness(1.04);
}

@media (max-width: 860px) {
  .snake-modal__layout {
    grid-template-columns: 1fr;
  }

  .snake-modal__board {
    width: min(100%, 420px);
  }
}

@media (max-width: 640px) {
  .snake-modal__shell {
    padding: 0.8rem;
  }

  .snake-modal__header {
    flex-direction: column;
  }

  .snake-modal__stats {
    justify-content: flex-start;
  }

  .snake-modal__board-wrap,
  .snake-modal__panel {
    padding: 0.8rem;
  }

  .snake-modal__actions {
    flex-direction: column;
  }
}
</style>
