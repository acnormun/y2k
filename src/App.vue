
<template>
  <div class="app-shell">
    <Navbar />
    <div class="main">
      <Sidebar />
      <RouterView />
    </div>
  </div>
</template>

  <script setup lang="ts">
  import Navbar from './components/Navbar.vue';
  import Sidebar from './components/Sidebar.vue';
  
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
