<template>
  <Modal
    title="IDENTITY: ANA CLARA NORONHA"
    :icon="modalIcon"
    :is-open="isOpen"
    @close="emit('close')"
  >
    <section class="about-dump" aria-label="Identity system dump">
      <header class="about-dump__header">
        <p class="about-dump__eyebrow">
          <span class="about-dump__star" aria-hidden="true">*</span>
          IDENTITY: ANA CLARA NORONHA
        </p>

        <p class="about-dump__username">[ USERNAME: ACnormun ]</p>

        <p class="about-dump__intro">
          <span class="about-dump__dropcap">I</span>
          initializing developer profile... Professional Web Developer specializing in
          creating interactive and nostalgic digital experiences. My journey is
          defined by the intersection of high-performance code and the evocative
          aesthetics of the early web.
        </p>
      </header>

      <div class="about-dump__metrics">
        <article
          v-for="metric in metrics"
          :key="metric.label"
          class="about-dump__metric"
        >
          <div class="about-dump__metric-meta">
            <span class="about-dump__metric-label">{{ metric.label }}</span>
            <span class="about-dump__metric-value">{{ metric.value }}</span>
          </div>

          <div class="about-dump__bar-shell">
            <div
              class="about-dump__bar-fill"
              :class="`about-dump__bar-fill--${metric.tone}`"
              :style="{ width: metric.value }"
            />
          </div>
        </article>
      </div>

      <div class="about-dump__stack">
        <article
          v-for="stack in secondaryMetrics"
          :key="stack.label"
          class="about-dump__stack-item"
        >
          <div class="about-dump__stack-meta">
            <span>{{ stack.label }}</span>
            <span>{{ stack.value }}</span>
          </div>
          <div class="about-dump__stack-shell">
            <div
              class="about-dump__stack-fill"
              :style="{ width: stack.value }"
            />
          </div>
        </article>
      </div>

      <footer class="about-dump__log">
        <span class="about-dump__log-icon" aria-hidden="true">+</span>

        <div class="about-dump__log-content">
          <p class="about-dump__log-title">ENVIRONMENTAL_LOGS:</p>
          <div class="about-dump__channels">
            <a class="about-dump__channel about-dump__channel--email" href="mailto:anaclaranoronha.@gmail.com">
              <span class="about-dump__channel-icon" aria-hidden="true">[]</span>
              anaclaranoronha.m@gmail.com
            </a>
            <a class="about-dump__channel about-dump__channel--github" href="https://github.com/acnormun" target="_blank" rel="noreferrer">
              <span class="about-dump__channel-icon" aria-hidden="true">=></span>
              github.com/acnormun
            </a>
          </div>
        </div>

        <span class="about-dump__log-badge" aria-hidden="true">?</span>
      </footer>
    </section>
  </Modal>
</template>

<script setup lang="ts">
import Modal from './Modal.vue'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const modalIcon = new URL('../assets/brain.svg', import.meta.url).href

const metrics = [
  { label: 'PROCESS: TYPESCRIPT', value: '95%', tone: 'green' },
  { label: 'PROCESS: REACT', value: '92%', tone: 'magenta' },
  { label: 'PROCESS: VUE_JS', value: '90%', tone: 'green' },
]

const secondaryMetrics = [
  { label: 'NODE.JS', value: '85%' },
  { label: 'PYTHON', value: '80%' },
  { label: 'FIGMA', value: '88%' },
]
</script>

<style scoped>
.about-dump {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: 100%;
  padding: 0.15rem;
  color: #5f5a4a;
}

.about-dump__header {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.about-dump__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: #d92ed5;
  font-family: var(--font-tertiary);
  font-size: clamp(1.15rem, 2vw, 1.55rem);
  font-weight: 800;
  letter-spacing: 0.02em;
}

