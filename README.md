# Inspiration-Capture

A real-time creative capture tool for logging photos, voice memos, tags,
and observations---built to turn fleeting inspiration into structured
ideas.

------------------------------------------------------------------------

## ✨ Overview

**Inspiration-Capture** is a mobile-first application designed to help
you quickly capture and organize creative inspiration during events like
**C2E2**, conferences, or everyday exploration.

Instead of losing ideas in scattered notes or photos, this app creates
**structured entries** that combine: - Visual inspiration (photos) -
Voice thoughts (audio) - Tags (patterns) - Written observations
(insight)

------------------------------------------------------------------------

## 🎯 Purpose

This app is built to support:

-   **Cyan Dream Creations** → visual inspiration, aesthetics, product
    ideas\
-   **Quantum AI Studio** → patterns, concepts, creative systems\
-   **Project 57** → structured thinking and execution

The goal is simple:

> Capture fast → Organize clearly → Extract patterns → Turn into action

------------------------------------------------------------------------

## 📱 Core Features (MVP)

### Capture Entry

-   Editable title (auto-filled with timestamp)
-   Add one or multiple photos
-   Record voice memo (audio)
-   Optional transcript / notes
-   Add quick tags or create custom tags
-   Key observations text area
-   Save entry locally

### Inspiration Feed

-   View recent captures
-   Visual gallery of entries
-   Timestamp + tags preview
-   Quick access to details

### Entry Detail View

-   Title + date
-   Image gallery
-   Audio playback
-   Transcript / notes
-   Observations
-   Tags

------------------------------------------------------------------------

## 🧠 Data Model

``` ts
type CaptureEntry = {
  id: string;
  title: string;
  createdAt: string;
  photos: string[];
  audioUrl?: string;
  transcript?: string;
  tags: string[];
  observations: string;
  source?: "photo" | "voice" | "mixed";
};
```

------------------------------------------------------------------------

## 🛠 Tech Stack

-   React
-   Vite
-   TypeScript
-   Tailwind CSS
-   localStorage

------------------------------------------------------------------------

## 🚀 Getting Started

``` bash
git clone https://github.com/your-username/inspiration-capture.git
cd inspiration-capture
npm install
npm run dev
```

------------------------------------------------------------------------

## 📂 Project Structure

    src/
    ├── components/
    ├── pages/
    ├── hooks/
    ├── utils/
    ├── types/
    ├── styles/
    └── App.tsx

------------------------------------------------------------------------

## 🎨 Design System

Dark, neon editorial aesthetic with cyan/purple accents, soft rounded
cards, and mobile-first layout.

------------------------------------------------------------------------

## 🧭 Guiding Principle

Capture the moment.\
Structure the idea.\
Build the future.
