<template>
  <Modal
    :title="t('contact.title')"
    :icon="modalIcon"
    :isOpen="isOpen"
    @close="emit('close')"
  >
    <section class="contact-terminal" :aria-label="t('contact.aria')">
      <aside class="contact-terminal__rail">
        <div class="contact-terminal__panel-title">{{ t('contact.panelTitle') }}</div>

        <nav class="contact-terminal__nav" :aria-label="t('contact.navAria')">
          <a
            v-for="node in contactNodes"
            :key="node.label"
            class="contact-terminal__node"
            :href="node.href"
            target="_blank"
            rel="noreferrer"
          >
            <span class="contact-terminal__node-icon" aria-hidden="true">{{ node.icon }}</span>
            <span class="contact-terminal__node-copy">
              <strong>{{ node.label }}</strong>
              <small>{{ node.status }}</small>
            </span>
          </a>
        </nav>

        <div class="contact-terminal__channels">
          <p class="contact-terminal__caption">{{ t('contact.channels') }}</p>
          <ul class="contact-terminal__channel-list">
            <li v-for="channel in channels" :key="channel">
              # {{ channel }}
            </li>
          </ul>
        </div>
      </aside>

      <div class="contact-terminal__main">
        <header class="contact-terminal__topbar">
          <span class="contact-terminal__topbar-label">{{ t('contact.topbar') }}</span>
          <span class="contact-terminal__topbar-time">{{ currentTime }}</span>
        </header>

        <div ref="messagesPanelRef" class="contact-terminal__messages">
          <article
            v-for="message in messages"
            :key="message.id"
            class="contact-terminal__message"
            :class="`contact-terminal__message--${message.role}`"
          >
            <div class="contact-terminal__meta">
              <span>{{ message.author }}</span>
              <span>{{ message.time }}</span>
            </div>
            <p>{{ message.text }}</p>
          </article>
        </div>

        <footer class="contact-terminal__composer">
          <div class="contact-terminal__composer-actions" :aria-label="t('contact.composerActions')">
            <button v-for="action in composerActions" :key="action.label" type="button">
              <img v-if="action.iconSrc" :src="action.iconSrc" :alt="action.label">
              <span v-else>{{ action.label }}</span>
            </button>
          </div>

          <form class="contact-terminal__composer-row" @submit.prevent="sendMessage">
            <label class="contact-terminal__input-wrap">
              <span class="sr-only">{{ t('contact.inputLabel') }}</span>
              <textarea
                v-model="draftMessage"
                rows="2"
                :placeholder="t('contact.placeholder')"
                @keydown.enter.exact.prevent="sendMessage"
              />
            </label>

            <button
              class="contact-terminal__send"
              type="submit"
              :disabled="!draftMessage.trim()"
            >
              <span>&gt;</span>
              <strong>{{ t('contact.send') }}</strong>
            </button>
          </form>
        </footer>
      </div>

      <aside class="contact-terminal__profile">
        <div class="contact-terminal__avatar-frame">
          <img :src="avatar" :alt="t('contact.avatarAlt')">
          <span class="contact-terminal__avatar-status" />
        </div>

        <div class="contact-terminal__profile-copy">
          <p class="contact-terminal__handle">{{ t('contact.handle') }}</p>
          <p class="contact-terminal__role">{{ t('contact.role') }}</p>
        </div>

        <div class="contact-terminal__status-card">
          <p class="contact-terminal__status-title">{{ t('contact.status') }}</p>
          <div class="contact-terminal__status-row">
            <span>{{ t('contact.online') }}</span>
            <span class="contact-terminal__status-pill">{{ t('contact.live') }}</span>
          </div>
          <p class="contact-terminal__status-text">{{ t('contact.statusText') }}</p>
        </div>

        <div class="contact-terminal__terminal-card">
          <p>CPU_USE: [||||||||--]</p>
          <p>SYS: OK</p>
          <p>UPTIME: 1,421 HRS</p>
          <p>{{ t('contact.location') }}</p>
        </div>
      </aside>
    </section>
  </Modal>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from './Modal.vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t, locale } = useI18n()
const modalIcon = new URL('../assets/contact.svg', import.meta.url).href
const avatar = new URL('../assets/hero.png', import.meta.url).href

const contactNodes = computed(() => [
  {
    label: 'LinkedIn',
    status: t('contact.linkedinStatus'),
    icon: 'in',
    href: 'https://www.linkedin.com/in/acnoronha/'
  },
  {
    label: 'GitHub',
    status: t('contact.githubStatus'),
    icon: 'GH',
    href: 'https://github.com/acnormun'
  }
])

const channels = computed(() => [t('contact.channelGeneral'), t('contact.channelDebug')])

type ChatMessage = {
  id: number
  role: 'system' | 'guest'
  author: string
  time: string
  text: string
}

