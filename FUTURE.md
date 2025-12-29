# Future Enhancements

Ideas and features discussed for future versions of the Family Meal Planner.

---

## High Priority (Pain Points)

### Xander's 2-Meal Buffer Rule
- Track when meals were last served
- Warn or filter out meals that violate the "no repeat within 2 meals" rule
- "Same thing" = exact dish (chicken soup → chicken tacos is fine)

### Snack Slots
- Add snack planning to the weekly grid
- Sara's existing snack system: carb + protein/fat + fiber
- Reference: `mix and match snacks` sheet in MEALS_MASTER_LIST.xlsx

### Daily Protein/Carb Variety Targets
- Similar to rainbow tracker but for proteins and carbs
- Ensure variety across the week (not just presence)
- Sara's template already forces 7 different proteins - codify this

### Price Tracking & Budget
- $175/week grocery budget
- Track estimated cost per meal
- Show running total for weekly plan
- Alert when approaching/exceeding budget

---

## Medium Priority (Quality of Life)

### Leftover Stacking Support
- Mark meals that produce usable leftovers
- Suggest meals that use those leftovers
- Example: Roast chicken Day 1 → Chicken tortilla soup Day 2
- Track "transformation" relationships between meals

### Complexity Indicators
- Lunch = more involved, Dinner = quick and easy (Sara's preference)
- Filter by red_flags: "two pans", "lots of chopping", "needs side"
- Filter by green_flags: "one pan", "pantry staples", "microwave"
- Auto-suggest based on meal slot (complex lunches, simple dinners)

### "Teach Xander" Meals
- Sara's spreadsheet has a "teach X how to make" column
- Surface these meals with a special indicator
- Track progress on teaching

### Smart Suggestions
- "You haven't made this in a while" surfacing
- "This uses ingredients you already have" prioritization
- "This fills your missing colors" highlighting (partially done)

### Recipe Links
- Add URL field to meals
- One-click to open recipe
- Some meals in Sara's data already have Budget Bytes links

---

## Lower Priority (Nice to Have)

### Seasonal Ingredients
- Sara's staples sheet has "(FA, WI)" annotations (Fall, Winter)
- Filter produce by current season
- Suggest seasonal swaps

### Dice-Based Generator (Improved)
- Sara tried this but got frustrated with nonsensical results
- Constrained randomness: "surprise me" that makes sense
- Respect protein variety, cuisine pairings, and complexity rules
- No "Chinese protein powder" situations

### Spice Level Tracking
- Xander has lower spice tolerance
- Track which meals need spice mitigation
- Suggest accompaniments (yogurt, raita, sour cream)

### Meal Prep Batching
- Identify meals that can share prep work
- "If you're chopping onions for X, also prep Y"
- Batch cooking suggestions

### Shopping List Enhancements
- Group by store section (produce, dairy, meat, etc.)
- Checkable items
- Quantity aggregation across meals
- Export to notes/reminders app

### Multi-Week Planning
- Plan 2-4 weeks at a time
- Better variety tracking across longer periods
- Meal rotation to avoid repeats

### Family Preferences Profile
- Track individual family member preferences
- "Chris doesn't do mayo or tuna"
- Surface meals everyone likes

### Print/Export View
- Printable weekly meal plan
- Fridge-friendly format
- Shopping list print view

---

## Technical Improvements

### Re-enable Caching
- Disabled during development due to cache invalidation issues
- Add proper cache versioning
- Validate cached data structure matches current schema
- "Last updated" indicator

### Offline Support
- Service worker for true offline use
- Queue changes when offline, sync when online

### Mobile Optimization
- Touch-friendly interactions
- Swipe gestures for day navigation
- Better responsive layout for phone screens

### Data Validation
- Warn about meals with missing ingredients
- Highlight unrecognized ingredients
- Ingredient autocomplete in Google Sheets

---

## Data from Sara's Spreadsheets Not Yet Used

### From MEALS_MASTER_LIST.xlsx
- `teach X how to make` column - which meals to teach Xander
- Full carb matrix (bread, pasta, rice, tortilla, potato, oats columns)
- `staples` sheet - regular grocery items by category
- `dietician notes` sheet - health context

### From vegetarian_meal_plan.xlsx
- `meal planning dice table` - her randomization system
- `inventory worksheet` - fresh vs frozen tracking
- `mealsproduce matches` - detailed produce pairing by cuisine
- `produce color` - 67-item color mapping (partially incorporated)

---

## Original Requirements Recap

From initial conversation:
- Family of 3 (Chris WFH, Sara, Xander home by 1:30)
- Rainbow diet for nutrition (6 color groups)
- Sensory issues limiting acceptable foods
- Xander's 2-meal gap rule for repeats
- Sara's energy lowest at dinner → complex lunches, simple dinners
- $175/week budget
- Friday planning, Saturday shopping
- Goal: Reduce 2.5 hour Friday planning session

---

*Last updated: December 2025*
