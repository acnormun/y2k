<template>
  <div class="app-shell">
    <Navbar />
    <div class="main">
      <Sidebar v-if="isSidebarOpen" />
      <RouterView v-slot="{ Component }">
        <component :is="Component" @open-modal="openModal" />
      </RouterView>
    </div>
    <Footer @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />
    <InitialModal
      :is-open="activeModal === 'welcome'"
      @open-my-work="openModal('my-work')"
      @close="closeModal"
    />
    <MyWork
      :is-open="activeModal === 'my-work'"
      @close="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Footer from './components/Footer.vue';
import MyWork from './components/MyWork.vue';
import Navbar from './components/Navbar.vue';
import Sidebar from './components/Sidebar.vue';
import InitialModal from './components/InitialModal.vue';

const isSidebarOpen = ref(true)
const activeModal = ref<'welcome' | 'my-work' | null>('welcome')

const openModal = (modal: 'welcome' | 'my-work') => {
  activeModal.value = modal
}

const closeModal = () => {
  activeModal.value = null
}
</script>

<style>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main {
  display: flex;
  flex: 1;
  flex-direction: row;
  min-height: 0;
}
</style>
