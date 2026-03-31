<template>
  <div class="app-shell">
    <Navbar />
    <div class="main">
      <Sidebar v-if="isSidebarOpen" />
      <RouterView />
    </div>
    <Footer @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />
    <InitialModal/>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Footer from './components/Footer.vue';
import Navbar from './components/Navbar.vue';
import Sidebar from './components/Sidebar.vue';
import InitialModal from './components/InitialModal.vue';

const isSidebarOpen = ref(true)
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
