---
name: cast-mode
description: Pre-production studio for sessions, projects, cast, locations, props
metadata:
  type: project  
---

# Subgoal 2.0: Cast Mode — Pre-Production Studio

## Objective
Create a clean, minimalist pre-production workspace for managing video production assets.

## Clean UI Principles
- No visual noise — Only essential controls visible
- Single primary action per view — Clear hierarchy
- Progressive disclosure — Advanced features in modals

## Core Components

### Session List
- Project grouping with dropdown filter
- Session cards with title, logline, date
- Actions: Duplicate, Archive, Delete

### Main Canvas
- Background with location imagery
- Drag-drop character placement
- Location gallery sidebar
- Prop library sidebar

### Detail Panels (Modals)
- Character Details Modal
  - Poses grid (thumbnail + name)
  - Movements timeline (key-framed)
  - Framing guidelines (shot types)
- Location Details Modal
  - 360° view (cyclorama preview)
  - Lighting setup (HDRI environment)
  - Camera positions (preset tags)
- Prop Details Modal
  - Variations carousel
  - Attributes tags

### Settings Bar (bottom)
- AI Provider selector (Agnes/ComfyUI)
- Model selection dropdown
- API key management

## Data Flow
CastSession → Character → Pose/Movement → Storyboard Scene