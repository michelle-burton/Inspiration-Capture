# DATA_MODEL

## Purpose
Define the core data structure for the C2E2 Capture App Version 2.

The system supports:
- fast capture during an event
- organization of entries after capture
- curation into named sets
- attaching reusable question sets
- AI analysis on curated groups
- saving/exporting analysis results

---

## Core Principles

- Users own their own data
- Events contain many entries
- Original entries are never modified by curation or analysis
- Curated Sets reference entries without duplicating them
- Analysis Runs are repeatable and saved
- Images are stored separately from the main entry record
- Capture stays lightweight; complexity moves into curate/analyze mode

---

## Entity Overview

1. User
2. Event
3. Entry
4. EntryImage
5. Tag
6. EntryTag
7. CuratedSet
8. CuratedSetEntry
9. QuestionSet
10. AnalysisRun
11. AnalysisResult

---

## 1. User

Represents an authenticated account.

### Fields
- id
- email
- display_name
- created_at
- updated_at

### Notes
- A user owns many events
- A user owns many question sets
- A user owns many analysis runs

---

## 2. Event

Represents a conference, trip, or capture session.

### Example
- C2E2 Chicago 2026

### Fields
- id
- user_id
- title
- slug
- description
- location
- start_date
- end_date
- status
  - draft
  - active
  - archived
- created_at
- updated_at

### Relationships
- belongs to one user
- has many entries
- has many curated sets
- has many analysis runs

---

## 3. Entry

Represents a single capture made during the event.

### Fields
- id
- user_id
- event_id
- title
- booth_name
- artist_name
- visual_inspiration
- emotional_reaction
- brand_idea
- material_or_phrase
- notes
- price_range
- source_type
  - camera
  - library
  - text_only
- is_favorite
- is_archived
- captured_at
- created_at
- updated_at

### Notes
- This is the source record
- It should remain stable even if later grouped or analyzed
- `captured_at` is the field-time timestamp
- `created_at` is the database creation timestamp

---

## 4. EntryImage

Stores image metadata separately from Entry.

### Fields
- id
- entry_id
- storage_path
- public_url
- file_name
- mime_type
- file_size
- width
- height
- created_at

### Notes
- Do not store base64 long-term
- Upload image file to storage
- Save reference data here
- One entry may have one or many images
- If keeping only one image per entry at first, this model still scales

---

## 5. Tag

Reusable tags for organizing entries.

### Fields
- id
- user_id
- name
- color
- created_at
- updated_at

### Notes
- Tags are user-scoped
- Example:
  - celestial
  - stickers
  - dreamy
  - easy-to-make
  - merch

---

## 6. EntryTag

Join table between Entry and Tag.

### Fields
- id
- entry_id
- tag_id
- created_at

### Notes
- One entry can have many tags
- One tag can belong to many entries

---

## 7. CuratedSet

A named group of selected entries for review or analysis.

### Example
- Celestial Motifs
- Strongest Cyan Dream Directions
- Easy-to-Launch Product Ideas

### Fields
- id
- user_id
- event_id
- title
- description
- status
  - draft
  - ready
  - archived
- created_at
- updated_at

### Notes
- Does not duplicate entry content
- Represents a user-defined lens on source data

---

## 8. CuratedSetEntry

Join table between CuratedSet and Entry.

### Fields
- id
- curated_set_id
- entry_id
- sort_order
- added_at

### Notes
- Lets one entry appear in multiple curated sets
- Enables repeatable analysis without touching original data

---

## 9. QuestionSet

Reusable set of analysis questions.

### Fields
- id
- user_id
- title
- description
- question_1
- question_2
- question_3
- created_at
- updated_at

### Notes
- Can be event-specific or reusable
- Example:
  - What themes keep repeating visually?
  - What products seem most desirable and buyable?
  - What style direction feels most aligned with me?

---

## 10. AnalysisRun

Represents one execution of AI analysis.

### Fields
- id
- user_id
- event_id
- curated_set_id
- question_set_id
- title
- prompt_version
- model_name
- status
  - draft
  - queued
  - running
  - completed
  - failed
- started_at
- completed_at
- created_at
- updated_at

### Notes
- Same curated set can be run multiple times
- Same question set can be reused
- Useful for prompt iteration and comparison

---

## 11. AnalysisResult

Stores the structured output from an AnalysisRun.

### Fields
- id
- analysis_run_id
- synopsis
- patterns_json
- opportunities_json
- top_ideas_json
- next_actions_json
- raw_response
- markdown_export
- created_at
- updated_at

### Notes
- Store both structured output and raw response
- `markdown_export` is useful for Obsidian/export workflows

---

## Suggested Relationships

### User
- has many Events
- has many Tags
- has many QuestionSets
- has many CuratedSets
- has many AnalysisRuns

### Event
- belongs to User
- has many Entries
- has many CuratedSets
- has many AnalysisRuns

### Entry
- belongs to User
- belongs to Event
- has many EntryImages
- has many EntryTags
- belongs to many CuratedSets through CuratedSetEntry

### Tag
- belongs to User
- belongs to many Entries through EntryTag

### CuratedSet
- belongs to User
- belongs to Event
- belongs to many Entries through CuratedSetEntry

### QuestionSet
- belongs to User
- can be used by many AnalysisRuns

### AnalysisRun
- belongs to User
- belongs to Event
- belongs to CuratedSet
- belongs to QuestionSet
- has one AnalysisResult

---

## Recommended Constraints

- user_id required on all user-owned records
- event_id required for entries, curated sets, analysis runs
- entry_id required for entry_images and entry_tags
- curated_set_id + entry_id should be unique in CuratedSetEntry
- tag name should be unique per user
- slug should be unique per user or globally, depending on routing

---

## Suggested Enums

### Event.status
- draft
- active
- archived

### Entry.source_type
- camera
- library
- text_only

### CuratedSet.status
- draft
- ready
- archived

### AnalysisRun.status
- draft
- queued
- running
- completed
- failed

---

## Future Expansion

Possible later entities:
- AnalysisComment
- SavedPromptTemplate
- EventSummary
- DashboardSnapshot
- SharedProject
- TeamMember

These are not required for Version 2 foundation.

---

## Minimum Version 2 Build Order

1. User
2. Event
3. Entry
4. EntryImage
5. Tag + EntryTag
6. CuratedSet + CuratedSetEntry
7. QuestionSet
8. AnalysisRun
9. AnalysisResult

---

## Summary

This data model supports two distinct product modes:

### Capture Mode
- Event
- Entry
- EntryImage
- Tag

### Curate + Analyze Mode
- CuratedSet
- QuestionSet
- AnalysisRun
- AnalysisResult

That separation protects the original data and supports repeated strategic analysis.