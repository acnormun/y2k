<template>
  <aside v-if="isOpen" class="terminal-window" :aria-label="t('terminal.aria')">
    <header class="terminal-window__header">
      <div class="terminal-window__traffic" aria-hidden="true">
        <span class="terminal-window__dot terminal-window__dot--red" />
        <span class="terminal-window__dot terminal-window__dot--yellow" />
        <span class="terminal-window__dot terminal-window__dot--green" />
      </div>

      <p class="terminal-window__title">{{ t('terminal.title') }}</p>

      <button
        type="button"
        class="terminal-window__close"
        :aria-label="t('terminal.close')"
        @click="emit('close')"
      >
        x
      </button>
    </header>

    <div class="terminal-window__body">
      <div ref="outputRef" class="terminal-window__output">
        <p
          v-for="line in terminalLines"
          :key="line.id"
          class="terminal-window__line"
          :class="`terminal-window__line--${line.tone}`"
        >
          <span v-if="line.prefix" class="terminal-window__prefix">{{ line.prefix }}</span>
          <span>{{ line.text }}</span>
        </p>
      </div>

      <div class="terminal-window__folders">
        <button
          v-for="shortcut in shortcuts"
          :key="shortcut.command"
          type="button"
          class="terminal-window__folder"
          @click="runShortcut(shortcut.command)"
        >
          <strong>{{ shortcut.label }}</strong>
          <span>{{ shortcut.command }}</span>
        </button>
      </div>

      <form class="terminal-window__prompt" @submit.prevent="submitCommand">
        <label class="terminal-window__input-wrap">
          <span class="terminal-window__prompt-mark">&gt;</span>
          <input
            ref="inputRef"
            v-model="command"
            type="text"
            class="terminal-window__input"
            autocomplete="off"
            spellcheck="false"
            :placeholder="t('terminal.placeholder')"
            @keydown.up.prevent="browseHistory('up')"
            @keydown.down.prevent="browseHistory('down')"
          >
        </label>

        <button type="submit" class="terminal-window__submit">
          {{ t('terminal.run') }}
        </button>
      </form>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

type ModalTarget = 'welcome' | 'my-work' | 'about' | 'resume' | 'contact' | 'snake'
type LineTone = 'boot' | 'success' | 'command' | 'info' | 'error' | 'accent'
type TerminalLine = {
  id: number
  prefix?: string
  text: string
  tone: LineTone
}

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'open-modal', modal: ModalTarget): void
}>()

const { t, locale } = useI18n()

const bootLines = (): TerminalLine[] => [
  { id: 1, prefix: '>', text: t('terminal.boot.loading'), tone: 'boot' },
  { id: 2, prefix: '>', text: t('terminal.boot.index'), tone: 'success' },
  { id: 3, prefix: '>', text: t('terminal.boot.styles'), tone: 'success' },
  { id: 4, prefix: '>', text: t('terminal.boot.commands'), tone: 'success' },
  { id: 5, prefix: '>', text: '_', tone: 'boot' },
  { id: 6, prefix: '>', text: t('terminal.boot.check'), tone: 'accent' },
  { id: 7, prefix: '>', text: t('terminal.boot.hint'), tone: 'info' },
]

const shortcuts = computed(() => [
  { label: t('terminal.shortcuts.myWork'), command: 'open my-work' },
  { label: t('terminal.shortcuts.about'), command: 'open about' },
  { label: t('terminal.shortcuts.resume'), command: 'open resume' },
  { label: t('terminal.shortcuts.contact'), command: 'open contact' },
  { label: t('terminal.shortcuts.snake'), command: 'run snake' },
])

const command = ref('')
const terminalLines = ref<TerminalLine[]>(bootLines())
const commandHistory = ref<string[]>([])
const historyIndex = ref(-1)
const inputRef = ref<HTMLInputElement | null>(null)
const outputRef = ref<HTMLElement | null>(null)
const lineId = ref(terminalLines.value.length + 1)

const pushLine = (text: string, tone: LineTone, prefix = '>') => {
  terminalLines.value.push({
    id: lineId.value,
    prefix,
    text,
    tone,
  })
  lineId.value += 1
}

const scrollToBottom = async () => {
  await nextTick()

  if (outputRef.value) {
    outputRef.value.scrollTop = outputRef.value.scrollHeight
  }
}

const openSection = (target: ModalTarget, label: string) => {
  emit('open-modal', target)
  pushLine(t('terminal.responses.opening', { label }), 'success')
  void scrollToBottom()
}

const resetTerminal = () => {
  terminalLines.value = bootLines()
  lineId.value = terminalLines.value.length + 1
}

const executeCommand = (rawCommand: string) => {
  const normalized = rawCommand.trim().toLowerCase()

  if (!normalized) {
    pushLine('_', 'boot')
    return
  }

  if (normalized === 'help') {
    pushLine(t('terminal.responses.help'), 'info')
    return
  }

  if (normalized === 'ls' || normalized === 'dir') {
    pushLine(t('terminal.responses.directories'), 'info')
    return
  }

  if (normalized === 'clear' || normalized === 'cls') {
    resetTerminal()
    return
  }

  if (normalized === 'exit' || normalized === 'close') {
    pushLine(t('terminal.responses.closing'), 'info')
    emit('close')
    return
  }

  if (normalized === 'open about') {
    openSection('about', t('terminal.labels.about'))
    return
  }

  if (normalized === 'open resume' || normalized === 'open cv' || normalized === 'open doc') {
    openSection('resume', t('terminal.labels.resume'))
    return
  }

  if (normalized === 'open my-work' || normalized === 'open work' || normalized === 'open portfolio') {
    openSection('my-work', t('terminal.labels.myWork'))
    return
  }

  if (normalized === 'open contact' || normalized === 'open mail') {
    openSection('contact', t('terminal.labels.contact'))
    return
  }

  if (normalized === 'run snake' || normalized === 'open snake' || normalized === 'play snake') {
    openSection('snake', t('terminal.labels.snake'))
    return
  }

  pushLine(t('terminal.responses.unknown', { command: normalized }), 'error')
}

