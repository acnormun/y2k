<template>
  <aside class="sidebar" :aria-label="t('sidebar.aria')">
    <div class="sidebar__brand">
      <img class="sidebar__logo" src="../assets/win_chairs.jpg" alt="Win Chairs">
      <p class="sidebar__text">USER_ROOT</p>
    </div>

    <nav class="sidebar__nav" :aria-label="t('sidebar.navAria')">
      <ul class="sidebar__list">
        <li
          v-for="item in items"
          :key="item.label"
          class="sidebar__item"
        >
          <a
            href="#"
            class="sidebar__link"
            :class="{ 'sidebar__link--active': activeSection === item.section }"
            @click.prevent="handleSelect(item.action)"
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
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { desktop } from '../stores/desktop'

defineProps<{
  activeSection: 'desktop' | 'player'
}>()

const { t } = useI18n()
const items = computed(() => [
  { label: t('sidebar.desktop'), icon: new URL('../assets/computer.svg', import.meta.url).href, glyph: '', action: 'desktop', section: 'desktop' as const },
  { label: t('sidebar.player'), icon: '', glyph: '<>', action: 'media-player', section: 'player' as const },
  { label: t('sidebar.saver'), icon: '', glyph: '◎', action: 'screensaver', section: 'saver' as const },
])

const handleSelect = (action: string) => {
  if (action === 'desktop') {
    // "Show desktop": minimize whatever window is on top.
    if (desktop.state.activeWindow) {
      desktop.minimizeWindow(desktop.state.activeWindow)
    }
  } else if (action === 'media-player' || action === 'screensaver') {
    desktop.run(action)
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

/* On phones the Start menu takes over navigation. */
@media (max-width: 720px) {
  .sidebar {
    display: none;
  }
}
</style>
