# Pictora

AI image generator powered by Agnes AI Hub and ComfyUI. Generate, edit, and iterate on images with multimodal prompts.

## Features

- **Multi-provider support** — Agnes AI (open-source), ComfyUI (self-hosted)
- **Prompt refinement** — AI-powered prompt enhancement and randomization
- **Image references** — Subject, scene, and style image inputs
- **Aspect ratio presets** — 1:1, 16:9, 9:16, 4:3, 3:4, and more
- **Variations** — Generate multiple variations from a single prompt
- **AI inpainting** — Edit generated images with mask-based AI editing
- **Storyboard mode** — Create and refine film storyboards with AI assistance
- **Export formats** — PDF, HTML, contact sheets, and individual images
- **ComfyUI integration** — Self-hosted image generation via ComfyUI

## Getting Started

```bash
pnpm install
```

Copy `.env.example` to `.env` and add your Agnes AI API key:

```
AGNES_API_KEY="your-api-key-here"
AGNES_API_URL="https://apihub.agnes-ai.com/v1"  # optional, default shown
```

Start the dev server:

```bash
pnpm dev
```

## Tech Stack

- React 19 + TypeScript
- Vite
- Zustand (state management)
- Agnes AI Hub (OpenAI-compatible API)
- Tailwind CSS
- Motion (Framer Motion rebranded)

## API Key

Get your Agnes AI API key at [Agnes AI Hub](https://apihub.agnes-ai.com). Quotas and pricing vary by provider tier.