const createInitialMessages = (): ChatMessage[] => [
  {
    id: 1,
    role: 'system',
    author: t('contact.systemUser'),
    time: getCurrentTime(),
    text: t('contact.initialMessages.welcome')
  },
  {
    id: 2,
    role: 'guest',
    author: t('contact.guestUser'),
    time: getCurrentTime(),
    text: t('contact.initialMessages.guest')
  },
  {
    id: 3,
    role: 'system',
    author: t('contact.systemUser'),
    time: getCurrentTime(),
    text: t('contact.initialMessages.prompt')
  }
]

const messages = ref<ChatMessage[]>(createInitialMessages())
const draftMessage = ref('')
const messagesPanelRef = ref<HTMLElement | null>(null)
const currentTime = ref('')
const composerActions = [
  {
    label: 'emoji',
    iconSrc: new URL('../assets/smile.svg', import.meta.url).href
  },
  {
    label: 'attach',
    iconSrc: new URL('../assets/clip.svg', import.meta.url).href
  },
  {
    label: 'voice',
    iconSrc: new URL('../assets/mic.svg', import.meta.url).href
  }
]

function getCurrentTime() {
  return new Date().toLocaleTimeString(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function scrollMessagesToBottom() {
  await nextTick()

  if (messagesPanelRef.value) {
    messagesPanelRef.value.scrollTop = messagesPanelRef.value.scrollHeight
  }
}

function queueSystemReply() {
  window.setTimeout(async () => {
    messages.value.push({
      id: Date.now() + 1,
      role: 'system',
      author: t('contact.systemUser'),
      time: getCurrentTime(),
      text: t('contact.autoReply')
    })

    await scrollMessagesToBottom()
  }, 420)
}

async function sendMessage() {
  const text = draftMessage.value.trim()

  if (!text) {
    return
  }

  messages.value.push({
    id: Date.now(),
    role: 'guest',
    author: t('contact.guestUser'),
    time: getCurrentTime(),
    text
  })

  draftMessage.value = ''
  await scrollMessagesToBottom()
  queueSystemReply()
}

const resetMessages = () => {
  currentTime.value = getCurrentTime()
  messages.value = createInitialMessages()
}

watch(locale, resetMessages, { immediate: true })
watch(
  () => props.isOpen,
  () => {
    currentTime.value = getCurrentTime()
  },
  { immediate: true },
)
</script>

<style scoped>
.contact-terminal {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr) 170px;
  height: 580px;
  border: 2px solid #000;
  background: #fbf9db;
  overflow: hidden;
}

.contact-terminal__rail,
.contact-terminal__main,
.contact-terminal__profile {
  min-width: 0;
  min-height: 0;
}

.contact-terminal__rail {
  display: flex;
  flex-direction: column;
  border-right: 2px solid #000;
  background: linear-gradient(180deg, #f8f5d9 0%, #f5f1cc 100%);
}

.contact-terminal__panel-title {
  padding: 0.75rem 0.8rem;
  border-bottom: 2px solid #000;
  color: #0b8d1b;
  font-family: var(--font-tertiary);
  font-size: 0.92rem;
  font-weight: 800;
}

.contact-terminal__nav {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.85rem 0.55rem 1rem;
}

.contact-terminal__node {
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 0.65rem;
  align-items: center;
  padding: 0.45rem 0.35rem;
  color: #4b4638;
  font-family: var(--font-secondary);
  transition: background-color 160ms ease, transform 160ms ease;
}

.contact-terminal__node:hover {
  background: rgba(179, 0, 179, 0.08);
  transform: translateX(2px);
}

.contact-terminal__node-icon {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 2px solid #d92ed5;
  color: #d92ed5;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1;
}

.contact-terminal__node-copy {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.contact-terminal__node-copy strong {
  font-size: 0.8rem;
}

.contact-terminal__node-copy small {
  color: #7d7762;
  font-size: 0.68rem;
  text-transform: uppercase;
}

.contact-terminal__channels {
  margin-top: auto;
  padding: 0.8rem;
  border-top: 2px solid #000;
}

.contact-terminal__caption,
.contact-terminal__status-title {
  margin: 0;
  color: #8d866c;
  font-family: var(--font-secondary);
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.contact-terminal__channel-list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin: 0.75rem 0 0;
  padding: 0;
  list-style: none;
  color: #525040;
  font-family: var(--font-secondary);
  font-size: 0.74rem;
  font-weight: 700;
}

.contact-terminal__main {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 0;
  background: #fffef8;
}

.contact-terminal__topbar {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.65rem 0.8rem;
  border-bottom: 2px solid #000;
  color: #ad45d7;
  font-family: var(--font-secondary);
  font-size: 0.72rem;
  font-weight: 700;
}

.contact-terminal__topbar-time {
  color: #89836e;
}

.contact-terminal__messages {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
  overflow-y: auto;
  padding: 1rem 0.8rem;
  background:
    linear-gradient(180deg, rgba(251, 249, 219, 0.45) 0%, rgba(255, 255, 255, 0) 26%),
    #fffef8;
}

.contact-terminal__message {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  max-width: 85%;
  padding: 0.75rem 0.8rem;
  border-left: 4px solid #d92ed5;
  background: #f6f1ca;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
}

.contact-terminal__message--guest {
  align-self: flex-end;
  border-left: 0;
  border-right: 4px solid #0b8d1b;
  background: #b9f5b0;
}

.contact-terminal__meta {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: #918a72;
  font-family: var(--font-secondary);
  font-size: 0.63rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.contact-terminal__message p {
  margin: 0;
  color: #54503f;
  font-family: var(--font-secondary);
  font-size: 0.92rem;
  line-height: 1.45;
}

.contact-terminal__composer {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 0.85rem 0.8rem;
  border-top: 2px solid #000;
  background: #f8f4d5;
}

.contact-terminal__composer-actions {
  display: flex;
  gap: 0.55rem;
}

.contact-terminal__composer-actions button {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 2px solid #000;
  border-radius: 999px;
  background: linear-gradient(180deg, #ff5eff 0%, #c600c4 100%);
  color: #fff;
  font-family: var(--font-secondary);
  font-size: 0.78rem;
  font-weight: 700;
}

.contact-terminal__composer-actions button:nth-child(2) {
  background: linear-gradient(180deg, #4ad6ff 0%, #0992c4 100%);
}

.contact-terminal__composer-actions button:nth-child(3) {
  background: linear-gradient(180deg, #60ef72 0%, #0b8d1b 100%);
}

.contact-terminal__composer-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.7rem;
  align-items: stretch;
}

.contact-terminal__input-wrap {
  display: flex;
}

.contact-terminal__input-wrap textarea {
  width: 100%;
  resize: none;
  padding: 0.95rem 1rem;
  border: 2px solid #000;
  background: #fffef8;
  color: #595443;
  font-family: var(--font-secondary);
  font-size: 0.95rem;
  box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.08);
}

.contact-terminal__input-wrap textarea::placeholder {
  color: #a59d84;
}

.contact-terminal__send {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.1rem;
  min-width: 78px;
  padding: 0.8rem 0.9rem;
  border: 2px solid #000;
  background: linear-gradient(180deg, #d92ed5 0%, #9a0098 100%);
  color: #fffef6;
  font-family: var(--font-tertiary);
  text-align: center;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.15);
  cursor: pointer;
}

.contact-terminal__send span {
  font-size: 1.15rem;
  line-height: 1;
}

.contact-terminal__send strong {
  font-size: 0.84rem;
  letter-spacing: 0.08em;
}

.contact-terminal__send:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.contact-terminal__profile {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 0.8rem;
  border-left: 2px solid #000;
  background: linear-gradient(180deg, #faf7df 0%, #f2ecc7 100%);
}

.contact-terminal__avatar-frame {
  position: relative;
  border: 2px solid #000;
  background: #1b1531;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.15);
}

.contact-terminal__avatar-frame img {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

.contact-terminal__avatar-status {
  position: absolute;
  right: -8px;
  bottom: 10px;
  width: 16px;
  height: 16px;
  border: 2px solid #fffef8;
  border-radius: 999px;
  background: #31de44;
}

.contact-terminal__profile-copy {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.contact-terminal__handle,
.contact-terminal__role,
.contact-terminal__status-card p,
.contact-terminal__terminal-card p {
  margin: 0;
}

.contact-terminal__handle {
  color: #d92ed5;
  font-family: var(--font-tertiary);
  font-size: 1.15rem;
  font-weight: 800;
}

.contact-terminal__role {
  color: #6f6857;
  font-family: var(--font-secondary);
  font-size: 0.74rem;
  font-weight: 700;
}

.contact-terminal__status-card,
.contact-terminal__terminal-card {
  padding: 0.75rem;
  border: 2px solid #000;
  background: #fffef4;
}

.contact-terminal__status-row {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.55rem;
  color: #4d4a3c;
  font-family: var(--font-secondary);
  font-size: 0.7rem;
  font-weight: 700;
}

.contact-terminal__status-pill {
  padding: 0.08rem 0.4rem;
  background: #0b8d1b;
  color: #fff;
}

.contact-terminal__status-text {
  margin-top: 0.6rem;
  color: #595543;
  font-family: var(--font-secondary);
  font-size: 0.74rem;
  line-height: 1.5;
}

.contact-terminal__terminal-card {
  margin-top: auto;
  background: #061a0b;
  color: #38ec58;
  font-family: var(--font-secondary);
  font-size: 0.64rem;
  line-height: 1.6;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 920px) {
  .contact-terminal {
    grid-template-columns: 140px minmax(0, 1fr);
    height: 680px;
  }

  .contact-terminal__profile {
    grid-column: 1 / -1;
    border-top: 2px solid #000;
    border-left: 0;
  }
}

@media (max-width: 680px) {
  .contact-terminal {
    grid-template-columns: 1fr;
    height: 800px;
  }

  .contact-terminal__rail,
  .contact-terminal__profile {
    border-right: 0;
    border-left: 0;
  }

  .contact-terminal__rail {
    border-bottom: 2px solid #000;
  }

  .contact-terminal__composer-row {
    grid-template-columns: 1fr;
  }

  .contact-terminal__send {
    min-width: 0;
  }

  .contact-terminal__message {
    max-width: 100%;
  }
}
</style>
