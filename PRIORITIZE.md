# Feature Prioritization List

Sara, please rank these features by importance. You can use:
- **1-5 scale** (1 = must have for next version, 5 = nice to have someday)
- Or sort them into tiers: **MVP v2** / **Soon** / **Later** / **Maybe Never**

---

## Data & Schema Changes

| # | Feature | Description | Your Priority |
|---|---------|-------------|---------------|
| 1 | **Split ingredients/inventory CSVs** | Separate reference data (ingredients.csv) from stock tracking (inventory.csv). Allows fresh/frozen/canned as separate inventory rows. | |
| 2 | **Multi-category ingredients** | Corn counts as both orange/yellow produce AND tortilla carb. Scan all matching rows by name. | |
| 3 | **New ingredient columns** | Add: season, format, min_usage. Remove sour cream (always yogurt). Fix garlic/lemon/lime locations. | |
| 4 | **Spoon count on meals** | Add 1-10 effort rating to meals.csv for sorting/filtering. | |
| 5 | **Equipment per meal** | Add equipment column to meals.csv (e.g., "skillet, pot, sheet pan"). | |
| 6 | **Meal history tab** | New Google Sheet tab storing last 84 meals. Export rotates this on finalize. | |
| 7 | **Consolidate red_flags** | Clean up "needs side" / "needs veg" / "needs side and veg" into consistent categories. | |
| 8 | **Cuisine hierarchy** | Update cuisines to: Amer: general, Amer: Southern, Asian: East Asian, Asian: Indian, Asian: Thai, Medit: Greek, Medit: Italian, Medit: Mid East, Mexican/Tex-Mex, Other: African, Other: Carib, Other: French, Other: German, Other: S Amer, Amer: Native | |

---

## Tracking & Nutrition Goals

| # | Feature | Description | Your Priority |
|---|---------|-------------|---------------|
| 9 | **Daily nutrition tracker** | Show progress toward: 6 protein, 6 carb, 6 colors (1 each), 3 dairy, 1 nut per day. Emoji checkmarks when hit. | |
| 10 | **Track dairy category** | Add dairy tracking alongside protein/produce/carb. | |
| 11 | **Track nuts category** | Add nut tracking alongside protein/produce/carb. | |
| 12 | **Carb sub-category tracking** | Track bread/noodle/rice/tortilla/potato variety (max 3 per week each). | |
| 13 | **Protein sub-category tracking** | Track meat/fish/egg/bean/tofu variety (max 2 per week each). | |

---

## Filtering & Sorting

| # | Feature | Description | Your Priority |
|---|---------|-------------|---------------|
| 14 | **Sort meals** | Sort by: alphabetical, spoon count, or other criteria. | |
| 15 | **Protein filter grouping** | Group as: Meat (beef/pork/chicken/etc), Fish (salmon/tuna/etc), Eggs, then enumerate plant proteins (beans, chickpeas, lentils, tofu). | |
| 16 | **Auto-exclude used proteins** | After 2 uses of a protein sub-category, auto-add exclude filter (can be toggled off). | |
| 17 | **Auto-exclude used carbs** | After 3 uses of a carb sub-category, auto-add exclude filter (can be toggled off). | |
| 18 | **Include filters auto-clear** | After adding a meal to plan, include filters reset. Exclude filters persist. | |
| 19 | **Search meals** | Search by meal name (and optionally ingredients). | |
| 20 | **Pagination or table view** | Handle growing meal list (116+ meals) with pagination or alternate table view. | |
| 21 | **Season-aware filtering** | Prioritize in-season produce. Current season detected automatically. | |

---

## Produce & Ingredients

| # | Feature | Description | Your Priority |
|---|---------|-------------|---------------|
| 22 | **Show vegetable names** | Display actual veggie names recommended for meal, not just colors. | |
| 23 | **Toggleable produce per meal** | Checkboxes to select which produce you're actually using (solves the "oatmeal with ANY fruit" problem). Selected items count toward tracker and grocery list. | |
| 24 | **Minimum usage warnings** | Banner when an ingredient needs more uses to avoid waste (e.g., "Green beans need 1 more use"). Click to filter meals using it. | |
| 25 | **Format priority** | When using ingredients, prioritize: fresh (if in season) > frozen > canned. | |

---

## Week Plan UI

| # | Feature | Description | Your Priority |
|---|---------|-------------|---------------|
| 26 | **Gray out recent meals** | Meals in 84-meal history appear grayed out (still selectable). | |
| 27 | **Bigger X button** | Larger remove button on meals in week plan for easier clicking. | |
| 28 | **Drag and drop meals** | Move meals between slots by dragging. | |
| 29 | **"Out" as a meal** | Placeholder option for eating out (skip tracking for that slot). | |
| 30 | **Equipment view by day** | Show consolidated "equipment needed tomorrow" so you can clean the night before. | |

---

## Breakfast/Lunch/Dinner Logic

| # | Feature | Description | Your Priority |
|---|---------|-------------|---------------|
| 31 | **Breakfast meals in all tabs** | Breakfast-tagged meals can appear in lunch/dinner tabs (labeled as breakfast). Lunch/dinner meals don't appear in breakfast tab. | |
| 32 | **Blur lunch/dinner distinction** | Once spoon counts exist, lunch vs dinner becomes about effort level rather than hard categories. | |

---

## Visual & UI Polish

| # | Feature | Description | Your Priority |
|---|---------|-------------|---------------|
| 33 | **Graphical protein filters** | Icons for protein types (Sara to create graphics). | |
| 34 | **Graphical cuisine filters** | Flags or icons for cuisines (Sara to create graphics). | |
| 35 | **Protein-cuisine pairings** | Pre-sorted day suggestions like "Taco Tuesday" to reduce mental load. | |

---

## Export & Finalization

| # | Feature | Description | Your Priority |
|---|---------|-------------|---------------|
| 36 | **Export with history rotation** | On finalize, download CSV that drops oldest 21 meals and adds current week's 21. Sara uploads to history tab. | |
| 37 | **Leftover flagging** | Toggle to flag an ingredient for reuse later in week. Warning if all slots filled but flagged ingredient unused. | |
| 38 | **Finalization warnings** | Before export, warn about: unused min_usage ingredients, flagged leftovers not used, etc. | |

---

## Future / Complex Features

| # | Feature | Description | Your Priority |
|---|---------|-------------|---------------|
| 39 | **Placeholder meal builder** | 3 dropdowns to build a custom meal (protein + carb + produce). | |
| 40 | **Component-based meals** | Separate meal components for more flexibility. Add exclude lists and enforced limits. | |
| 41 | **Restaurant tracking for "Out"** | Store go-to restaurants and suggest orders based on missing colors. | |

---

## Already Done (for reference)

- ✅ Rainbow color tracking (6 colors)
- ✅ Week plan grid with drag-to-slot
- ✅ Inventory sidebar with expiring items
- ✅ Grocery list generation
- ✅ Filter by protein/cuisine
- ✅ Filter by expiring ingredients
- ✅ Clickable inventory items as filters
- ✅ Demo mode toggle
- ✅ Strikethrough for fully-used inventory items
- ✅ Filter count badges

---

## Notes

- Current meal count: 116 (will grow with oatmeal variants, etc.)
- Budget: $175/week (not currently tracked in app)
- Family: 3 people, sensory considerations, Xander's 2-meal buffer rule
- Planning happens Friday night, shopping Saturday

---

*Please mark your priorities and return this list!*
