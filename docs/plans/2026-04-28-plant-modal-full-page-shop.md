# Plant Detail Modal: Full-Page + Shop — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert `PlantDetailModal` to a full-page experience and add a plant-specific Amazon-search affiliate shop section between the care intervals and bottom action buttons.

**Architecture:** Pure frontend change. New data module computes plant-specific recommendations from existing fields (`name`, `plant_family`, `prune_interval_days`, `category`, `id`). Modal CSS swaps centered card for full-viewport overlay. Shop section renders categorized link cards with `rel="sponsored"` and an inline FTC-required disclaimer. Affiliate tag is read from `import.meta.env.VITE_AMAZON_TAG` and is optional — links work without it.

**Tech Stack:** React 19, Vite, Framer Motion, lucide-react, plain CSS (no Tailwind). No test runner — verification is `npm run lint`, `npm run build`, plus dev-server manual check.

**Design doc:** [`docs/plans/2026-04-28-plant-modal-full-page-shop-design.md`](./2026-04-28-plant-modal-full-page-shop-design.md)

---

## Task 1: Recommendation engine

Build the data layer first. It has no UI dependencies and is the easiest piece to reason about in isolation.

**Files:**
- Create: `src/data/productRecommendations.js`

**Step 1: Create the file with the URL helper**

```js
// src/data/productRecommendations.js

export function amazonSearch(query) {
  const tag = import.meta.env.VITE_AMAZON_TAG ?? ''
  const params = new URLSearchParams({ k: query })
  if (tag) params.set('tag', tag)
  return `https://www.amazon.com/s?${params.toString()}`
}
```

**Step 2: Add the universal pass**

Append to the same file:

```js
function universalRecs(plant) {
  const name = plant.name
  return [
    { id: 'fertilizer',   category: 'Care',  title: 'Fertilizer',   blurb: `${name} fertilizer`,   icon: 'flask',     query: `${name} fertilizer` },
    { id: 'pest-control', category: 'Care',  title: 'Pest control', blurb: `${name} pest control`, icon: 'bug',       query: `${name} pest control` },
    { id: 'watering-can', category: 'Tools', title: 'Watering can', blurb: 'Garden watering can',  icon: 'droplets',  query: 'garden watering can' },
    { id: 'gloves',       category: 'Tools', title: 'Gloves',       blurb: 'Gardening gloves',     icon: 'hand',      query: 'gardening gloves' },
  ]
}
```

**Step 3: Add the conditional pass**

```js
const VINE_FAMILIES   = new Set(['Cucurbitaceae'])
const POLE_BEAN_IDS   = new Set(['pole-bean', 'green-bean'])
const BERRY_IDS       = new Set(['strawberry', 'blueberry', 'raspberry', 'blackberry'])
const CAGE_FAMILIES   = new Set(['Solanaceae'])

function conditionalRecs(plant) {
  const out = []
  if (plant.prune_interval_days != null) {
    out.push({ id: 'pruners', category: 'Tools', title: 'Pruners', blurb: 'Pruning shears', icon: 'scissors', query: 'pruning shears' })
  }
  if (VINE_FAMILIES.has(plant.plant_family) || POLE_BEAN_IDS.has(plant.id)) {
    out.push({ id: 'trellis', category: 'Tools', title: 'Trellis', blurb: 'Garden trellis', icon: 'square', query: 'garden trellis' })
  }
  if (CAGE_FAMILIES.has(plant.plant_family) && plant.category === 'vegetable') {
    out.push({ id: 'cage', category: 'Tools', title: 'Tomato cage', blurb: 'Plant cage / stake', icon: 'square', query: 'tomato cage' })
  }
  if (BERRY_IDS.has(plant.id)) {
    out.push({ id: 'netting', category: 'Tools', title: 'Bird netting', blurb: 'Protect your harvest', icon: 'square', query: 'bird netting for berries' })
  }
  return out
}
```

**Step 4: Add the family-targeted problem-solver pass**

```js
const ROSACEAE_TREES = new Set(['apple', 'pear', 'peach', 'plum'])

