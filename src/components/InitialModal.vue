<template>
    <Modal
      title="SYSTEM STATUS: DEVELOPER LIVE"
      :icon="modalIcon"
      :isOpen="isModalOpen"
      showStatusBar
      statusLabel="ONLINE"
      cpuUsage="2.4%"
      ramUsage="4.1GB/16GB"
      shellLabel="SECURE_SHELL"
      @close="isModalOpen = false"
    >
      <p>Conteudo inicial do modal.</p>
    </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Modal from './Modal.vue';

const isModalOpen = ref(true);
const modalIcon = new URL('../assets/computer.svg', import.meta.url).href;
</script>

<style>
</style>
