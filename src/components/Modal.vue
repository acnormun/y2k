<template>
    <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
        <article class="modal">
            <header class="modal__header">
                <div class="modal__title-wrap">
                    <img :src="icon" alt="" class="modal__icon">
                    <h2 class="modal__title">{{ title }}</h2>
                </div>
                <div class="modal__actions" aria-label="Window actions">
                    <button class="modal__action modal__action--minimize" type="button" aria-label="Minimizar">
                        <span />
                    </button>
                    <button class="modal__action modal__action--maximize" type="button" aria-label="Maximizar">
                        <span />
                    </button>
                    <button class="modal__action modal__action--close" type="button" aria-label="Fechar" @click="emit('close')">
                        <span />
                    </button>
                </div>
            </header>

            <div class="modal__body">
                <slot>
                    <p class="modal__empty">Sem conteudo ainda.</p>
                </slot>
            </div>

            <footer v-if="showStatusBar" class="modal__status">
                <div class="modal__status-left">
                    <span class="modal__status-online" aria-hidden="true" />
                    <span>{{ statusLabel }}</span>
                    <span class="modal__status-muted">CPU: {{ cpuUsage }}</span>
                    <span class="modal__status-muted">RAM: {{ ramUsage }}</span>
                </div>

                <div class="modal__status-right">
                    <span class="modal__status-lock" aria-hidden="true">⌂</span>
                    <span>{{ shellLabel }}</span>
                </div>
            </footer>
        </article>
    </div>
</template>

<script lang="ts" setup name="Modal">
withDefaults(defineProps<{
    title: string
    icon: string
    isOpen: boolean
    showStatusBar?: boolean
    statusLabel?: string
    cpuUsage?: string
    ramUsage?: string
    shellLabel?: string
}>(), {
    showStatusBar: false,
    statusLabel: 'ONLINE',
    cpuUsage: '2.4%',
    ramUsage: '4.1GB/16GB',
    shellLabel: 'SECURE_SHELL',
})

const emit = defineEmits<{
    (e: 'close'): void
}>()
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: grid;
    place-items: center;
    background: rgba(17, 17, 17, 0.18);
    padding: 1.5rem;
}

.modal {
    width: min(960px, 100%);
    min-height: 360px;
    border: 2px solid #000;
    background: #fefee5;
    box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.18);
    overflow: hidden;
}

.modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-bottom: 2px solid #000;
    background: linear-gradient(90deg, #b300b3 0%, #ff66d9 100%);
    color: #fff;
}

.modal__title-wrap {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-width: 0;
}

.modal__icon {
    width: 20px;
    height: 20px;
    filter: brightness(0) invert(1);
}

.modal__title {
    font-family: var(--font-tertiary);
    font-size: 1rem;
    font-weight: 700;
    line-height: 1;
}

.modal__actions {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}

.modal__action {
    display: inline-grid;
    place-items: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 2px solid #000;
    background: #fefee5;
    cursor: pointer;
    box-shadow: inset 1px 1px 0 #fff, inset -1px -1px 0 rgba(0, 0, 0, 0.22);
}

.modal__action span {
    display: block;
    position: relative;
}

.modal__action--minimize span {
    width: 10px;
    height: 2px;
    background: #111;
}

.modal__action--maximize span {
    width: 12px;
    height: 12px;
    border: 2px solid #111;
}

.modal__action--close {
    background: #d72d62;
}

.modal__action--close span {
    width: 12px;
    height: 12px;
}

.modal__action--close span::before,
.modal__action--close span::after {
    content: '';
    position: absolute;
    left: 5px;
    top: 0;
    width: 2px;
    height: 12px;
    background: #fff;
}

.modal__action--close span::before {
    transform: rotate(45deg);
}

.modal__action--close span::after {
    transform: rotate(-45deg);
}

.modal__body {
    min-height: 308px;
    padding: 1rem;
}

.modal__empty {
    font-family: var(--font-secondary);
    color: var(--color-text-muted);
}

.modal__status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.7rem 1rem;
    border-top: 2px solid #000;
    background: linear-gradient(90deg, #f6f4d6 0%, #ece8b8 100%);
    font-family: var(--font-secondary);
    font-size: 0.78rem;
    color: #3a3a2d;
}

.modal__status-left,
.modal__status-right {
    display: inline-flex;
    align-items: center;
    gap: 1rem;
}

.modal__status-online {
    width: 12px;
    height: 12px;
    border-radius: 999px;
    background: #0b8d1b;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.18);
}

.modal__status-muted {
    color: #9a987f;
}

.modal__status-lock {
    font-size: 0.9rem;
    line-height: 1;
}
</style>
