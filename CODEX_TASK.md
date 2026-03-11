# CODEX_TASK.md

## Purpose

This file defines how Codex should interpret and execute tasks for this repository.

Use it together with `AGENTS.md`.

Codex should follow `AGENTS.md` as the permanent repo policy.
This file defines task execution style.

## Global Task Rule

For every task:

1. Identify the smallest correct implementation
2. Preserve repo stability
3. Prefer complete working file edits
4. Avoid broken partial snippets
5. Keep GitHub Pages compatibility
6. Keep the project browser-runnable
7. End with a short self-check and next step

## Task Modes

### 1. Build Mode

Use when the user says things like:

- build town
- add system
- implement feature
- create feature
- make X work

Behavior:
- implement the requested feature
- keep structure clean
- output full changed files
- avoid unnecessary refactors unless needed

### 2. Refactor Mode

Use when the user says things like:

- refactor engine
- clean up code
- modularize this
- split this into files
- improve architecture

Behavior:
- improve structure without breaking playability
- preserve existing behavior unless told otherwise
- prefer smallest safe refactor
- output full changed files

### 3. Fix Mode

Use when the user says things like:

- fix bug
- black screen
- collision broken
- import broken
- console error
- not working

Behavior:
- prioritize correctness over adding features
- fix the smallest real cause
- avoid unrelated changes
- explain likely cause briefly
- output full changed files

### 4. Expand Mode

Use when the user says things like:

- make it more like pokemon
- improve visuals
- add more content
- add more town detail
- add more features

Behavior:
- preserve current architecture
- improve playability and visual readability
- add scalable systems, not throwaway hacks
- output full changed files

## Response Template

For each task, respond in this order:

1. Change summary
2. File tree changes if needed
3. Full changed files
4. Quick self-check
5. Likely runtime risks
6. Next best step

## Short Command Mapping

If the user gives short commands, interpret them like this:

### build town
- improve town layout
- improve roads
- improve building placement
- improve boundaries
- improve environmental readability

### add npc system
- create or improve NPC data
- NPC placement
- interaction
- dialogue hooks

### add dialogue
- add dialogue UI
- add NPC/sign text flow
- add interaction prompts if missing

### add encounters
- create encounter zones
- add Bakemono Binary Monster framework
- add future battle hooks

### add interiors
- create door interaction framework
- add enterable building interiors
- preserve future expansion

### refactor engine
- split monolithic code
- improve file ownership
- preserve behavior
- keep repo stable

### fix bug
- identify smallest real cause
- fix it directly
- do not over-refactor

### make it more pokemon-like
Interpret this as:
- improve top-down readability
- improve cozy starter-town composition
- improve roads, houses, signs, grass, trees
- improve NPC placement
- improve town scale
- improve creature-exploration feel

Do not directly copy Pokémon IP, names, or exact layouts.

## Reliability Rules

Never:
- omit helper functions
- leave missing imports
- reference missing files
- output truncated code
- use ellipses in code
- break static hosting compatibility

Always:
- prefer complete changed files
- keep code copy-paste runnable
- keep comments short and useful
- preserve browser execution

## Performance / Speed Rule

If there is a tradeoff between:
- perfect architecture
- fast clean implementation

Choose the fastest clean implementation that still scales later.

## Mission Reminder

This repository is evolving from prototype to expandable browser RPG engine.

Every task should move it forward without breaking what already works.