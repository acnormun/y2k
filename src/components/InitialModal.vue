<template>
  <Modal title="SYSTEM STATUS: DEVELOPER LIVE" :icon="modalIcon" :isOpen="isModalOpen" showStatusBar
    statusLabel="ONLINE" cpuUsage="2.4%" ramUsage="4.1GB/16GB" shellLabel="SECURE_SHELL" @close="isModalOpen = false">
    <section class="initial-modal">
      <div class="initial-modal__media">
        <img :src="heroImage" alt="Developer portrait" class="initial-modal__portrait">
        <span class="initial-modal__tag">LIVE_SRV</span>
      </div>

      <div class="initial-modal__content">
        <p class="initial-modal__badge">ESTABLISHED V2.000</p>

        <h1 class="initial-modal__title">
          <span class="initial-modal__title-accent">Hi, I'm</span>
          <span class="initial-modal__title-main">Ana_Noronha,</span>
        </h1>

        <p class="initial-modal__description">
          Fullstack Web Developer crafting digital solutions with AI.
          Into automation, problem-solving, and turning ideas into real products.
        </p>

        <div class="initial-modal__actions">
          <UiButton>
            INITIALIZE PROJECTS
          </UiButton>
          <UiButton variant="secondary">
            READ MANIFEST.TXT
          </UiButton>
        </div>
      </div>
    </section>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Modal from './Modal.vue';
import UiButton from './UiButton.vue';

const isModalOpen = ref(true);
const modalIcon = new URL('../assets/computer.svg', import.meta.url).href;
const heroImage = new URL('../assets/hero.png', import.meta.url).href;
</script>

<style scoped>
.initial-modal {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 2.5rem;
  align-items: center;
  min-height: 100%;
}

.initial-modal__media {
  position: relative;
  width: 100%;
  max-width: 440px;
  border: 2px solid #000;
  background: #111;
  box-shadow: 6px 6px 0 #000;
}

.initial-modal__portrait {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

.initial-modal__tag {
  position: absolute;
  right: 0.4rem;
  bottom: 0.4rem;
  padding: 0.15rem 0.45rem;
  background: #0b8d1b;
  color: #fffef6;
  font-family: var(--font-secondary);
  font-size: 0.78rem;
  line-height: 1;
}

.initial-modal__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.1rem;
}

.initial-modal__badge {
  padding: 0.18rem 0.6rem;
  background: #f244f2;
  color: #2b1642;
  font-family: var(--font-secondary);
  font-size: 0.82rem;
}

.initial-modal__title {
  display: flex;
  flex-wrap: wrap;
  gap: 0 0.7rem;
  font-family: var(--font-tertiary);
  font-size: clamp(2.8rem, 5vw, 4.8rem);
  line-height: 0.95;
  font-weight: 800;
}

.initial-modal__title-accent {
  color: #c900c9;
}

.initial-modal__title-main {
  color: #027500;
}

.initial-modal__description {
  max-width: 580px;
  color: #444234;
  font-family: var(--font-primary);
  font-size: clamp(1.1rem, 2vw, 1.55rem);
  line-height: 1.35;
}

.initial-modal__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 0.25rem;
}

@media (max-width: 900px) {
  .initial-modal {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .initial-modal__media {
    max-width: 220px;
  }
}
</style>
