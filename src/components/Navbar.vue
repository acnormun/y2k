<template>
  <header class="navbar">
    <a class="logo" href="/" aria-label="Go to homepage">
      <span>NORMUN_V0.1</span>
    </a>

    <nav class="navbar__nav" aria-label="Main navigation">
      <ul class="navbar__list">
        <li><a href="/">PORTFOLIO</a></li>
        <li>
          <button type="button" class="navbar__link-button" @click="emit('open-modal', 'terminal')">
            TERMINAL
          </button>
        </li>
        <li>
          <button type="button" class="navbar__link-button" @click="emit('open-modal', 'contact')">
            CONTACT
          </button>
        </li>
      </ul>
    </nav>

    <div class="navbar__actions" aria-label="Actions">
      <button class="icon-button" type="button" aria-label="Open settings">
        <img src="../assets/gear.svg" alt="">
      </button>
      <button class="icon-button" type="button" aria-label="Toggle mode">
        <img src="../assets/on.svg" alt="">
      </button>
    </div>
  </header>
</template>

<script lang="ts" setup>
const emit = defineEmits<{
  (e: 'open-modal', modal: 'about' | 'contact' | 'terminal'): void
}>()
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: .5REM 1rem;
  font-family: var(--font-tertiary);
  border-right: 2px solid #000;
  border-bottom: 2px solid #000;
  background: #FEFEE5;
  box-shadow: 2px 2px 0 0 #000;
}

.logo {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: #b300b3;
  color: var(--color-surface);
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
  margin-left: -0.35rem;
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
  display: flex;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.icon-button:hover {
  background: transparent;
}

.icon-button img {
  width: 1.25rem;
  height: 1.25rem;
}
</style>
