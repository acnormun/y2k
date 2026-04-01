<template>
  <Modal
    title="C:\\Portfolio\\My_Projects\\Active_Developments"
    :icon="windowIcon"
    :isOpen="isOpen"
    @close="emit('close')"
  >
    <section class="file-manager" aria-label="My Work file manager">
      <header class="file-manager__toolbar">
        <label class="file-manager__address">
          <span class="file-manager__label">Address</span>
          <div class="file-manager__input-wrap">
            <span class="file-manager__path">C:\Portfolio\My_Projects\Active_Developments</span>
          </div>
        </label>
        <button class="file-manager__go" type="button">GO</button>
      </header>

      <div class="file-manager__content">
        <button
          v-for="project in projects"
          :key="project.name"
          class="file-manager__item"
          type="button"
        >
          <span class="file-manager__icon-frame" :class="`file-manager__icon-frame--${project.variant}`">
            <span class="file-manager__icon-card" v-on:click="redirectTo(project.link)">
              <span class="file-manager__icon-badge">{{ project.badge }}</span>
            </span>
          </span>
          <span class="file-manager__name">{{ project.name }}</span>
        </button>
      </div>
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

const windowIcon = new URL('../assets/folder.svg', import.meta.url).href

const projects = [
  {
    name: 'Health_memo.vue',
    variant: 'vue',
    badge: 'VUE',
    link: 'https://memorando-saude.up.railway.app/'
  },
  {
    name: 'Missing_pearsons_registry.exe',
    variant: 'exe',
    badge: 'EXE',
    link: 'https://pjcmt-desaparecidos.up.railway.app/'
  },
  {
    name: 'Star_Trek.html',
    variant: 'html',
    badge: 'HTML',
    link: 'https://star-trek.up.railway.app/'
  }
]

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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
  padding: 0.15rem;
  border: 0;
  background: transparent;
  color: #4f4a37;
}

.file-manager__item:hover,
.file-manager__item:focus-visible {
  outline: 0;
}

.file-manager__item:hover .file-manager__icon-frame,
.file-manager__item:focus-visible .file-manager__icon-frame {
  transform: translateY(-2px);
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
}
</style>
