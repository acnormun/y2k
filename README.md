# y2k

A retro-futuristic portfolio built with Vue 3, TypeScript, and Vite. The interface recreates a nostalgic early-2000s desktop experience with interactive windows, an embedded terminal, a fake media player, multilingual support, and a playable Snake mini-game.

## Overview

This project presents Ana Clara Noronha inside a navigable "operating system" style interface. Instead of using a traditional landing page, the experience is structured as a desktop with shortcuts, modal windows, and themed components that reinforce the Y2K visual identity.

## Features

- Interactive desktop with shortcuts for projects, about, contact, and Snake.
- Real window manager: drag windows by the title bar, maximize (button or double-click), minimize to the taskbar and restore from it.
- Windows 98-style taskbar with a Start menu (Programs, Documents, Settings, Help, Run, Shut Down), Quick Launch, open-window buttons and a system tray with a mini player and clock.
- Multilingual interface with support for `en`, `pt-BR`, and `es`.
- Persisted language, theme, and game high score using `localStorage`.
- Intro modal designed to quickly introduce the portfolio.
- Fake terminal with commands to navigate the site content.
- Snake mini-game with keyboard controls, pause, restart, and high score tracking.
- Responsive layout for desktop and mobile devices.

## 3D Effects (Three.js)

- **3D wallpaper**: a liquid-chrome iridescent blob with orbiting rings, floating floppy disks, CDs, sparkle stars, hearts and butterflies over a synthwave grid with a striped retro sun.
- **Two moods**: a pastel chrome scene in light mode and a neon synthwave night scene in dark mode, switched with a CRT glitch.
- **Post-processing**: bloom, chromatic aberration, scanlines, a rolling refresh band, film grain and a tinted vignette.
- **Interactive**: pointer parallax; click the blob for a shockwave, click objects to spin them, click the floor for a neon ripple and anywhere else for a sparkle burst.
- **Boot screen**: a "NORMUN OS Millennium Edition" boot with BIOS lines and a waving 3D logo (once per session, skippable).
- **Headspace media player**: a tribute to the Windows Media Player 7 "Headspace" skin. A glossy green 3D head whose visor is the visualizer (Bars & Waves, Ambience, Battery, Scope); it nods to the beat, looks at the cursor, sings with its mouth and naps when paused. Playback uses the YouTube IFrame API (play, pause, seek, volume, shuffle, repeat), keeps going when the window is minimized, and falls back to an offline demo clock when YouTube can't load. The visualizer is synthesised from each track's tempo, and the 10-band EQ shapes it.
- **Bubbles screensaver**: Vista-style iridescent soap bubbles drifting and colliding over the live desktop. Starts after 2 minutes idle, from the `BUBBLES` sidebar item, Start > Programs, or `run bubbles` in the terminal.
- **CSS 3D touches**: windows open in perspective, holographic tilt on the portrait and project icons, spinning desktop icons.
- **Clippy, the Office Assistant**: an animated SVG paperclip that follows the cursor with his eyes, blinks, raises his eyebrows, dances when music plays and has idle animations. The Office 97 balloon offers actions, jokes and tips, a working "Type your question here" search, and context tips when windows open ("It looks like you're writing a letter..."). Right-click for Hide / Animate! / Options.
- **Old Windows easter eggs**: the Shut Down dialog over a dithered desktop, "It's now safe to turn off your computer", and a blue screen (`crash` in the terminal).
- **Performance and accessibility**: three.js is lazy-loaded in its own chunk, quality drops on touch/small screens, rendering pauses in background tabs, the `3D` navbar button turns the scene off (persisted), and `prefers-reduced-motion` gets a static frame with no boot or idle screensaver.

## Tech Stack

- Vue 3
- TypeScript
- Vite
- Vue Router
- Vue I18n
- Three.js

## Getting Started

### Requirements

- Node.js 20+ recommended

### Installation

With `npm`:

```bash
npm install
```

Or with `yarn`:

```bash
yarn
```

### Development

With `npm`:

```bash
npm run dev
```

With `yarn`:

```bash
yarn dev
```

### Production Build

With `npm`:

```bash
npm run build
```

With `yarn`:

```bash
yarn build
```

### Local Preview

With `npm`:

```bash
npm run preview
```

With `yarn`:

```bash
yarn preview
```

## Main Structure

```text
src/
  assets/        visual files and icons
  components/    UI building blocks and modal windows
  directives/    reusable template directives (holographic tilt)
  i18n/          language configuration and translations
  audio/         synthesised spectrum that drives the visualizers
  stores/        shared desktop (windows, overlays, settings) and music player state
  three/         Three.js scenes: wallpaper, boot logo, Headspace head, bubbles screensaver, shaders
  router/        application routes
  views/         main screens
```

## Available Scripts

- `dev`: starts the Vite development server
- `build`: runs `vue-tsc` type-checking and generates the production build
- `preview`: serves a local preview of the built app

## CI

The repository includes a workflow in [`.github/workflows/ci.yml`](/c:/Users/anacl/OneDrive/Documentos/Github/y2k/.github/workflows/ci.yml) to:

- install dependencies
- run the production build on Ubuntu with Node 20