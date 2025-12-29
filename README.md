# Family Meal Planner

A lightweight meal planning app with rainbow nutrition tracking, inventory management, and automatic grocery list generation. Built for GitHub Pages with Google Sheets as the backend.

## Features

- **7-Day Planning Grid** - Plan breakfast, lunch, and dinner for each day
- **Rainbow Diet Tracking** - Track 6 produce color categories per day
- **Inventory Sidebar** - See what's in your fridge, freezer, pantry, and counter
- **Expiring Items Alert** - Filter meals that use ingredients expiring soon
- **Automatic Grocery List** - Calculates what to buy based on planned meals minus inventory
- **Smart Filtering** - Filter by meal type, protein, cuisine, and needed colors

## How It Works

The app uses just **2 Google Sheets**:

1. **Meals** - Recipes with a comma-separated ingredients list
2. **Inventory** - Ingredients with category, location, quantity, and expiring status

Colors, proteins, and carbs are derived from ingredient categories in the Inventory sheet.

## Setup for Forking

### 1. Create a Google Sheet with 2 Tabs

**Tab 1: Meals**
| name | cuisine | format | meal_type | red_flags | green_flags | ingredients |
|------|---------|--------|-----------|-----------|-------------|-------------|
| chicken tikka masala | Asian | bowl | dinner | two pans | | tomato, chicken, rice, spinach, onion |

**Tab 2: Inventory**
| name | category | location | quantity | expires_soon |
|------|----------|----------|----------|--------------|
| tomato | red | fridge | 3 | FALSE |
| chicken | protein | freezer | 2 | FALSE |
| spinach | leafy_green | fridge | 1 | TRUE |

**Categories:** `red`, `orange_yellow`, `green`, `leafy_green`, `blue_purple`, `white_brown`, `protein`, `carb`, `dairy`, `pantry`

**Locations:** `fridge`, `freezer`, `pantry`, `counter`

### Pro Tip: Multi-Select Dropdown for Ingredients

In Google Sheets, you can create a dropdown that references the Inventory names:
1. Select the `ingredients` column in Meals
2. Data → Data validation → Add rule
3. Criteria: Dropdown (from a range) → Select `Inventory!A:A`
4. Check "Allow multiple selections"

This makes adding/editing meal ingredients much easier!

### 2. Publish Each Sheet as CSV

For each tab:
1. File → Share → Publish to web
2. Select the specific sheet tab
3. Choose "Comma-separated values (.csv)"
4. Click Publish
5. Copy the URL (note the `gid=` parameter differs per sheet)

### 3. Update config.js

Replace the placeholder URLs:

```javascript
SHEETS: {
  meals: 'https://docs.google.com/.../pub?gid=0&single=true&output=csv',
  inventory: 'https://docs.google.com/.../pub?gid=123456&single=true&output=csv',
}
```

### 4. Enable GitHub Pages

1. Repo Settings → Pages
2. Source: "Deploy from a branch"
3. Branch: "main", folder: "/ (root)"

## File Structure

```
family-meal-planner/
├── index.html        # HTML shell
├── config.js         # Sheet URLs and settings
├── app.js            # State, data loading, calculations
├── render.js         # UI rendering
├── styles.css        # Three-column layout
├── data/             # Fallback CSV files
│   ├── meals.csv
│   └── inventory.csv
└── README.md
```

## Usage Tips

- **Click a meal slot** to start adding meals
- **Rainbow dots** show which colors are covered per day
- **Expiring items** appear at the top of inventory
- **Refresh button** (↻) fetches latest from Google Sheets
- Week plan is stored in browser localStorage

## Customization

### Adding New Ingredients

Add one row to Inventory with name, category, location, quantity=0, expires_soon=FALSE

### Adding New Meals

Add one row to Meals with the recipe info and comma-separated ingredients

## Future Enhancements

- [ ] Daily target tracking (protein/carb variety)
- [ ] Snack slots
- [ ] Xander's 2-meal buffer tracking
- [ ] Price tracking for budget
