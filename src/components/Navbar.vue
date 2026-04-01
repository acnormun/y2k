<template>
  <header class="navbar">
    <a class="logo" href="/" :aria-label="t('navbar.homeAria')">
      <span>NORMUN_V0.1</span>
    </a>

    <nav class="navbar__nav" :aria-label="t('navbar.navAria')">
      <ul class="navbar__list">
        <li><a href="/">{{ t('navbar.home') }}</a></li>
        <li>
          <button type="button" class="navbar__link-button" @click="emit('open-modal', 'terminal')">
            {{ t('navbar.terminal') }}
          </button>
        </li>
        <li>
          <button type="button" class="navbar__link-button" @click="emit('open-modal', 'contact')">
            {{ t('navbar.contact') }}
          </button>
        </li>
      </ul>
    </nav>

    <div class="navbar__actions" :aria-label="t('navbar.actionsAria')">
      <div class="navbar__settings">
        <button
          class="icon-button"
          type="button"
          :aria-label="t('navbar.openSettings')"
          @click="isLanguageMenuOpen = !isLanguageMenuOpen"
        >
          <img src="../assets/gear.svg" alt="">
        </button>

        <div v-if="isLanguageMenuOpen" class="navbar__language-menu">
          <p class="navbar__language-title">{{ t('language.label') }}</p>
          <button
            v-for="option in languageOptions"
            :key="option.value"
            class="navbar__language-option"
            :class="{ 'navbar__language-option--active': locale === option.value }"
            type="button"
            @click="setLanguage(option.value)"
          >
            <span>{{ option.shortLabel }}</span>
            <small>{{ option.label }}</small>
          </button>
        </div>
      </div>

      <button class="icon-button" type="button" :aria-label="t('navbar.toggleMode')">
        <img src="../assets/on.svg" alt="">
      </button>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AppLocale } from '../i18n'

const emit = defineEmits<{
  (e: 'open-modal', modal: 'about' | 'contact' | 'terminal'): void
}>()

const { t, locale } = useI18n()
const isLanguageMenuOpen = ref(false)

const languageOptions = computed(() => [
  { value: 'en' as AppLocale, shortLabel: 'EN', label: t('language.en') },
  { value: 'pt-BR' as AppLocale, shortLabel: 'PT', label: t('language.ptBR') },
  { value: 'es' as AppLocale, shortLabel: 'ES', label: t('language.es') },
])

const setLanguage = (nextLocale: AppLocale) => {
  locale.value = nextLocale
  isLanguageMenuOpen.value = false
}

const handleDocumentClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null

  if (!target?.closest('.navbar__settings')) {
    isLanguageMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 0.5rem 1rem;
  font-family: var(--font-tertiary);
  border-right: 2px solid #000;
  border-bottom: 2px solid #000;
  background: #fefee5;
  box-shadow: 2px 2px 0 0 #000;
}

.logo {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: #b300b3;
  color: var(--color-surface);
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.16);
}

.navbar__nav {
  margin-right: auto;
}

.navbar__list,
.navbar__actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  color: var(--color-text);
  font-weight: bold;
  ;
}

.navbar__actions {
  gap: 0.5rem;
}

.navbar__settings {
  position: relative;
}

.navbar__list a,
.navbar__link-button {
  position: relative;
  display: inline-block;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  transition: color 180ms ease;
}

.navbar__list a::after,
.navbar__link-button::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -0.2rem;
  width: 100%;
  height: 2px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 220ms ease;
}

.navbar__list a:hover,
.navbar__link-button:hover {
  color: #027500;
}

.navbar__list a:hover::after,
.navbar__link-button:hover::after {
  transform: scaleX(1);
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  padding: 0;
  border: 2px solid #000;
  background: #f6f1ca;
  box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.8);
  cursor: pointer;
}

.icon-button:hover {
  background: #ece3b7;
}

.icon-button img {
  width: 1.25rem;
  height: 1.25rem;
}

.navbar__language-menu {
  position: absolute;
  top: calc(100% + 0.45rem);
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 180px;
  padding: 0.75rem;
  border: 2px solid #000;
  background: #fffef4;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.16);
  z-index: 20;
}

.navbar__language-title {
  color: #6b6654;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.navbar__language-option {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.65rem;
  align-items: center;
  padding: 0.5rem 0.6rem;
  border: 2px solid #000;
  background: #f6f1ca;
  color: #2e2a22;
  text-align: left;
  cursor: pointer;
}

.navbar__language-option span {
  font-family: var(--font-tertiary);
  font-size: 0.9rem;
  font-weight: 800;
}

.navbar__language-option small {
  color: #6e6858;
  font-size: 0.7rem;
}

.navbar__language-option--active {
  background: #0b8d1b;
  color: #fffef6;
}

.navbar__language-option--active small {
  color: #eefce9;
}

@media (max-width: 720px) {
  .navbar {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .logo {
    width: auto;
    min-width: 0;
    justify-content: flex-start;
    padding: 0.55rem 0.7rem;
    font-size: 0.95rem;
  }

  .navbar__nav {
    grid-column: 1 / -1;
    width: 100%;
    margin-right: 0;
  }

  .navbar__list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.55rem;
    width: 100%;
  }

  .navbar__list li {
    min-width: 0;
  }

  .navbar__list a,
  .navbar__link-button {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 2.75rem;
    width: 100%;
    padding: 0.55rem 0.4rem;
    border: 2px solid #000;
    background: #fffef4;
    box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.7);
    font-size: 0.78rem;
    text-align: center;
  }

  .navbar__list a::after,
  .navbar__link-button::after {
    display: none;
  }

  .navbar__actions {
    justify-content: flex-end;
  }

  .navbar__language-menu {
    position: fixed;
    top: 4.4rem;
    left: 0.75rem;
    right: 0.75rem;
    min-width: 0;
  }
}

@media (max-width: 480px) {
  .navbar {
    grid-template-columns: 1fr;
  }

  .logo,
  .navbar__actions {
    justify-self: stretch;
  }

  .navbar__actions {
    justify-content: space-between;
  }

  .navbar__list {
    grid-template-columns: 1fr;
  }

  .navbar__language-menu {
    top: 7.25rem;
  }
}
</style>
