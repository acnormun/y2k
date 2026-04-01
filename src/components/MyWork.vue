<template>
  <Modal
    :title="t('myWork.title')"
    :icon="windowIcon"
    :isOpen="isOpen"
    @close="emit('close')"
  >
    <section class="file-manager" :aria-label="t('myWork.aria')">
      <header class="file-manager__toolbar">
        <label class="file-manager__address">
          <span class="file-manager__label">{{ t('myWork.address') }}</span>
          <div class="file-manager__input-wrap">
            <span class="file-manager__path">{{ t('myWork.path') }}</span>
          </div>
        </label>
        <button class="file-manager__go" type="button">{{ t('myWork.go') }}</button>
      </header>

      <div class="file-manager__content">
        <button
          v-for="project in projects"
          :key="project.name"
          class="file-manager__item"
          type="button"
          :aria-label="`${project.name} - ${project.description}`"
          @click="redirectTo(project.link)"
        >
          <span class="file-manager__icon-frame" :class="`file-manager__icon-frame--${project.variant}`">
            <span class="file-manager__icon-card">
              <span class="file-manager__icon-badge">{{ project.badge }}</span>
            </span>
          </span>
          <span class="file-manager__name">{{ project.name }}</span>
          <span class="file-manager__tooltip" role="tooltip">
            <strong>{{ t('myWork.tooltipLabel') }}</strong>
            <span>{{ project.description }}</span>
          </span>
        </button>
      </div>
    </section>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from './Modal.vue'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()
const windowIcon = new URL('../assets/folder.svg', import.meta.url).href

const projects = computed(() => [
  {
    name: 'Health_memo.vue',
    variant: 'vue',
    badge: 'VUE',
    link: 'https://memorando-saude.up.railway.app/',
    description: t('myWork.projects.healthMemo'),
  },
  {
    name: 'Missing_pearsons_registry.exe',
    variant: 'exe',
    badge: 'EXE',
    link: 'https://pjcmt-desaparecidos.up.railway.app/',
    description: t('myWork.projects.missingPearsons'),
  },
  {
    name: 'Star_Trek.html',
    variant: 'html',
    badge: 'HTML',
    link: 'https://star-trek.up.railway.app/',
    description: t('myWork.projects.starTrek'),
  }
])

function redirectTo(link: string) {
  window.open(link, '_blank')
}
</script>

<style scoped>
.file-manager {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  border: 2px solid #b7b08f;
  background: #fbfaf4;
  box-shadow: inset 1px 1px 0 #fff, inset -1px -1px 0 rgba(0, 0, 0, 0.14);
}

.file-manager__toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.6rem;
  align-items: center;
  padding: 0.45rem;
  border-bottom: 1px solid #c9c29e;
  background: #ece8d3;
}

.file-manager__address {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.5rem;
  align-items: center;
  min-width: 0;
}

.file-manager__label {
  font-family: var(--font-secondary);
  font-size: 0.72rem;
  color: #55503e;
}

.file-manager__input-wrap {
  min-width: 0;
  padding: 0.35rem 0.55rem;
  border: 1px solid #8f8b72;
  background: #fffef8;
  box-shadow: inset 1px 1px 0 rgba(0, 0, 0, 0.08);
}

.file-manager__path {
  display: block;
  overflow: hidden;
  color: #49442f;
  font-family: var(--font-secondary);
  font-size: 0.78rem;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.file-manager__go {
  min-width: 52px;
  padding: 0.35rem 0.7rem;
  border: 1px solid #7a7660;
  background: linear-gradient(180deg, #fbfaf3 0%, #ded8bb 100%);
  color: #4c4735;
  font-family: var(--font-secondary);
  font-size: 0.72rem;
  font-weight: 700;
  box-shadow: inset 1px 1px 0 #fff;
}

.file-manager__go:hover {
  background: linear-gradient(180deg, #fffef8 0%, #d8d0ab 100%);
}

.file-manager__content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 110px));
  gap: 2rem 1.2rem;
  align-content: start;
  min-height: 380px;
  padding: 1.25rem 1.1rem;
  background: #fff;
}

.file-manager__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
  padding: 0.15rem;
  border: 0;
  background: transparent;
  color: #4f4a37;
  cursor: pointer;
}

.file-manager__item:hover,
.file-manager__item:focus-visible {
  outline: 0;
}

.file-manager__item:hover .file-manager__icon-frame,
.file-manager__item:focus-visible .file-manager__icon-frame {
  transform: translateY(-2px);
}

.file-manager__item:hover .file-manager__tooltip,
.file-manager__item:focus-visible .file-manager__tooltip {
  opacity: 1;
  transform: translate(-50%, 0);
}

.file-manager__icon-frame {
  display: grid;
  place-items: center;
  width: 82px;
  height: 82px;
  padding: 0.2rem;
  border: 1px solid transparent;
  transition: transform 140ms ease;
}

.file-manager__icon-card {
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  border-top: 2px solid #d8d1aa;
  border-left: 2px solid #d8d1aa;
  border-right: 3px solid #8f8b73;
  border-bottom: 3px solid #8f8b73;
  background: linear-gradient(180deg, #fffde7 0%, #f5f0c8 100%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.9);
}

.file-manager__icon-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
  padding: 0.18rem 0.45rem;
  border-radius: 999px;
  font-family: var(--font-tertiary);
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.file-manager__icon-frame--html .file-manager__icon-badge {
  color: #d22cd2;
}

.file-manager__icon-frame--exe .file-manager__icon-badge {
  color: #7a3cff;
}

.file-manager__icon-frame--zip .file-manager__icon-badge {
  color: #2e9f3b;
}

.file-manager__icon-frame--txt .file-manager__icon-badge {
  color: #747060;
}

.file-manager__icon-frame--bin .file-manager__icon-badge {
  color: #0c8d3b;
}

.file-manager__name {
  max-width: 100%;
  text-align: center;
  color: #5a5544;
  font-family: var(--font-secondary);
  font-size: 0.74rem;
  line-height: 1.25;
  word-break: break-word;
}

.file-manager__tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 0.9rem);
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 220px;
  padding: 0.75rem 0.8rem;
  border: 2px solid #000;
  background:
    linear-gradient(180deg, #fff9db 0%, #efe5b6 100%);
  box-shadow: 5px 5px 0 rgba(0, 0, 0, 0.16);
  color: #49432f;
  font-family: var(--font-secondary);
  font-size: 0.68rem;
  line-height: 1.45;
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 8px);
  transition: opacity 150ms ease, transform 150ms ease;
}

.file-manager__tooltip::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  width: 14px;
  height: 14px;
  border-right: 2px solid #000;
  border-bottom: 2px solid #000;
  background: #efe5b6;
  transform: translateX(-50%) rotate(45deg);
}

.file-manager__tooltip strong {
  color: #c600c4;
  font-family: var(--font-tertiary);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

@media (max-width: 720px) {
  .file-manager__toolbar {
    grid-template-columns: 1fr;
  }

  .file-manager__address {
    grid-template-columns: 1fr;
  }

  .file-manager__go {
    justify-self: end;
  }

  .file-manager__content {
    grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
    gap: 1.4rem 0.8rem;
    min-height: 320px;
  }

  .file-manager__tooltip {
    width: min(220px, calc(100vw - 3rem));
  }
}
</style>
