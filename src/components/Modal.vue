<template>
  <Transition name="window3d" appear>
    <div
      v-if="isOpen"
      class="modal-overlay"
      :class="{
        'modal-overlay--maximized': isMaximized,
        'modal-overlay--minimizing': isMinimizing,
      }"
      @click.self="emit('close')"
    >
        <div class="modal-frame" :class="{ 'modal-frame--wide': wide }" :style="frameStyle">
        <article class="modal" :class="{ 'modal--dragging': isDragging }" role="dialog" :aria-label="title">
            <header
              class="modal__header"
              @pointerdown="startDrag"
              @dblclick="handleHeaderDoubleClick"
            >
                <div class="modal__title-wrap">
                    <img :src="icon" alt="" class="modal__icon">
                    <h2 class="modal__title">{{ title }}</h2>
                </div>
                <div class="modal__actions" :aria-label="t('modal.windowActions')">
                    <button class="modal__action modal__action--minimize" type="button" :aria-label="t('modal.minimize')" @click="minimize">
                        <span />
                    </button>
                    <button
                      class="modal__action"
                      :class="isMaximized ? 'modal__action--restore' : 'modal__action--maximize'"
                      type="button"
                      :aria-label="isMaximized ? t('modal.restore') : t('modal.maximize')"
                      @click="toggleMaximize"
                    >
                        <span />
                    </button>
                    <button class="modal__action modal__action--close" type="button" :aria-label="t('modal.close')" @click="emit('close')">
                        <span />
                    </button>
                </div>
            </header>

            <div class="modal__body">
                <slot>
                    <p class="modal__empty">{{ t('modal.empty') }}</p>
                </slot>
            </div>

            <footer v-if="showStatusBar" class="modal__status">
                <div class="modal__status-left">
                    <span class="modal__status-online" aria-hidden="true" />
                    <span>{{ statusLabel }}</span>
                    <span class="modal__status-muted">{{ t('modal.cpu') }}: {{ cpuUsage }}</span>
                    <span class="modal__status-muted">{{ t('modal.ram') }}: {{ ramUsage }}</span>
                </div>

                <div class="modal__status-right">
                    <span class="modal__status-lock" aria-hidden="true">⌂</span>
                    <span>{{ shellLabel }}</span>
                </div>
            </footer>
        </article>
        </div>
    </div>
  </Transition>
</template>

<script lang="ts" setup name="Modal">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = withDefaults(defineProps<{
    title: string
    icon: string
    isOpen: boolean
    showStatusBar?: boolean
    statusLabel?: string
    cpuUsage?: string
    ramUsage?: string
    shellLabel?: string
    wide?: boolean
}>(), {
    showStatusBar: false,
    statusLabel: 'ONLINE',
    cpuUsage: '2.4%',
    ramUsage: '4.1GB/16GB',
    shellLabel: 'SECURE_SHELL',
    wide: false,
})

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'minimize'): void
}>()

const MOBILE_BREAKPOINT = 720

// Window position survives minimize / reopen, like a real desktop.
const offset = ref({ x: 0, y: 0 })
const isMaximized = ref(false)
const isMinimizing = ref(false)
const isDragging = ref(false)

let dragStart = { pointerX: 0, pointerY: 0, x: 0, y: 0, left: 0, top: 0, width: 0 }

const frameStyle = computed(() =>
    isMaximized.value ? undefined : { transform: `translate3d(${offset.value.x}px, ${offset.value.y}px, 0)` },
)

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const handleDragMove = (event: PointerEvent) => {
    const dx = event.clientX - dragStart.pointerX
    const dy = event.clientY - dragStart.pointerY
    // Keep enough of the title bar on screen to grab it again.
    const minDx = -dragStart.left - dragStart.width + 140
    const maxDx = window.innerWidth - dragStart.left - 140
    const minDy = -dragStart.top
    const maxDy = window.innerHeight - dragStart.top - 72

    offset.value = {
        x: dragStart.x + clamp(dx, minDx, maxDx),
        y: dragStart.y + clamp(dy, minDy, maxDy),
    }
}

const stopDrag = () => {
    isDragging.value = false
    window.removeEventListener('pointermove', handleDragMove)
    window.removeEventListener('pointerup', stopDrag)
}

const startDrag = (event: PointerEvent) => {
    const target = event.target as HTMLElement

    if (event.button !== 0 || isMaximized.value || window.innerWidth <= MOBILE_BREAKPOINT || target.closest('button')) {
        return
    }

    const header = event.currentTarget as HTMLElement
    const rect = header.getBoundingClientRect()
    dragStart = {
        pointerX: event.clientX,
        pointerY: event.clientY,
        x: offset.value.x,
        y: offset.value.y,
        left: rect.left,
        top: rect.top,
        width: rect.width,
    }
    isDragging.value = true
    event.preventDefault()
    window.addEventListener('pointermove', handleDragMove)
    window.addEventListener('pointerup', stopDrag)
}

const toggleMaximize = () => {
    isMaximized.value = !isMaximized.value
}

const handleHeaderDoubleClick = (event: MouseEvent) => {
    if (!(event.target as HTMLElement).closest('button')) {
        toggleMaximize()
    }
}

const minimize = async () => {
    // Render the flag before closing: a leaving element keeps the classes of its last render,
    // so this is what makes the leave transition play the "genie" animation toward the taskbar.
    isMinimizing.value = true
    await nextTick()
    emit('minimize')
}

watch(
    () => props.isOpen,
    (isOpen) => {
        if (isOpen) {
            isMinimizing.value = false
        } else {
            stopDrag()
        }
    },
)