.about-dump__username {
  display: inline-flex;
  width: fit-content;
  padding: 0.12rem 0;
  color: #199526;
  font-family: var(--font-secondary);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.about-dump__star {
  color: #7a3cff;
  font-size: 0.95em;
}

.about-dump__intro {
  max-width: 760px;
  color: #6a6558;
  font-family: var(--font-secondary);
  font-size: 0.95rem;
  line-height: 1.9;
}

.about-dump__dropcap {
  float: left;
  margin: 0.1rem 0.7rem 0 0;
  color: #0b8d1b;
  font-family: var(--font-tertiary);
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 0.9;
}

.about-dump__metrics {
  display: flex;
  flex-direction: column;
  gap: 1.3rem;
}

.about-dump__metric {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.about-dump__metric-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.about-dump__metric-label,
.about-dump__metric-value {
  font-family: var(--font-secondary);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.about-dump__metric-label {
  color: #8a8480;
}

.about-dump__metric-value {
  color: #a44de6;
}

.about-dump__bar-shell {
  position: relative;
  overflow: hidden;
  height: 18px;
  border: 2px solid #7d7a6c;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(227, 223, 201, 0.9) 100%);
  box-shadow:
    inset 1px 1px 0 rgba(255, 255, 255, 0.8),
    inset -1px -1px 0 rgba(93, 89, 75, 0.18);
}

.about-dump__bar-fill {
  height: 100%;
  border-right: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.12);
}

.about-dump__bar-fill--green {
  background: linear-gradient(90deg, #1b9b11 0%, #0a8a17 82%, #47ff40 100%);
}

.about-dump__bar-fill--magenta {
  background: linear-gradient(90deg, #c600c4 0%, #d92ed5 82%, #ff73ef 100%);
}

.about-dump__bar-fill--cyan {
  background: linear-gradient(90deg, #1593c4 0%, #1eabd3 82%, #6fe9ff 100%);
}

.about-dump__stack {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
}

.about-dump__stack-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.about-dump__stack-meta {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  color: #68624f;
  font-family: var(--font-secondary);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.about-dump__stack-shell {
  overflow: hidden;
  height: 7px;
  border: 1px solid #7d7a6c;
  background: #f4f0d3;
  box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.75);
}

.about-dump__stack-fill {
  height: 100%;
  background: linear-gradient(90deg, #6f6a56 0%, #b9b087 100%);
}

.about-dump__log {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.85rem;
  align-items: start;
  padding: 0.95rem 1rem;
  border: 2px dashed #d8d0a6;
  background:
    linear-gradient(180deg, rgba(255, 252, 224, 0.65) 0%, rgba(245, 238, 198, 0.88) 100%);
}

.about-dump__log-icon,
.about-dump__log-badge {
  color: #17a31b;
  font-size: 1.1rem;
  line-height: 1;
}

.about-dump__log-badge {
  color: #d92ed5;
  align-self: end;
}

.about-dump__log-content {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.about-dump__log-title {
  color: #b4aa74;
  font-family: var(--font-secondary);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding-bottom: 0.45rem;
  border-bottom: 1px solid rgba(180, 170, 116, 0.45);
}

.about-dump__channels {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding-top: 0.15rem;
}

.about-dump__channel {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  width: fit-content;
  font-family: var(--font-secondary);
  font-size: 0.78rem;
  font-weight: 700;
}

.about-dump__channel--email {
  color: #d92ed5;
}

.about-dump__channel--github {
  color: #1a9627;
}

.about-dump__channel-icon {
  display: inline-flex;
  min-width: 1rem;
  justify-content: center;
}

@media (max-width: 720px) {
  .about-dump {
    gap: 1.2rem;
  }

  .about-dump__intro {
    font-size: 0.84rem;
    line-height: 1.75;
  }

  .about-dump__metric-meta {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.2rem;
  }

  .about-dump__stack {
    grid-template-columns: 1fr;
  }

  .about-dump__log {
    grid-template-columns: 1fr;
  }
}
</style>