const submitCommand = () => {
  const rawCommand = command.value
  const trimmed = rawCommand.trim()

  pushLine(trimmed || '_', 'command')

  if (trimmed) {
    commandHistory.value.unshift(trimmed)
  }

  historyIndex.value = -1
  command.value = ''
  executeCommand(rawCommand)
  void scrollToBottom()
}

const runShortcut = (shortcutCommand: string) => {
  command.value = shortcutCommand
  submitCommand()
}

const browseHistory = (direction: 'up' | 'down') => {
  if (commandHistory.value.length === 0) {
    return
  }

  if (direction === 'up') {
    historyIndex.value = Math.min(historyIndex.value + 1, commandHistory.value.length - 1)
  } else {
    historyIndex.value = Math.max(historyIndex.value - 1, -1)
  }

  command.value = historyIndex.value === -1 ? '' : commandHistory.value[historyIndex.value]
}

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (!isOpen) {
      return
    }

    await nextTick()
    inputRef.value?.focus()
    void scrollToBottom()
  },
  { immediate: true },
)

watch(locale, () => {
  resetTerminal()
})
</script>

<style scoped>
.terminal-window {
  position: fixed;
  top: 5.5rem;
  right: 1.25rem;
  z-index: 55;
  width: min(430px, calc(100vw - 1.5rem));
  border: 3px solid #050505;
  background: #111707;
  box-shadow: 10px 10px 0 rgba(0, 0, 0, 0.28);
  overflow: hidden;
}

.terminal-window__header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  border-bottom: 3px solid #050505;
  background: #232a3a;
}

.terminal-window__traffic {
  display: inline-flex;
  gap: 0.45rem;
}

.terminal-window__dot {
  width: 13px;
  height: 13px;
  border-radius: 999px;
}

.terminal-window__dot--red {
  background: #ff605c;
}

.terminal-window__dot--yellow {
  background: #ffbd44;
}

.terminal-window__dot--green {
  background: #00ca4e;
}

.terminal-window__title,
.terminal-window__line,
.terminal-window__folder,
.terminal-window__input,
.terminal-window__submit,
.terminal-window__close {
  font-family: var(--font-secondary);
}

.terminal-window__title {
  margin: 0;
  color: #d9dee9;
  font-size: 0.96rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-align: center;
}

.terminal-window__close {
  border: 0;
  background: transparent;
  color: #d9dee9;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
}

.terminal-window__body {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1rem;
  background:
    linear-gradient(180deg, rgba(18, 27, 8, 0.88) 0%, rgba(10, 15, 4, 0.96) 100%);
}

.terminal-window__output {
  max-height: 270px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding-right: 0.15rem;
}

.terminal-window__line {
  display: flex;
  gap: 0.45rem;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.35;
}

.terminal-window__prefix {
  color: inherit;
  font-weight: 700;
}

.terminal-window__line--boot,
.terminal-window__line--success {
  color: #36ff20;
}

.terminal-window__line--command {
  color: #d7ffbf;
}

.terminal-window__line--info {
  color: #a8ffa7;
}

.terminal-window__line--accent {
  color: #d728cb;
}

.terminal-window__line--error {
  color: #ff6d7f;
}

.terminal-window__folders {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
}

.terminal-window__folder {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  align-items: flex-start;
  padding: 0.7rem;
  border: 2px solid rgba(76, 119, 57, 0.9);
  background: rgba(27, 40, 13, 0.85);
  color: #9cff7f;
  cursor: pointer;
  text-align: left;
}

.terminal-window__folder strong {
  font-size: 0.82rem;
  letter-spacing: 0.08em;
}

.terminal-window__folder span {
  color: #7ae0ff;
  font-size: 0.72rem;
}

.terminal-window__folder:hover,
.terminal-window__submit:hover {
  filter: brightness(1.06);
}

.terminal-window__prompt {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.7rem;
}

.terminal-window__input-wrap {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.75rem 0.85rem;
  border: 2px solid #395729;
  background: #0b1205;
}

.terminal-window__prompt-mark {
  color: #36ff20;
  font-family: var(--font-secondary);
  font-size: 1rem;
  font-weight: 700;
}

.terminal-window__input {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: #dcffc8;
  font-size: 0.88rem;
}

.terminal-window__input::placeholder {
  color: #77936f;
}

.terminal-window__submit {
  min-width: 78px;
  border: 2px solid #050505;
  background: linear-gradient(180deg, #34ff65 0%, #14993e 100%);
  color: #061307;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

@media (max-width: 720px) {
  .terminal-window {
    top: auto;
    right: 0.75rem;
    left: 0.75rem;
    bottom: 4.75rem;
    width: auto;
  }

  .terminal-window__folders {
    grid-template-columns: 1fr;
  }

  .terminal-window__output {
    max-height: 220px;
  }
}
</style>
