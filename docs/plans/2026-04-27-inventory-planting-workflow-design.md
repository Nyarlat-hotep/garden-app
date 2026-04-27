# Inventory & Planting Workflow Design

**Date:** 2026-04-27

## Overview

Separate "adding to inventory" from "planting" in the garden app. Plants added from the discovery page go into inventory first, then users explicitly plant them from the garden view to start care timers.

## Data Model Changes

### `plants` table

Add one column:
- `is_planted` boolean, default `false`, not null

Existing columns used:
- `date_planted` — remains `null` until plant is placed in garden, then set to placement date
- All other fields (name, variety, category, care intervals, etc.) populated at inventory-add time

### `garden_map.cells` structure (unchanged)

Cells store `plantId` references. When a planted plant is deleted, its cells must be cleared.

## User Flows

### Flow 1: Add Plant to Inventory (from Discovery)

1. User browses Discover page, finds a plant
2. Clicks "+" button on plant card
3. Modal opens with pre-filled fields from discovery data:
   - **Name** (required, editable) — e.g., "Roma Tomatoes"
   - **Notes** (optional)
   - **More details** toggle expands:
     - Variety (editable)
     - Category (editable)
     - Care intervals (water, fertilize, prune, harvest — all editable)
     - Days to harvest (editable)
4. User clicks "Add to Inventory"
5. Plant saved with `is_planted = false`, `date_planted = null`
6. Modal closes, user stays on Discover page

### Flow 2: View Unplanted Plants (Garden Sidebar)

1. User navigates to Garden (map) view
2. Right sidebar displays all plants in single list:
   - Planted plants shown normally
   - Unplanted plants shown with "Not planted yet" pill badge
3. Clicking any plant opens its detail popup

### Flow 3: Plant Detail Popup (Unplanted Plant)

When clicking an unplanted plant from sidebar:
- Shows: name, variety, category, care intervals, notes
- Action buttons: **Plant it**, Edit, Delete
- No "Log activity" button (care tracking starts after planting)

### Flow 4: Planting a Plant

1. User clicks "Plant it" from unplanted plant popup
2. Garden map enters placement mode (visual indicator on cursor)
3. User paints cells on map to place the plant
4. On placement confirm:
   - `is_planted = true`
   - `date_planted = today` (current date)
   - Care timers begin tracking from this date
5. Plant remains in sidebar, "Not planted yet" badge removed

### Flow 5: Plant Detail Popup (Planted Plant)

When clicking a planted plant from sidebar:
- Shows: name, variety, category, care intervals, health status, last activity dates
- Action buttons: **Log activity**, Edit, Delete
- Health badge and overdue icons visible

### Flow 6: Deleting a Planted Plant

1. User clicks "Delete" on a planted plant
2. Confirmation dialog appears:
   - "This will remove the plant from your garden map"
   - Confirm / Cancel buttons
3. On confirm:
   - Plant row deleted from `plants` table
   - All garden map cells referencing this plant cleared
   - Sidebar updates to remove plant

### Flow 7: Deleting an Unplanted Plant

1. User clicks "Delete" on an unplanted plant
2. Standard confirmation (no map warning needed)
3. On confirm: plant row deleted

## UI Components to Modify

| Component | Changes |
|-----------|---------|
| `DiscoverView.jsx` | Update `onAddPlant` to open new inventory modal instead of current add modal |
| `AddPlantModal.jsx` | Rename/refactor to "AddToInventoryModal" — remove date picker, keep other fields |
| `PlantDetailModal.jsx` | Conditional buttons: unplanted shows "Plant it", planted shows "Log activity" |
| `GardenMap.jsx` | Add right sidebar for plant list; add placement mode visual state |
| `useGardenMap.js` | Add logic to clear cells when planted plant deleted |
| `usePlants.js` | Add `is_planted` field handling; filter support if needed |
| `App.jsx` | Wire up new "plant it" flow, sidebar state management |

## New Components

| Component | Purpose |
|-----------|---------|
| `GardenSidebar.jsx` | Right sidebar showing all plants (planted + unplanted) with visual distinction |
| `PlantPlacementMode.jsx` | Visual indicator when user is in "plant it" placement mode |

## Database Migration

```sql
-- Add is_planted column to plants table
alter table plants
  add column if not exists is_planted boolean not null default false;

-- Ensure date_planted can be null (should already be nullable)
alter table plants
  alter column date_planted drop not null;
```

## Edge Cases

1. **Multiple instances of same plant**: Each "Add" from discovery creates separate row — no quantity grouping
2. **Unplanted plant has no timers**: Health calculation should handle `is_planted = false` gracefully
3. **Deleting planted plant clears cells**: Must clean up garden_map.cells referencing deleted plant
4. **Back-dating not supported**: `date_planted` is always "today" when planting — no picker

## Success Criteria

- [ ] Adding from discovery creates inventory-only plant (`is_planted = false`)
- [ ] Unplanted plants visible in garden sidebar with "Not planted yet" badge
- [ ] "Plant it" flow places plant on map and starts timers
- [ ] Planted plants show "Log activity" button
- [ ] Unplanted plants show "Plant it" button (no "Log activity")
- [ ] Deleting planted plant clears map cells with warning
- [ ] Care timers calculate correctly from `date_planted`
