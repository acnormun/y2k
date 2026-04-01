<template>
    <footer class="footer">
        <div class="left">
            <button class="start" type="button" @click="emit('toggle-sidebar')">
                <img src="../assets/start.svg" alt="">
                <p>{{ t('footer.start') }}</p>
            </button>
            <img src="../assets/Vertical Divider.svg" alt="">
            <div class="topics">
                <button
                    v-for="value in topics"
                    :key="value.label"
                    class="topic"
                    type="button"
                    @click="handleTopicClick(value.action)"
                >
                    <img :src="value.icon" :alt="value.label">
                    <p>{{ value.label }}</p>
                </button>
            </div>
        </div>
        <div class="clock">
            <img src="../assets/clock.svg" alt="">
            <p>{{ currentTime }}</p>
        </div>
    </footer>
</template>

<script lang="ts" setup name="Footer">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
    (e: 'toggle-sidebar'): void
    (e: 'open-modal', modal: 'terminal'): void
}>()

const { t, locale } = useI18n()
const currentTime = ref('')
let clockTimer: number | null = null

const updateClock = () => {
    currentTime.value = new Date().toLocaleTimeString(locale.value, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
}

const topics = computed(() => [
    { label: t('footer.files'), icon: new URL('../assets/files.svg', import.meta.url).href, action: 'files' },
    { label: t('footer.cmd'), icon: new URL('../assets/prompt.svg', import.meta.url).href, action: 'terminal' },
    { label: t('footer.status'), icon: new URL('../assets/stats.svg', import.meta.url).href, action: 'status' },
])

const handleTopicClick = (action: string) => {
    if (action === 'terminal') {
        emit('open-modal', 'terminal')
    }
}

onMounted(() => {
    updateClock()
    clockTimer = window.setInterval(updateClock, 1000)
})

watch(locale, updateClock)

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
    min-height: 40px;
    border-top: 2px solid #FFF;
    background: #C0C0C0;
    box-shadow: 1px 1px 0 0 #DFDFDF inset, 1px 1px 0 0 #000;
    gap: 0.75rem;
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
    background: #C0C0C0;
    cursor: pointer;
    font: inherit;
}

.topic:hover {
    filter: brightness(1.04);
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

@media (max-width: 720px) {
    .footer {
        flex-wrap: wrap;
        align-items: stretch;
        padding: 0.75rem;
    }

    .left {
        width: 100%;
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    .left > img {
        display: none;
    }

    .start,
    .clock {
        width: 100%;
        justify-content: center;
    }

    .topics {
        width: 100%;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .topic {
        flex: 1 1 calc(50% - 0.25rem);
        justify-content: center;
        min-width: 0;
    }
}
</style>