function problemSolverRecs(plant) {
  const out = []
  if (plant.plant_family === 'Ericaceae') {
    out.push({ id: 'acidic-soil', category: 'Problem-solving', title: 'Acidic soil', blurb: 'Soil acidifier for blueberries', icon: 'beaker',  query: 'soil acidifier blueberry' })
  }
  if (plant.plant_family === 'Solanaceae') {
    out.push({ id: 'blossom-end-rot', category: 'Problem-solving', title: 'Blossom end rot', blurb: 'Calcium spray', icon: 'alert',  query: 'calcium spray blossom end rot' })
  }
  if (plant.plant_family === 'Cucurbitaceae') {
    out.push({ id: 'powdery-mildew', category: 'Problem-solving', title: 'Powdery mildew', blurb: 'Neem oil spray', icon: 'leaf',  query: 'neem oil powdery mildew' })
  }
  if (plant.plant_family === 'Rosaceae' && ROSACEAE_TREES.has(plant.id)) {
    out.push({ id: 'dormant-oil', category: 'Problem-solving', title: 'Dormant oil', blurb: 'Fruit tree spray', icon: 'spray',  query: 'dormant oil fruit tree spray' })
  }
  return out
}
```

**Step 5: Public entry point**

```js
export function getRecommendationsForPlant(plant) {
  if (!plant) return []
  const combined = [...universalRecs(plant), ...conditionalRecs(plant), ...problemSolverRecs(plant)]
  const seen = new Set()
  return combined.filter(r => (seen.has(r.id) ? false : (seen.add(r.id), true)))
}
```

**Step 6: Verify lint passes**

Run: `cd /Users/taylorcornelius/Desktop/garden-app && npm run lint`
Expected: zero errors. If any unused-variable warnings appear, fix them.

**Step 7: Quick smoke check in node**

Run:
```
cd /Users/taylorcornelius/Desktop/garden-app && node -e "
import('./src/data/productRecommendations.js').then(m => {
  const recs = m.getRecommendationsForPlant({ name: 'Tomato', id: 'tomato', plant_family: 'Solanaceae', category: 'vegetable', prune_interval_days: 21 });
  console.log(recs.map(r => r.id));
})
"
```
Expected output should include: `fertilizer pest-control watering-can gloves pruners cage blossom-end-rot`. If `import.meta.env` errors out under bare node, skip this step — Vite's build will catch real issues.

**Step 8: Commit**

```bash
cd /Users/taylorcornelius/Desktop/garden-app
git add src/data/productRecommendations.js
git commit -m "feat: add plant-specific product recommendation engine"
```

---

## Task 2: Full-page modal CSS

Convert the centered modal to a full-viewport overlay. No JSX changes yet — only CSS — so the existing modal still renders fine after this step, just full-screen.

**Files:**
- Modify: `src/components/Garden/PlantDetailModal.css`

**Step 1: Read the current CSS to find `.detail-modal-box` and `.modal-backdrop`**

Use Read tool on `src/components/Garden/PlantDetailModal.css` (whole file).

**Step 2: Replace the `.detail-modal-box` rule**

Override sizing and shape so it fills the viewport. Remove any `max-width`, `max-height`, `border-radius`, centering margins. Add:

```css
.detail-modal-box {
  width: 100vw;
  height: 100dvh;            /* dvh handles iOS Safari address-bar collapse */
  max-width: none;
  max-height: none;
  border-radius: 0;
  margin: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 2rem 1.5rem calc(2rem + env(safe-area-inset-bottom));
}

