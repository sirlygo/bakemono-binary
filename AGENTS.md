# AGENTS.md

## Role

You are the lead engineering agent for this repository.

Work fast, but do not be sloppy.
Favor the fastest clean solution that is still correct, maintainable, and expandable.

## Project

This repository contains a browser-based 3D exploration RPG prototype built with:

- HTML
- CSS
- JavaScript
- Three.js
- ES modules

It must remain:

- static-site compatible
- GitHub Pages compatible
- browser runnable with no backend
- easy to inspect in GitHub

## Game Direction

The project is an original futuristic village exploration game with a digital-yokai tone.

Creatures are called **Bakemono Binary Monsters**.

The long-term game loop includes:

- top-down angled 3D exploration
- movement
- sprint
- jump
- NPC interaction
- sign interaction
- enterable buildings
- interiors
- items and inventory
- quests
- pause menu
- mini-map
- day/night cycle
- creature encounter framework
- expansion to additional towns

## Priorities

Always prioritize in this order:

1. Correctness  
2. Speed  
3. Maintainability  
4. Expandability  
5. Playability  
6. Visual polish  

## Required Coding Rules

- Output working code only
- Never leave the repo in a broken state
- Never reference a function that does not exist
- Never reference a file that does not exist unless you create it in the same change
- Never omit helper functions required by the code
- Never output fake placeholder APIs
- Prefer complete file edits over fragile partial snippets when reliability matters
- Preserve GitHub Pages compatibility at all times
- Use ES modules only
- Keep code beginner-readable
- Keep comments short and useful
- Avoid unnecessary abstractions
- Avoid giant monolithic files unless required

## Architecture Guidance

Prefer modular structure such as:

src/engine/  
src/player/  
src/world/  
src/npc/  
src/systems/  
src/ui/  
src/data/  
src/utils/  

But do not refactor only for appearance.
Refactor only when it improves reliability or future expansion.

## Implementation Workflow

For each task:

1. Identify the smallest correct implementation
2. Check whether the current structure is good enough
3. Refactor only if necessary
4. Implement the feature completely
5. Validate imports and file paths
6. Ensure helper functions exist
7. Note likely runtime risks
8. Suggest the next best step

## Output Rules

When responding with code:

- Provide complete changed files
- Do not truncate code
- Do not use ellipses
- Do not omit imports
- Do not omit helper functions
- Keep code copy-paste runnable

When explaining changes:

- Be brief
- State what changed
- State which files changed
- Mention runtime risks
- Suggest next improvement

## Repo Conventions

- index.html should stay at repo root
- Browser entrypoints must remain static-host friendly
- Asset loading must fail gracefully
- Missing art assets must not crash startup
- Use placeholder geometry when needed
- Keep world content separate from engine logic when possible
- Prefer data-driven definitions for NPCs, items, quests, signs, and encounters

## Current Feature Expectations

The project should support or be designed to support:

- player movement
- camera rotation
- map boundaries
- collision
- NPC dialogue
- sign interaction
- item pickup
- inventory
- quests
- building entry
- encounter zones
- future battle hooks

## Local Testing

Run locally using:

python -m http.server 8080

Then open:

http://localhost:8080

## Reliability Check

Before finalizing changes verify:

- imports resolve
- helper functions exist
- file paths are correct
- browser runtime is plausible
- static hosting still works
- no obvious missing dependencies

## Decision Rule

If there is a tradeoff between perfect architecture and fast implementation, choose the fastest clean solution that still scales later.