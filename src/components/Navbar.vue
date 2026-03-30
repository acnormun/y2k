<template>
  <header class="navbar">
    <a class="logo" href="/" aria-label="Go to homepage">
      <span>NORMUN_V0.1</span>
    </a>

    <nav class="navbar__nav" aria-label="Main navigation">
      <ul class="navbar__list">
        <li><a href="/">Portfolio</a></li>
        <li><a href="/about">Terminal</a></li>
        <li><a href="/contact">Contact</a></li>
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
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  font-family: var(--font-tertiary);
}

.logo {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
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
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
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
