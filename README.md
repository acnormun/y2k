# y2k

A retro-futuristic portfolio built with Vue 3, TypeScript, and Vite. The interface recreates a nostalgic early-2000s desktop experience with interactive windows, an embedded terminal, a fake media player, multilingual support, and a playable Snake mini-game.

## Overview

This project presents Ana Clara Noronha inside a navigable "operating system" style interface. Instead of using a traditional landing page, the experience is structured as a desktop with shortcuts, modal windows, and themed components that reinforce the Y2K visual identity.

## Features

- Interactive desktop with shortcuts for projects, about, contact, and Snake.
- Multilingual interface with support for `en`, `pt-BR`, and `es`.
- Persisted language, theme, and game high score using `localStorage`.
- Intro modal designed to quickly introduce the portfolio.
- Fake terminal with commands to navigate the site content.
- Snake mini-game with keyboard controls, pause, restart, and high score tracking.
- Responsive layout for desktop and mobile devices.

## Tech Stack

- Vue 3
- TypeScript
- Vite
- Vue Router
- Vue I18n

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
  i18n/          language configuration and translations
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