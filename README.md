# 🌈 Family Meal Planner

A simple, static meal planning tool that helps you "eat the rainbow" by tracking phytonutrient color diversity across your weekly meals.

**[Live Demo](https://cdhagmann.com/family-meal-planner/)**

## Features

- 📊 **Rainbow Tracker** - Visual count of color groups in your planned meals
- 🔍 **Smart Filtering** - Filter by meal type, protein, cuisine, or colors you need
- 📱 **Mobile Friendly** - Works on phone, tablet, or desktop
- 💾 **Persistent Plans** - Your weekly plan saves to browser storage
- 📝 **Google Sheets Backend** - Edit meals in a familiar spreadsheet interface
- ⚡ **No Server Required** - Runs entirely on GitHub Pages

## How It Works

1. Meals are stored in a Google Sheet with a `vegetables` column
2. The app fetches the sheet as CSV and calculates rainbow colors automatically
3. Color mapping is defined in `color_mapping.json` (vegetable → color category)
4. Your weekly plan is saved to `localStorage` in your browser

## Forking This Project

### 1. Fork the Repository

Click "Fork" on GitHub to create your own copy.

### 2. Create Your Google Sheet

Create a new Google Sheet with these columns:

| Column | Description | Example |
|--------|-------------|---------|
| `name` | Meal name | `chicken tikka masala` |
| `protein` | Protein type | `chicken`, `beef`, `veg`, `fish` |
| `cuisine` | Cuisine style | `Asian`, `Amer`, `Mexi`, `Ital` |
| `format` | Meal format | `bowl`, `salad`, `sandwich`, `soup` |
| `meal_type` | When to eat | `breakfast`, `lunch`, `dinner` |
| `red_flags` | Warnings (optional) | `two pans`, `lots of chopping` |
| `green_flags` | Positives (optional) | `one pan`, `universal`, `quick` |
| `vegetables` | Comma-separated list | `tomatoes, carrots, spinach, onions` |

You can copy [our template sheet](https://docs.google.com/spreadsheets/d/1u4fWqFhBKxtekeXHjsSH7SQ8zcuoXM4oXWEfw5pt7Qg/edit) as a starting point.

### 3. Publish Your Sheet

1. Open your Google Sheet
2. Go to **File → Share → Publish to web**
3. Select **Entire Document** and **Comma-separated values (.csv)**
4. Click **Publish**
5. Copy the URL (it will look like `https://docs.google.com/spreadsheets/d/e/XXXXX/pub?output=csv`)

### 4. Update the Config

Edit `app.js` and replace the `SHEET_URL` with your published CSV URL:

```javascript
const CONFIG = {
  SHEET_URL: 'https://docs.google.com/spreadsheets/d/e/YOUR-SHEET-ID/pub?output=csv',
  // ...
};
```

### 5. Update the Edit Link

Edit `index.html` and replace the Google Sheet link with yours:

```html
<a href="https://docs.google.com/spreadsheets/d/YOUR-SHEET-ID/edit" target="_blank">Edit Meals</a>
```

### 6. Enable GitHub Pages

1. Go to your forked repo's **Settings → Pages**
2. Under "Source", select **main** branch
3. Click **Save**
4. Your site will be live at `https://YOUR-USERNAME.github.io/family-meal-planner/`

## File Structure

```
family-meal-planner/
├── index.html          # Page structure (edit title, links)
├── styles.css          # All styling (edit colors, layout)
├── app.js              # Config, data loading, state management
├── render.js           # UI rendering functions
├── color_mapping.json  # Vegetable → color category mapping
└── README.md
```

## Customizing Colors

Edit `color_mapping.json` to change which vegetables map to which colors:

```json
{
  "red": ["tomato", "tomatoes", "strawberry", "beet", ...],
  "orange_yellow": ["carrot", "carrots", "pepper", "squash", ...],
  "green": ["cucumber", "celery", "peas", "avocado", ...],
  "leafy_green": ["spinach", "kale", "broccoli", "lettuce", ...],
  "blue_purple": ["eggplant", "olives", "blueberries", ...],
  "white_brown": ["onion", "mushroom", "cauliflower", "potato", ...]
}
```

The app matches these keywords against the `vegetables` column (case-insensitive).

## Tips

- **Sheet changes take 1-5 minutes** to appear (Google's caching)
- **Plan is stored per-browser** - clearing browser data clears your plan
- **Colors are calculated client-side** - just update the vegetables column, no formulas needed

## License

MIT - Feel free to fork and adapt for your family's needs!