@media (min-width: 768px) {
  .detail-modal-box {
    padding: 3rem 4rem;
  }
}
```

If existing `.detail-modal-box` rules conflict (e.g., a `max-width: 540px`), delete those declarations rather than letting them fight the new rules.

**Step 3: Pin the close button**

Find `.detail-close` and update:

```css
.detail-close {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 10;
}
```

(If it was `position: absolute` with `top/right` already, switching to `fixed` keeps it visible while the body scrolls.)

**Step 4: Backdrop tweak**

`.modal-backdrop` should stay full-screen but lose its centering padding so the box can fill it edge-to-edge:

```css
.modal-backdrop {
  /* keep existing fixed inset:0 + background — just clear flex centering */
  padding: 0;
  align-items: stretch;
  justify-content: stretch;
}
```

Only change the properties listed — leave background color, z-index, and other existing rules alone.

**Step 5: Verify in browser**

Run: `cd /Users/taylorcornelius/Desktop/garden-app && npm run dev`
Open the URL, sign in, click any plant card from the Garden sidebar or Inventory page.

Expected: modal fills the entire viewport. Close button is visible at top-right while scrolling. No horizontal scrollbar. No content tucked under the bottom nav on mobile (use Chrome DevTools device emulation, iPhone profile).

If anything looks wrong, fix the CSS and re-check before moving on.

**Step 6: Commit**

```bash
cd /Users/taylorcornelius/Desktop/garden-app
git add src/components/Garden/PlantDetailModal.css
git commit -m "feat: convert plant detail modal to full-page layout"
```

---

## Task 3: Modal animation polish

The current modal animates with a small `scale: 0.94` + `y: 16` + opacity. At full-page size that scale-from-tiny effect feels off. Swap to a simpler slide-up + fade.

**Files:**
- Modify: `src/components/Garden/PlantDetailModal.jsx:14-19`

**Step 1: Update the motion props**

Replace:

```jsx
initial={{ opacity: 0, scale: 0.94, y: 16 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
```

With:

```jsx
initial={{ opacity: 0, y: 24 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: 24 }}
transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
```

**Step 2: Verify in browser**

Same dev-server check as Task 2, Step 5. Watch the open animation — should slide up and fade in, no scale jump.

**Step 3: Commit**

```bash
cd /Users/taylorcornelius/Desktop/garden-app
git add src/components/Garden/PlantDetailModal.jsx
git commit -m "feat: tune plant modal animation for full-page layout"
```

---

## Task 4: Shop section JSX

Add the Shop section between care intervals and the bottom action buttons. New imports, new render block, no new state.

**Files:**
- Modify: `src/components/Garden/PlantDetailModal.jsx`

**Step 1: Add imports**

At the top of the file:

```jsx
import { Droplets, FlaskConical, Scissors, Bug, Beaker, Hand, Square, Leaf, Sprout, AlertTriangle, SprayCan, ExternalLink } from 'lucide-react'
import { getRecommendationsForPlant, amazonSearch } from '../../data/productRecommendations.js'
```

Merge with the existing lucide-react import line — don't add a duplicate import statement. Keep `X, Edit2, Trash2, ClipboardList, Wheat, Sprout` from the current import.

**Step 2: Add the icon map (above the component definition)**

```jsx
const SHOP_ICONS = {
  flask:    FlaskConical,
  bug:      Bug,
  droplets: Droplets,
  hand:     Hand,
  scissors: Scissors,
  square:   Square,
  beaker:   Beaker,
  alert:    AlertTriangle,
  leaf:     Leaf,
  spray:    SprayCan,
}
```

**Step 3: Compute recommendations inside the component**

Right after `if (!plant) return null`, add:

```jsx
const recs = getRecommendationsForPlant(plant)
const recsByCategory = recs.reduce((acc, r) => {
  (acc[r.category] ??= []).push(r)
  return acc
}, {})
const categoryOrder = ['Care', 'Tools', 'Problem-solving']
```

**Step 4: Insert the Shop section JSX**

Place this block between `</div>` (end of `.detail-care-intervals`) and `<div className="detail-actions">`:

```jsx
{recs.length > 0 && (
  <section className="detail-shop">
    <div className="detail-shop-header">
      <h3 className="detail-shop-title">Recommended for your {plant.name}</h3>
      <p className="detail-shop-disclaimer">Affiliate links — we may earn a commission</p>
    </div>
    {categoryOrder.map(cat => {
      const list = recsByCategory[cat]
      if (!list?.length) return null
      return (
        <div key={cat} className="detail-shop-group">
          <div className="detail-shop-group-label">{cat}</div>
          <div className="detail-shop-grid">
            {list.map(rec => {
              const Icon = SHOP_ICONS[rec.icon] ?? Sprout
              return (
                <a key={rec.id}
                   className="shop-card"
                   href={amazonSearch(rec.query)}
                   target="_blank"
                   rel="noopener noreferrer sponsored">
                  <Icon size={20} className="shop-card-icon" />
                  <div className="shop-card-body">
                    <div className="shop-card-title">{rec.title}</div>
                    <div className="shop-card-blurb">{rec.blurb}</div>
                  </div>
                  <span className="shop-card-cta">Shop <ExternalLink size={12} /></span>
                </a>
              )
            })}
          </div>
        </div>
      )
    })}
  </section>
)}
```

**Step 5: Lint check**

Run: `cd /Users/taylorcornelius/Desktop/garden-app && npm run lint`
Expected: zero errors. Fix any unused-import warnings (e.g., remove an icon from import if unused).

**Step 6: Smoke check in browser**

Dev server still running from Task 2/3. Open a plant detail modal. Expected:
- Section renders below care intervals.
- "Recommended for your {plant name}" header visible.
- Disclaimer line visible.
- Cards present, grouped by Care / Tools / Problem-solving.
- Clicking a card opens a new tab to Amazon search results for the right query.

Test with at least three plants of different families: a tomato (Solanaceae → should show blossom-end-rot card), a blueberry (Ericaceae → acidic-soil card), and a cucumber (Cucurbitaceae → trellis + powdery-mildew cards).

If any expected card is missing, check the data file from Task 1 against the plant's `id` and `plant_family`.

**Step 7: Commit**

```bash
cd /Users/taylorcornelius/Desktop/garden-app
git add src/components/Garden/PlantDetailModal.jsx
git commit -m "feat: add plant-specific shop section to detail modal"
```

---

## Task 5: Shop section CSS

Style the new shop section. Match the existing modal's earthy palette (cream `#ede7dc`, muted greens, etc.).

**Files:**
- Modify: `src/components/Garden/PlantDetailModal.css`

**Step 1: Append shop styles to the end of the file**

```css
/* ── Shop section ─────────────────────────────────────────────────────────── */

.detail-shop {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(155, 140, 115, 0.25);
}

.detail-shop-header {
  margin-bottom: 1.25rem;
}

.detail-shop-title {
  margin: 0;
  font-family: var(--font-display, serif);
  font-size: 1.15rem;
  color: var(--text, #2a2a2a);
}

.detail-shop-disclaimer {
  margin: 0.25rem 0 0;
  font-size: 0.7rem;
  color: var(--text-muted, #888);
  font-style: italic;
}

.detail-shop-group {
  margin-bottom: 1.25rem;
}

.detail-shop-group-label {
  font-family: var(--font-mono, monospace);
  font-size: 0.65rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text-muted, #888);
  margin-bottom: 0.5rem;
}

.detail-shop-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.65rem;
}

@media (min-width: 600px) {
  .detail-shop-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}

.shop-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  background: rgba(78, 122, 92, 0.08);
  border: 1px solid rgba(155, 140, 115, 0.25);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: background 0.15s ease, transform 0.1s ease;
}

.shop-card:hover {
  background: rgba(78, 122, 92, 0.16);
  transform: translateY(-1px);
}

.shop-card-icon {
  color: rgba(78, 122, 92, 0.85);
  flex-shrink: 0;
}

.shop-card-body {
  min-width: 0;
}

.shop-card-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text, #2a2a2a);
}

.shop-card-blurb {
  font-size: 0.75rem;
  color: var(--text-muted, #888);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shop-card-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(78, 122, 92, 0.9);
  white-space: nowrap;
}
```

**Step 2: Verify in browser**

Reload the dev server tab. Open a plant modal. Expected:
- Cards have rounded corners, subtle green tint, hover lifts them slightly.
- Group labels are uppercase mono.
- Grid wraps to multi-column on desktop, single column on mobile (test with DevTools at 480px).
- Long blurbs ellipsis-clip rather than wrap.

**Step 3: Lint + build**

```bash
cd /Users/taylorcornelius/Desktop/garden-app
npm run lint
npm run build
```

Expected: both succeed. Build output in `dist/`. No console errors during build.

**Step 4: Commit**

```bash
cd /Users/taylorcornelius/Desktop/garden-app
git add src/components/Garden/PlantDetailModal.css
git commit -m "feat: style shop section in plant detail modal"
```

---

## Task 6: Document the env var

Affiliate tag is optional. Document it so a future env setup knows the variable exists.

**Files:**
- Create or modify: `.env.example` at repo root

**Step 1: Check whether `.env.example` exists**

Run: `cd /Users/taylorcornelius/Desktop/garden-app && ls -la .env.example .env* 2>/dev/null`

**Step 2: Add or append the variable**

If `.env.example` exists, append:

```
# Amazon Associates affiliate tag. Optional. Without it, shop links still work
# but earn no commission.
VITE_AMAZON_TAG=
```

If it doesn't exist, create it with the same content. Do NOT touch `.env` or `.env.local` — those are user secrets.

**Step 3: Commit**

```bash
cd /Users/taylorcornelius/Desktop/garden-app
git add .env.example
git commit -m "docs: document VITE_AMAZON_TAG env var for shop affiliate links"
```

---

## Final verification

After all six tasks:

1. `npm run lint` — clean
2. `npm run build` — succeeds
3. `npm run dev` — modal opens full-page on click from Garden sidebar AND from Inventory plant grid
4. Three plants spot-checked: tomato, blueberry, cucumber — each shows the right family-specific card
5. One Shop card click opens Amazon in a new tab with the expected query in the URL
6. `git log --oneline` shows six commits, all on `main`, none pushed

**Do not push.** Project rule: only push when explicitly told.
