<template>
    <footer class="footer">
        <div class="left">
            <button class="start" type="button" @click="emit('toggle-sidebar')">
                <img src="../assets/start.svg" alt="">
                <p>START</p>
            </button>
            <img src="../assets/Vertical Divider.svg" alt="">
            <div class="topics">
                <div v-for="value in topics" :key="value.label" class="topic">
                    <img :src="value.icon" :alt="value.label">
                    <p>{{ value.label }}</p>
                </div>
            </div>
        </div>
        <div class="clock">
            <img src="../assets/clock.svg" alt="">
            <p>{{ currentTime }}</p>
        </div>
    </footer>
</template>

<script lang="ts" setup name="Footer">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const emit = defineEmits<{
    (e: 'toggle-sidebar'): void
}>()

const currentTime = ref('')
let clockTimer: number | null = null

const updateClock = () => {
    currentTime.value = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
}

const topics = [
    { label: 'Files', icon: new URL('../assets/files.svg', import.meta.url).href },
    { label: 'Builds', icon: new URL('../assets/prompt.svg', import.meta.url).href },
    { label: 'Status', icon: new URL('../assets/stats.svg', import.meta.url).href },
]

onMounted(() => {
    updateClock()
    clockTimer = window.setInterval(updateClock, 1000)
})

onBeforeUnmount(() => {
    if (clockTimer !== null) {
        window.clearInterval(clockTimer)
    }
})

</script>

<style>
.footer {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    font-family: var(--font-secondary);
    height: 40px;
    border-top: 2px solid #FFF;
    background: #C0C0C0;
    box-shadow: 1px 1px 0 0 #DFDFDF inset, 1px 1px 0 0 #000;
}

.left {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1rem;
}

.start {
    display: inline-flex;
    height: 32px;
    padding: 0 12px;
    align-items: center;
    gap: 8px;
    border: 2px solid #E5E7EB;
    background: #B300B3;
    box-shadow: 0 2px 4px 2px rgba(0, 0, 0, 0.05) inset;
    color: #FFF;
    cursor: pointer;
    font: inherit;
}

.start:hover {
    filter: brightness(1.05);
}

.topic {
    display: inline-flex;
    height: 32px;
    padding: 0 12px;
    align-items: center;
    gap: 8px;
    border: 2px solid #9CA3AF;
}

.topics {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1rem;
}

.clock {
    display: inline-flex;
    height: 32px;
    padding: 0 12px;
    align-items: center;
    gap: 8px;
    border: 2px solid #9CA3AF;
     background: #E5E7EB;
     box-shadow: 0 2px 4px 2px rgba(0, 0, 0, 0.05) inset;
     color: #000;
     font-variant-numeric: tabular-nums;
}
</style>
