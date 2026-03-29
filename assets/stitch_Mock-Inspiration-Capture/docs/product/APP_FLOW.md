# APP_FLOW

## Purpose
Define the main user journeys and screen-level flow for the C2E2 Capture App Version 2.

The app has two major modes:

1. Capture Mode
2. Curate + Analyze Mode

Capture Mode is fast and lightweight.
Curate + Analyze Mode is slower, strategic, and better suited to desktop/web.

---

# 1. Product Flow Overview

Capture → Organize → Curate → Analyze → Review → Export → Act

---

# 2. Core User Modes

## Mode A: Capture
Used during the event.

### Goal
Capture inspiration quickly with minimal friction.

### Main actions
- create entry
- take or attach photo
- add quick tags
- favorite entry
- save entry

### Device priority
- mobile-first

---

## Mode B: Curate + Analyze
Used after or between event sessions.

### Goal
Review entries, create meaningful groups, attach questions, and run AI analysis.

### Main actions
- review event entries
- archive/filter/favorite/bulk select
- create curated set
- attach or create question set
- run analysis
- review results
- export output

### Device priority
- desktop/web-first

---

# 3. Primary Navigation

## Recommended top-level routes

- /login
- /signup
- /dashboard
- /events
- /events/:eventId
- /events/:eventId/capture
- /events/:eventId/curate
- /events/:eventId/analysis
- /question-sets
- /analysis-runs/:analysisRunId
- /settings

---

# 4. Detailed User Flows

## Flow A — User Authentication

### Goal
Allow each user to access only their own data.

### Steps
1. User opens app
2. If not authenticated, show login/signup
3. User signs in
4. User is redirected to dashboard
5. Dashboard shows recent events and analysis work

### Success state
- authenticated session established
- user-specific data loaded

---

## Flow B — Create or Open Event

### Goal
Anchor all captures and analysis to an event.

### Steps
1. User goes to dashboard or events page
2. User selects existing event or creates new event
3. New event form includes:
   - title
   - location
   - description
   - dates
4. User saves event
5. User is taken to event detail page

### Success state
- event exists
- user can enter capture or curate mode

---

## Flow C — Capture Entry

### Goal
Quickly capture inspiration during the event.

### Screen
/events/:eventId/capture

### Entry form fields
- booth name
- artist name
- visual inspiration
- emotional reaction
- brand idea
- material or phrase
- notes
- tags
- favorite toggle
- photo attach/take

### Steps
1. User opens capture page
2. User fills some or all fields
3. User adds optional image
4. User taps save
5. Entry is stored and linked to event
6. User can:
   - create another entry
   - edit entry
   - return to event

### Success state
- new entry saved
- image uploaded and linked
- entry visible in event feed/list

### Notes
- minimize friction
- keep this screen fast
- do not overload with analysis tools here

---

## Flow D — Organize Event Entries

### Goal
Prepare source data for review and selection.

### Screen
/events/:eventId

### Main actions
- view all entries
- search
- filter by tag
- filter favorites
- show archived / hide archived
- bulk select
- archive selected
- unarchive selected

### Steps
1. User opens event detail page
2. User reviews entry list/grid
3. User filters or searches
4. User favorites or archives entries
5. User selects entries for curation prep

### Success state
- cleaner event set
- strongest entries easier to find

---

## Flow E — Create Curated Set

### Goal
Build a named selection of entries without changing originals.

### Screen
/events/:eventId/curate

### Steps
1. User opens curate page
2. User sees event entries with filters and bulk select
3. User selects one or more entries
4. User clicks “Create Curated Set”
5. User enters:
   - title
   - optional description
6. App creates curated set
7. Selected entries are linked into the curated set

### Success state
- curated set saved
- original entries untouched

### Notes
- same entry can belong to multiple curated sets
- curated set is a lens, not a copy

---

## Flow F — Attach or Create Question Set

### Goal
Define the 3 questions that guide analysis.

### Entry points
- from curate page
- from question sets page
- from run analysis modal/page

