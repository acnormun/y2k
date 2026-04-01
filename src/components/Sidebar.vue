<template>
  <aside class="sidebar" :aria-label="t('sidebar.aria')">
    <div class="sidebar__brand">
      <img class="sidebar__logo" src="../assets/win_chairs.jpg" alt="Win Chairs">
      <p class="sidebar__text">USER_ROOT</p>
    </div>

    <nav class="sidebar__nav" :aria-label="t('sidebar.navAria')">
      <ul class="sidebar__list">
        <li
          v-for="(item, index) in items"
          :key="item.label"
          class="sidebar__item"
        >
          <a
            href="#"
            class="sidebar__link"
            :class="{ 'sidebar__link--active': selectedItem === index }"
            @click.prevent="handleSelect(index, item.action)"
          >
            <img
              v-if="item.icon"
              :src="item.icon"
              :alt="item.label"
              class="sidebar__icon"
            >
            <span v-else class="sidebar__glyph" aria-hidden="true">{{ item.glyph }}</span>
            <p class="sidebar__text">{{ item.label }}</p>
          </a>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script setup lang="ts" name="Sidebar">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const selectedItem = ref(0)
const { t } = useI18n()
const emit = defineEmits<{
  (e: 'open-modal', modal: 'media-player'): void
}>()

const items = computed(() => [
  { label: t('sidebar.desktop'), icon: new URL('../assets/computer.svg', import.meta.url).href, glyph: '', action: 'desktop' },
  { label: t('sidebar.player'), icon: '', glyph: '<>', action: 'media-player' },
])

const handleSelect = (index: number, action: string) => {
  selectedItem.value = index

  if (action === 'media-player') {
    emit('open-modal', 'media-player')
  }
}
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  align-self: stretch;
  width: 92px;
  min-height: 100%;
  padding: 1rem 0;
  font-family: var(--font-secondary);
  border-right: 2px solid #000;
  background: #fefee5;
  box-shadow: 2px 2px 0 0 #000;
}

.sidebar__brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0 0.75rem;
  text-align: center;

  p{
    margin: 0;
    font-size: 0.75rem;
    font-weight: bold;
  }
}

.sidebar__logo {
  display: block;
  width: 100%;
  height: auto;
}

.sidebar__nav {
  width: 100%;
}

.sidebar__list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.sidebar__item {
  width: 100%;
}

.sidebar__link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 84px;
  padding: 0.75rem 0.5rem;
  color: inherit;
  text-align: center;
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.sidebar__link p {
  margin: 0;
}

.sidebar__icon {
  width: 28px;
  height: 28px;
  filter: brightness(0) saturate(100%);
}

.sidebar__glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-family: var(--font-secondary);
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1;
}

.sidebar__link:hover {
  background: #027500;
  color: #fff;
}

.sidebar__link:hover .sidebar__icon {
  filter: brightness(0) invert(1);
}

.sidebar__link--active {
  background: #027500;
  color: #fff;
}

.sidebar__link--active .sidebar__icon {
  filter: brightness(0) invert(1);
}

@media (max-width: 720px) {
  .sidebar {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    right: 0.75rem;
    z-index: 12;
    width: auto;
    min-height: 0;
    flex-direction: row;
    align-items: stretch;
    justify-content: space-between;
    padding: 0.75rem;
    border: 2px solid #000;
    box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.14);
  }

  .sidebar__brand {
    width: auto;
    min-width: 72px;
    padding: 0;
  }

  .sidebar__logo {
    width: 48px;
  }

  .sidebar__nav {
    width: auto;
    flex: 1;
  }

  .sidebar__list {
    flex-direction: row;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .sidebar__item {
    width: auto;
  }

  .sidebar__link {
    min-height: 0;
    min-width: 88px;
    padding: 0.55rem;
  }
}
</style>
