<template>
  <button
    class="ui-button"
    :class="`ui-button--${variant}`"
    type="button"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary'
}>(), {
  variant: 'primary',
})
</script>

<style scoped>
.ui-button {
  min-width: 240px;
  padding: 0.95rem 1.4rem;
  border: 2px solid #000;
  box-shadow: 6px 6px 0 #000;
  font-family: var(--font-tertiary);
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
}

.ui-button--primary {
  background: linear-gradient(180deg, #d900d9 0%, #a300a3 100%);
  color: #fffef6;
}

.ui-button--secondary {
  background: #f4f4f4;
  color: #111;
}

@media (max-width: 900px) {
  .ui-button {
    min-width: 0;
    width: 100%;
  }
}
</style>
