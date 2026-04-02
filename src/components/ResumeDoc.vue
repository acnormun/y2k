<template>
  <Modal :title="t('resume.title')" :icon="modalIcon" :is-open="isOpen" @close="emit('close')">
    <section class="resume-viewer" :aria-label="t('resume.aria')">
      <header class="resume-viewer__toolbar">
        <div class="resume-viewer__menu">
          <span v-for="menu in viewerMenu" :key="menu">{{ menu }}</span>
        </div>

        <div class="resume-viewer__controls">
          <span class="resume-viewer__chip">Times New Roman</span>
          <span class="resume-viewer__chip">12</span>
          <span class="resume-viewer__icon">B</span>
          <span class="resume-viewer__icon">I</span>
          <span class="resume-viewer__icon">U</span>
          <button type="button" class="resume-viewer__save" @click="saveAsPdf">
            {{ t('resume.savePdf') }}
          </button>
        </div>
      </header>

      <div class="resume-viewer__canvas">
        <article class="resume-page">
          <header class="resume-page__hero">
            <p class="resume-page__name">{{ t('resume.name') }}</p>
            <p class="resume-page__role">{{ t('resume.roleLine') }}</p>
          </header>

          <section class="resume-section">
            <h3 class="resume-section__title">{{ t('resume.sections.summary') }}</h3>
            <p class="resume-section__text">{{ t('resume.summary') }}</p>
          </section>

          <section class="resume-section">
            <h3 class="resume-section__title">{{ t('resume.sections.capabilities') }}</h3>
            <div class="resume-capabilities">
              <article v-for="capability in capabilities" :key="capability.title" class="resume-capabilities__item">
                <span class="resume-capabilities__icon">{{ capability.icon }}</span>
                <span class="resume-capabilities__title">{{ capability.title }}</span>
              </article>
            </div>
          </section>

          <section class="resume-section">
            <h3 class="resume-section__title">{{ t('resume.sections.experience') }}</h3>
            <div class="resume-timeline">
              <article v-for="experience in experiences" :key="experience.company" class="resume-timeline__item">
                <div class="resume-timeline__marker" aria-hidden="true" />
                <div class="resume-timeline__content">
                  <header class="resume-timeline__header">
                    <div>
                      <h4 class="resume-timeline__role">{{ experience.role }}</h4>
                      <p class="resume-timeline__company">{{ experience.company }}</p>
                    </div>
                    <span class="resume-timeline__period">{{ experience.period }}</span>
                  </header>

                  <p class="resume-timeline__location">{{ experience.location }}</p>
                  <p class="resume-timeline__summary">{{ experience.summary }}</p>

                  <ul class="resume-timeline__bullets">
                    <li v-for="bullet in experience.highlights" :key="bullet">{{ bullet }}</li>
                  </ul>

                  <p class="resume-timeline__stack">
                    <strong>{{ t('resume.stackLabel') }}</strong> {{ experience.stack }}
                  </p>
                </div>
              </article>
            </div>
          </section>
        </article>

        <article class="resume-page resume-page--secondary">
          <section class="resume-section">
            <h3 class="resume-section__title">{{ t('resume.sections.education') }}</h3>
            <div class="resume-education">
              <article v-for="item in education" :key="`${item.institution}-${item.period}`"
                class="resume-education__item">
                <h4 class="resume-education__institution">{{ item.institution }}</h4>
                <p class="resume-education__program">{{ item.program }}</p>
                <p class="resume-education__period">{{ item.period }}</p>
              </article>
            </div>
          </section>

          <section class="resume-section">
            <h3 class="resume-section__title">{{ t('resume.sections.notes') }}</h3>
            <div class="resume-notes">
              <p v-for="note in notes" :key="note">{{ note }}</p>
            </div>
          </section>
        </article>
      </div>
    </section>
  </Modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from './Modal.vue'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

type ResumeCapability = {
  icon: string
  title: string
}

type ResumeExperience = {
  company: string
  role: string
  period: string
  location: string
  summary: string
  highlights: string[]
  stack: string
}

type ResumeEducation = {
  institution: string
  program: string
  period: string
}

const { t, tm } = useI18n()
const modalIcon = new URL('../assets/doc.svg', import.meta.url).href

const viewerMenu = computed(() => tm('resume.menu') as string[])

const capabilities = computed(() => tm('resume.capabilities') as ResumeCapability[])

