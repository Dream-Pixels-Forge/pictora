# Pictora

AI image generator powered by Google Gemini and Imagen models. Generate, edit, and iterate on images with multimodal prompts.

## Features

- **Multi-model support** — Gemini 2.5 Flash, Gemini 3.1 Flash, Gemini 3 Pro, Imagen 4.0/3.0
- **Prompt refinement** — AI-powered prompt enhancement and randomization
- **Image references** — Subject, scene, and style image inputs
- **Aspect ratio presets** — 1:1, 16:9, 9:16, 4:3, 3:4, and more
- **Variations** — Generate multiple variations from a single prompt
- **AI inpainting** — Edit generated images with mask-based AI editing
- **ComfyUI integration** — Self-hosted image generation via ComfyUI

## Getting Started

```bash
pnpm install
```

Copy `.env.example` to `.env` and add your Gemini API key:

```
GEMINI_API_KEY="your-api-key-here"
```

Start the dev server:

```bash
pnpm dev
```

## Tech Stack

- React 19 + TypeScript
- Vite
- Zustand (state management)
- Google Gen AI SDK (`@google/genai`)
- Tailwind CSS
- Framer Motion

## API Key

Get your free Gemini API key at [Google AI Studio](https://aistudio.google.com/app/apikey). Quotas are per Google Cloud project — create a new project for additional quota or enable billing.
