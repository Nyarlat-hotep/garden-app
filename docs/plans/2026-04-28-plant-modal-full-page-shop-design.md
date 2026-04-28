# Plant Detail Modal: Full-Page + Shop Recommendations — Design

**Date:** 2026-04-28
**Status:** Approved design, implementation pending

## Goal

Convert the existing plant detail modal ([`src/components/Garden/PlantDetailModal.jsx`](../../src/components/Garden/PlantDetailModal.jsx)) into a full-page experience and add a plant-specific product recommendations section. Recommendations link out to Amazon search results with an optional affiliate tag, so the system helps users garden end-to-end (care + tools + amendments + problem-solving).

The modal is opened from the Garden sidebar and Inventory page; both entry points keep working unchanged.

## Approach: search-link affiliate, plant-specific

We chose **search-link** over Amazon PA-API and over a hand-curated catalog. Tradeoffs:

- **No API account, no rate limits, no approval gate.** Ships immediately.
- **No product images, no prices in the modal** — every card is "Find X →".
- **Still earns commission** when a user has an Amazon Associates tag set in env. Without a tag, links still work; no revenue.
- **Plant-specificity** comes from interpolating plant attributes (name, family, flags) into search queries — not from per-product editorial.

## Section 1 — Modal becomes full-page

Same React component, same callsites, same props. The change is CSS + a small animation tweak.

- `.detail-modal-box` overrides: `width: 100vw`, `height: 100dvh`, `max-width/height: none`, `border-radius: 0`, internal `overflow-y: auto`.
- Close button stays pinned top-right (`position: sticky` or `fixed` within the modal).
- Replace scale-in animation with slide-up + fade so it doesn't read as "tiny modal blown up." On mobile, this is essentially the current experience; on desktop, it's a meaningful change.
- The existing `.modal-backdrop` click-to-close stays — clicking the backdrop won't be possible at full-page, so close is via the X button.
- `100dvh` (not `100vh`) so iOS Safari address-bar collapse doesn't push content under the bottom nav.

## Section 2 — Recommendation engine

New file: `src/data/productRecommendations.js`.

### Public API

```js
export function getRecommendationsForPlant(plant) {
  // returns Recommendation[]
}
```

### Recommendation shape

```js
{
  id: 'fertilizer',          // stable string for keys
  category: 'Care',          // 'Care' | 'Tools' | 'Problem-solving'
  title: 'Fertilizer',
  blurb: 'Tomato fertilizer', // short, plant-aware
  icon: 'flask',             // lucide-react icon name
  query: 'tomato fertilizer',// raw search string
  store: 'amazon',
}
```

### Layered selection logic

The function builds the list in three passes, then de-dupes by `id`.

**Pass 1 — Universal (always included):**

| id | title | query template |
|---|---|---|
| `fertilizer` | Fertilizer | `${plant.name} fertilizer` |
| `pest-control` | Pest control | `${plant.name} pest control` |
| `watering-can` | Watering can | `garden watering can` |
| `gloves` | Gloves | `gardening gloves` |

**Pass 2 — Conditional from plant fields:**

| Trigger | id | query |
|---|---|---|
| `prune_interval_days != null` | `pruners` | `pruning shears` |
| `plant_family` is `Cucurbitaceae` or plant id matches pole beans | `trellis` | `garden trellis` |
| `plant_family === 'Solanaceae'` and category is vegetable | `cage` | `tomato cage` |
| Berry plants (id matches `strawberry|blueberry|raspberry|blackberry`) | `netting` | `bird netting for berries` |

**Pass 3 — Family-targeted problem solvers:**

| Family | id | query |
|---|---|---|
| `Ericaceae` (blueberry) | `acidic-soil` | `soil acidifier blueberry` |
| `Solanaceae` | `blossom-end-rot` | `calcium spray blossom end rot` |
| `Cucurbitaceae` | `powdery-mildew` | `neem oil powdery mildew` |
| `Rosaceae` fruit trees (apple, pear, peach, plum) | `dormant-oil` | `dormant oil fruit tree spray` |

### Search URL helper

```js
export function amazonSearch(query) {
  const tag = import.meta.env.VITE_AMAZON_TAG ?? ''
  const params = new URLSearchParams({ k: query })
  if (tag) params.set('tag', tag)
  return `https://www.amazon.com/s?${params.toString()}`
}
```

Tag stays empty until an Associates account is provisioned. No code change needed when the tag arrives — just set the env var.

## Section 3 — Shop UI in the modal

Inserted between the care-intervals row and the bottom action buttons.

### Layout

```
─── Recommended for your Tomato ─────────────────────
Affiliate links — we may earn a commission

CARE
┌──────────────────┐  ┌──────────────────┐
│ 🧪 Fertilizer    │  │ 🐛 Pest control  │
│ Tomato fertilizer│  │ Tomato pest …    │
│           Shop ↗ │  │           Shop ↗ │
└──────────────────┘  └──────────────────┘

TOOLS
┌──────────────────┐  ┌──────────────────┐
│ ✂ Pruners        │  │ ▢ Tomato cage    │
│ Pruning shears   │  │ Tomato cage      │
│           Shop ↗ │  │           Shop ↗ │
└──────────────────┘  └──────────────────┘

PROBLEM-SOLVING
┌──────────────────┐
│ ⚠ Blossom end rot│
│ Calcium spray …  │
│           Shop ↗ │
└──────────────────┘
```

### Card behavior

Each card is a single clickable `<a>`:

```html
<a href={amazonSearch(rec.query)}
   target="_blank"
   rel="noopener noreferrer sponsored"
   className="shop-card">
```

`rel="sponsored"` is the FTC/Amazon-required disclosure for affiliate links.

### Disclaimer

One line directly under the section header:

> *Affiliate links — we may earn a commission*

This satisfies the disclosure rule without a separate ToS page.

### Responsive

- Mobile (< 480px): 1 column.
- Tablet/desktop: `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`.

### Icon mapping

The `icon` field is a string; the modal maps it to a lucide-react component. Map in the modal file rather than the data file to avoid pulling lucide imports into the data layer.

## Section 4 — Out of scope (intentional)

- **No PA-API integration.** No prices, no product images, no reviews.
- **No click tracking / analytics.** Add later if needed.
- **No "I bought this" inventory link.** Separate feature.
- **No editable per-plant recommendations in Supabase.** Logic stays code-driven for now.
- **No multi-store fan-out** (Home Depot, Lowes, etc.). Amazon only in v1.
- **No full ToS/privacy page edits.** Inline disclaimer only.

## Files touched

| File | Change |
|---|---|
| `src/components/Garden/PlantDetailModal.jsx` | Add Shop section render |
| `src/components/Garden/PlantDetailModal.css` | Full-page layout + shop card styles |
| `src/data/productRecommendations.js` | **NEW** — engine + URL helper |

## Open items for implementation pass

- Where to set the env var? Vercel project settings + a `.env.example` entry.
- Animation choice: slide-up vs fade for full-page transition. Decide during build.
- Whether the close button should be a fixed FAB or pinned in a top bar with the plant name once the user scrolls past the hero.