### Steps
1. User opens curated set
2. User chooses:
   - existing question set
   - or create new question set
3. New question set form includes:
   - title
   - optional description
   - question 1
   - question 2
   - question 3
4. User saves question set
5. Question set becomes available for analysis

### Success state
- curated set now has an analysis lens

---

## Flow G — Run Analysis

### Goal
Send curated entries and 3 questions to AI and get structured output.

### Screen
/events/:eventId/analysis
or
curated set detail page

### Steps
1. User selects curated set
2. User selects question set
3. App shows preview:
   - curated set name
   - entry count
   - selected questions
4. User clicks “Run Analysis”
5. App creates AnalysisRun with status = queued/running
6. Backend assembles prompt payload
7. Backend sends structured entry data + questions to AI
8. Response returns
9. App saves:
   - raw response
   - structured output
10. AnalysisRun status becomes completed

### Success state
- analysis result is saved and viewable

### Failure state
- run marked failed
- user can retry

---

## Flow H — Review Analysis Results

### Goal
Understand what the AI found and trace it back to the source material.

### Screen
/analysis-runs/:analysisRunId

### Main sections
- synopsis
- patterns
- opportunities
- top ideas
- next actions
- linked source entries

### Steps
1. User opens completed analysis
2. User reads structured output
3. User expands source entries used in the run
4. User compares AI conclusions to original captures
5. User decides whether to:
   - export
   - rerun
   - refine question set
   - create a new curated set

### Success state
- user trusts and can act on the analysis

---

## Flow I — Export Results

### Goal
Move the output into external workflows.

### Export types
- markdown
- json
- copy to clipboard

### Steps
1. User opens analysis result
2. User clicks export
3. User chooses format
4. App generates export
5. User downloads or copies content

### Success state
- output can move into Obsidian, notes, project planning, or follow-up execution

---

# 5. Screen Inventory

## Authentication
- Login page
- Signup page

## Dashboard
- Recent events
- Recent curated sets
- Recent analysis runs

## Events
- Events list
- Event create/edit
- Event detail

## Capture
- Capture form
- Entry detail/edit

## Curate
- Curated set list within event
- Curated set create/edit
- Curated set detail

## Questions
- Question set list
- Question set create/edit

## Analysis
- Analysis setup page/modal
- Analysis result page
- Analysis history list

---

# 6. State Transitions

## Entry
- active
- archived

## Curated Set
- draft
- ready
- archived

## Analysis Run
- draft
- queued
- running
- completed
- failed

---

# 7. Recommended UX Priorities

## Capture UX priorities
- speed
- large tap targets
- minimal required fields
- quick save
- stable photo upload
- clear success feedback

## Curate UX priorities
- search/filter clarity
- bulk actions
- easy set creation
- visible question context
- trustworthy analysis history

---

# 8. Prompt Payload Shape

Before sending to AI, entries should be normalized into a consistent structure.

## Example
- Entry ID
- Event name
- Booth name
- Artist name
- Visual inspiration
- Emotional reaction
- Brand idea
- Material or phrase
- Notes
- Tags
- Favorite status
- Image URL

This improves consistency and analysis quality.

---

# 9. Minimum Version 2 User Journey

1. User logs in
2. User creates event
3. User captures entries during conference
4. User reviews event entries later
5. User bulk selects strong entries
6. User creates curated set
7. User attaches 3-question set
8. User runs analysis
9. User reviews result
10. User exports markdown/json
11. User acts on top ideas and next steps

---

# 10. Future Flow Extensions

Possible later additions:
- compare two analysis runs
- compare two events
- AI-suggested curated sets
- AI-suggested tags
- dashboard trend summaries
- collaborative/shared events

These are not required for the first strong Version 2.

---

# Summary

The app should feel like two connected products:

## Capture Product
Fast, lightweight, mobile, in-the-moment

## Curate + Analyze Product
Thoughtful, structured, desktop-friendly, strategic

That split is not a weakness.
It is the product strategy.