const experiences = computed(() => tm('resume.experiences') as ResumeExperience[])

const education = computed(() => tm('resume.education') as ResumeEducation[])

const notes = computed(() => tm('resume.notes') as string[])

const escapePdfText = (value: string) =>
  value
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')

const wrapText = (text: string, maxChars: number) => {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word

    if (nextLine.length > maxChars && currentLine) {
      lines.push(currentLine)
      currentLine = word
      continue
    }

    currentLine = nextLine
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

type PdfLine = {
  text: string
  size: number
  font: 'F1' | 'F2' | 'F3'
  color?: [number, number, number]
  indent?: number
  gapAfter?: number
}

const buildPdfLines = () => {
  const lines: PdfLine[] = [
    { text: t('resume.name'), size: 24, font: 'F2', color: [69, 65, 58], gapAfter: 8 },
    { text: t('resume.roleLine'), size: 9, font: 'F1', color: [46, 159, 45], gapAfter: 18 },
    { text: t('resume.sections.summary'), size: 13, font: 'F1', color: [221, 36, 204], gapAfter: 8 },
  ]

  for (const line of wrapText(t('resume.summary'), 95)) {
    lines.push({ text: line, size: 11, font: 'F3', color: [79, 74, 62] })
  }

  lines.push({ text: '', size: 11, font: 'F3', gapAfter: 8 })
  lines.push({ text: t('resume.sections.capabilities'), size: 13, font: 'F1', color: [221, 36, 204], gapAfter: 8 })

  for (const capability of capabilities.value) {
    lines.push({
      text: `${capability.icon}  ${capability.title}`,
      size: 10,
      font: 'F1',
      color: [101, 95, 78],
      indent: 10,
      gapAfter: 2,
    })
  }

  lines.push({ text: '', size: 11, font: 'F3', gapAfter: 8 })
  lines.push({ text: t('resume.sections.experience'), size: 13, font: 'F1', color: [221, 36, 204], gapAfter: 8 })

  for (const experience of experiences.value) {
    lines.push({ text: experience.role, size: 14, font: 'F2', color: [77, 74, 65], gapAfter: 2 })
    lines.push({ text: `${experience.company} | ${experience.period}`, size: 9, font: 'F1', color: [47, 152, 52], gapAfter: 2 })
    lines.push({ text: experience.location, size: 10, font: 'F3', color: [148, 141, 118], gapAfter: 6 })

    for (const line of wrapText(experience.summary, 95)) {
      lines.push({ text: line, size: 11, font: 'F3', color: [79, 74, 62] })
    }

    lines.push({ text: '', size: 11, font: 'F3', gapAfter: 2 })

    for (const bullet of experience.highlights) {
      const wrapped = wrapText(bullet, 88)
      wrapped.forEach((line, index) => {
        lines.push({
          text: index === 0 ? `- ${line}` : `  ${line}`,
          size: 10.5,
          font: 'F3',
          color: [88, 83, 70],
          indent: 10,
          gapAfter: index === wrapped.length - 1 ? 2 : 0,
        })
      })
    }

    lines.push({
      text: `${t('resume.stackLabel')} ${experience.stack}`,
      size: 10.5,
      font: 'F3',
      color: [107, 101, 84],
      gapAfter: 12,
    })
  }

  lines.push({ text: t('resume.sections.education'), size: 13, font: 'F1', color: [221, 36, 204], gapAfter: 8 })

  for (const item of education.value) {
    lines.push({ text: item.institution, size: 13, font: 'F2', color: [77, 74, 65], gapAfter: 2 })
    for (const line of wrapText(item.program, 95)) {
      lines.push({ text: line, size: 11, font: 'F3', color: [79, 74, 62] })
    }
    lines.push({ text: item.period, size: 10, font: 'F3', color: [143, 136, 111], gapAfter: 10 })
  }

  lines.push({ text: t('resume.sections.notes'), size: 13, font: 'F1', color: [221, 36, 204], gapAfter: 8 })

  for (const note of notes.value) {
    for (const line of wrapText(note, 92)) {
      lines.push({ text: line, size: 11, font: 'F3', color: [79, 74, 62], indent: 6 })
    }
    lines.push({ text: '', size: 11, font: 'F3', gapAfter: 4 })
  }

  return lines
}

const createPdfBlob = () => {
  const pageWidth = 595
  const pageHeight = 842
  const marginX = 56
  const marginTop = 58
  const marginBottom = 56
  const defaultLeading = 15

  const pages: string[] = []
  let currentPage: string[] = []
  let y = pageHeight - marginTop

  const pushPage = () => {
    pages.push(currentPage.join('\n'))
    currentPage = []
    y = pageHeight - marginTop
  }

  for (const line of buildPdfLines()) {
    const leading = Math.max(defaultLeading, line.size + 3)
    const extraGap = line.gapAfter ?? 0
    const nextY = y - leading

    if (nextY < marginBottom) {
      pushPage()
    }

    if (line.text) {
      const x = marginX + (line.indent ?? 0)
      const pdfY = y
      const [r, g, b] = line.color ?? [79, 74, 62]
      currentPage.push(`BT`)
      currentPage.push(`/${line.font} ${line.size} Tf`)
      currentPage.push(`${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg`)
      currentPage.push(`1 0 0 1 ${x} ${pdfY} Tm`)
      currentPage.push(`(${escapePdfText(line.text)}) Tj`)
      currentPage.push(`ET`)
    }

    y -= leading + extraGap
  }

  if (currentPage.length > 0 || pages.length === 0) {
    pages.push(currentPage.join('\n'))
  }

  const objects: string[] = []
  const addObject = (body: string) => {
    objects.push(body)
    return objects.length
  }

  const catalogId = addObject('')
  const pagesId = addObject('')
  const fontRegularId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  const fontHeadingId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')
  const fontBodyId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>')

  const pageIds: number[] = []

  for (const pageContent of pages) {
    const contentStream = `<< /Length ${pageContent.length} >>\nstream\n${pageContent}\nendstream`
    const contentId = addObject(contentStream)
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontHeadingId} 0 R /F3 ${fontBodyId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    )
    pageIds.push(pageId)
  }

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = [0]

  objects.forEach((objectBody, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${objectBody}\nendobj\n`
  })

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'

  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return new Blob([pdf], { type: 'application/pdf' })
}

const saveAsPdf = () => {
  if (typeof window === 'undefined') {
    return
  }

  const blob = createPdfBlob()
  const url = window.URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  const fileName = `${t('resume.name').trim().replace(/\s+/g, '_')}_Resume.pdf`

  link.href = url
  link.download = fileName
  window.document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000)
}
</script>

<style scoped>
.resume-viewer {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  margin: -1rem;
  background: #ded9b3;
}

.resume-viewer__toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.45rem 0.9rem 0.75rem;
  border-bottom: 1px solid #a59f76;
  background: linear-gradient(180deg, #e8e3bb 0%, #d8d09f 100%);
  font-family: 'Times New Roman', serif;
  color: #423e2e;
}

.resume-viewer__menu,
.resume-viewer__controls {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  flex-wrap: wrap;
}

.resume-viewer__menu {
  font-family: var(--font-primary);
  font-size: 0.82rem;
  font-weight: 500;
}

.resume-viewer__controls {
  gap: 0.45rem;
}

.resume-viewer__chip,
.resume-viewer__icon,
.resume-viewer__save {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  border: 1px solid #a79f75;
  background: rgba(255, 255, 255, 0.45);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.resume-viewer__chip {
  min-width: 78px;
  padding: 0 0.65rem;
  font-size: 0.78rem;
}

.resume-viewer__icon {
  width: 26px;
  font-size: 0.8rem;
  font-weight: 700;
}

.resume-viewer__save {
  padding: 0 0.8rem;
  color: #433e31;
  font-family: var(--font-primary);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
}

.resume-viewer__save:hover {
  background: rgba(255, 255, 255, 0.72);
}

.resume-viewer__canvas {
  display: grid;
  gap: 1.4rem;
  padding: 1.5rem;
  overflow: auto;
  background: linear-gradient(180deg, rgba(222, 217, 179, 0.92) 0%, rgba(212, 205, 163, 0.98) 100%);
}

.resume-page {
  width: min(100%, 780px);
  margin: 0 auto;
  padding: 2.3rem 2.55rem;
  border: 1px solid #d9d2b1;
  background: #fff;
  box-shadow: 0 16px 36px rgba(84, 76, 40, 0.18);
  color: #4f4a3e;
}

.resume-page--secondary {
  padding-top: 2rem;
}

.resume-page__hero {
  padding-bottom: 1.4rem;
  border-bottom: 3px solid #ff27d5;
}

.resume-page__name {
  margin: 0;
  color: #45413a;
  font-family: var(--font-tertiary);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  line-height: 0.95;
}

.resume-page__role {
  margin: 0.7rem 0 0;
  color: #2e9f2d;
  font-family: var(--font-secondary);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.resume-section+.resume-section {
  margin-top: 1.7rem;
}

.resume-section__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.9rem;
  padding-bottom: 0.45rem;
  border-bottom: 1px solid rgba(232, 152, 224, 0.5);
  color: #dd24cc;
  font-family: var(--font-secondary);
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.resume-section__title::before {
  content: '◉';
  color: #c61fb7;
  font-size: 0.7rem;
}

.resume-section__text,
.resume-timeline__summary,
.resume-timeline__location,
.resume-timeline__stack,
.resume-notes p,
.resume-education__program,
.resume-education__period {
  margin: 0;
  font-family: 'Times New Roman', serif;
  font-size: 1rem;
  line-height: 1.75;
}

.resume-capabilities {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.6rem;
}

.resume-capabilities__item {
  display: grid;
  gap: 0.4rem;
  justify-items: center;
  padding: 0.95rem 0.75rem;
  border: 1px solid #8d8763;
  background: linear-gradient(180deg, #faf5d9 0%, #f1ebc4 100%);
  text-align: center;
}

.resume-capabilities__icon {
  color: #d819c5;
  font-family: var(--font-tertiary);
  font-size: 1rem;
  font-weight: 700;
}

.resume-capabilities__title {
  color: #655f4e;
  font-family: var(--font-secondary);
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.resume-timeline {
  position: relative;
  display: grid;
  gap: 1.3rem;
}

.resume-timeline::before {
  content: '';
  position: absolute;
  left: 0.34rem;
  top: 0.4rem;
  bottom: 0.4rem;
  width: 2px;
  background: linear-gradient(180deg, #46be39 0%, rgba(70, 190, 57, 0.1) 100%);
}

.resume-timeline__item {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.85rem;
}

.resume-timeline__marker {
  width: 12px;
  height: 12px;
  margin-top: 0.45rem;
  border-radius: 999px;
  background: #2dd126;
  box-shadow: 0 0 0 2px #f7f1d3;
}

.resume-timeline__content {
  display: grid;
  gap: 0.45rem;
}

.resume-timeline__header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
}

.resume-timeline__role,
.resume-education__institution {
  margin: 0;
  color: #4d4a41;
  font-family: var(--font-tertiary);
  font-size: 1.2rem;
  font-weight: 800;
  line-height: 1.1;
}

.resume-timeline__company {
  margin: 0.22rem 0 0;
  color: #2f9834;
  font-family: var(--font-secondary);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.resume-timeline__period {
  padding: 0.35rem 0.55rem;
  border: 1px solid #d4cfac;
  background: #f4efce;
  color: #77715a;
  font-family: var(--font-secondary);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.resume-timeline__location {
  color: #948d76;
  font-size: 0.88rem;
}

.resume-timeline__bullets {
  display: grid;
  gap: 0.5rem;
  margin: 0.2rem 0 0;
  padding-left: 1.2rem;
  color: #585346;
  font-family: 'Times New Roman', serif;
  font-size: 0.98rem;
  line-height: 1.65;
}

.resume-timeline__stack {
  color: #6b6554;
}

.resume-education {
  display: grid;
  gap: 1rem;
}

.resume-education__item {
  padding: 1rem 1.1rem;
  border: 1px solid #e6dfbc;
  background: linear-gradient(180deg, #fffdf5 0%, #faf3d7 100%);
}

.resume-education__program {
  margin-top: 0.4rem;
}

.resume-education__period {
  margin-top: 0.15rem;
  color: #8f886f;
  font-size: 0.92rem;
}

.resume-notes {
  display: grid;
  gap: 0.85rem;
  padding: 1rem 1.1rem;
  border: 2px dashed #ded4a9;
  background: rgba(249, 243, 212, 0.6);
}

@media (max-width: 720px) {
  .resume-viewer {
    margin: -0.75rem;
  }

  .resume-viewer__canvas {
    padding: 0.9rem;
  }

  .resume-page {
    padding: 1.35rem 1.1rem;
  }

  .resume-capabilities {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .resume-timeline__header {
    flex-direction: column;
  }

  .resume-timeline__period {
    white-space: normal;
  }
}
</style>