onBeforeUnmount(stopDrag)
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: grid;
    place-items: center;
    background: rgba(17, 17, 17, 0.18);
    padding: 1.5rem 1.5rem calc(1.5rem + var(--taskbar-height, 0px));
    overflow: auto;
}

.modal-frame {
    display: flex;
    justify-content: center;
    width: min(960px, 100%);
}

.modal-frame--wide {
    width: min(1180px, 100%);
}

.modal-overlay--maximized {
    padding: 0 0 var(--taskbar-height, 0px);
}

.modal-overlay--maximized .modal-frame {
    width: 100%;
    height: 100%;
}

.modal-overlay--maximized .modal {
    width: 100%;
    height: 100%;
    max-height: none;
    border-width: 0 0 2px;
    box-shadow: none;
}

.modal {
    width: 100%;
    min-height: 360px;
    max-height: calc(100dvh - 3rem - var(--taskbar-height, 0px));
    border: 2px solid #000;
    background: #fefee5;
    box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.18);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.modal__header {
    position: relative;
    overflow: hidden;
    cursor: grab;
    user-select: none;
    touch-action: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-bottom: 2px solid #000;
    background: linear-gradient(90deg, #b300b3 0%, #ff66d9 100%);
    color: #fff;
}

.modal__header::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 38%, rgba(255, 255, 255, 0.5) 48%, rgba(255, 255, 255, 0) 58%);
    transform: translateX(-120%);
    animation: modal-sheen 6s ease-in-out 1s infinite;
    pointer-events: none;
}

.modal--dragging .modal__header {
    cursor: grabbing;
}

.modal--dragging {
    box-shadow: 14px 16px 0 rgba(0, 0, 0, 0.2);
}

.modal-overlay--maximized .modal__header {
    cursor: default;
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

.modal__action--restore span {
    width: 12px;
    height: 12px;
}

.modal__action--restore span::before,
.modal__action--restore span::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    border: 2px solid #111;
    background: #fefee5;
}

.modal__action--restore span::before {
    top: 0;
    right: 0;
}

.modal__action--restore span::after {
    bottom: 0;
    left: 0;
}

.modal__action:hover {
    filter: brightness(1.08);
}

.modal__action:active {
    box-shadow: inset -1px -1px 0 #fff, inset 1px 1px 0 rgba(0, 0, 0, 0.22);
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
    flex: 1;
    min-height: 0;
    padding: 1rem;
    overflow: auto;
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

/* 3D "window pop": the overlay animation spans the longest child animation so Vue waits for it. */
.window3d-enter-active {
    animation: window3d-overlay 480ms ease both;
}

.window3d-leave-active {
    animation: window3d-overlay 240ms ease reverse both;
}

.window3d-enter-active .modal {
    animation: window3d-open 480ms cubic-bezier(0.2, 0.9, 0.25, 1.12) both;
}

.window3d-leave-active .modal {
    animation: window3d-close 240ms ease-in both;
}

.window3d-leave-active.modal-overlay--minimizing {
    animation-duration: 380ms;
}

.window3d-leave-active.modal-overlay--minimizing .modal {
    transform-origin: 20% 100%;
    animation: window3d-minimize 380ms cubic-bezier(0.55, 0, 0.8, 0.4) both;
}

@keyframes window3d-overlay {
    from {
        background-color: rgba(17, 17, 17, 0);
    }
}

@keyframes window3d-open {
    0% {
        opacity: 0;
        transform: perspective(1400px) translate3d(0, 48px, -320px) rotateX(26deg) rotateY(-14deg) scale(0.86);
        filter: hue-rotate(120deg) saturate(2);
    }

    55% {
        opacity: 1;
        filter: none;
    }

    100% {
        transform: none;
    }
}

@keyframes window3d-close {
    to {
        opacity: 0;
        transform: perspective(1400px) translate3d(0, 28px, -220px) rotateX(-18deg) scale(0.9);
    }
}

@keyframes window3d-minimize {
    to {
        opacity: 0;
        transform: translate3d(-18vw, 55vh, 0) scale(0.08, 0.04) skewX(12deg);
        filter: blur(2px);
    }
}

@keyframes modal-sheen {
    0%,
    72% {
        transform: translateX(-120%);
    }

    100% {
        transform: translateX(120%);
    }
}

@media (prefers-reduced-motion: reduce) {
    .window3d-enter-active,
    .window3d-leave-active,
    .window3d-enter-active .modal,
    .window3d-leave-active .modal,
    .window3d-leave-active.modal-overlay--minimizing .modal,
    .modal__header::after {
        animation: none;
    }
}

@media (max-width: 720px) {
    .modal-overlay {
        padding: 0.75rem 0.75rem calc(0.75rem + var(--taskbar-height, 0px));
        align-items: stretch;
    }

    .modal {
        width: 100%;
        min-height: calc(100dvh - 1.5rem - var(--taskbar-height, 0px));
        max-height: calc(100dvh - 1.5rem - var(--taskbar-height, 0px));
        box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.16);
    }

    .modal__header {
        cursor: default;
    }

    .modal__header {
        padding: 0.65rem 0.75rem;
    }

    .modal__title {
        font-size: 0.9rem;
    }

    .modal__body {
        padding: 0.75rem;
    }

    .modal__status {
        flex-direction: column;
        align-items: flex-start;
        font-size: 0.72rem;
    }

    .modal__status-left,
    .modal__status-right {
        flex-wrap: wrap;
        gap: 0.6rem;
    }
}
</style>
