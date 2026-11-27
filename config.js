// Configuration - Update these URLs with your published Google Sheet CSVs
const CONFIG = {
  // Demo mode - set to true to use local fallback data instead of Google Sheets
  DEMO_MODE: true,

  // Google Sheets URLs (each sheet published separately as CSV)
  // To get these: File → Share → Publish to web → Select sheet → CSV → Publish
  SHEETS: {
    meals: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQOMZXttvPTb5yoC8O6pQ0xrwGcrhXntVh3L-QGV_wOSOifTsD6TMOdMEm85frRpxgrQyDU-hhjWtA2/pub?gid=0&single=true&output=csv',
    ingredients: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQOMZXttvPTb5yoC8O6pQ0xrwGcrhXntVh3L-QGV_wOSOifTsD6TMOdMEm85frRpxgrQyDU-hhjWtA2/pub?gid=1942467626&single=true&output=csv',
    inventory: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQOMZXttvPTb5yoC8O6pQ0xrwGcrhXntVh3L-QGV_wOSOifTsD6TMOdMEm85frRpxgrQyDU-hhjWtA2/pub?gid=817174084&single=true&output=csv',
  },

  // Fallback to local files if Google Sheets unavailable
  FALLBACK: {
    meals: 'data/meals.csv',
    ingredients: 'data/ingredients.csv',
    inventory: 'data/inventory.csv',
  },

  // Local storage keys
  STORAGE: {
    weekPlan: 'weekPlan',
    cachedData: 'cachedMealData',
    cacheTimestamp: 'cacheTimestamp',
  },

  // Cache duration (1 hour in milliseconds)
  CACHE_DURATION: 60 * 60 * 1000,
};

// Color display names
const COLOR_NAMES = {
  red: 'Red',
  'orange/yellow': 'Orange/Yellow',
  green: 'Green',
  leafy_green: 'Leafy Green',
  'blue/purple': 'Blue/Purple',
  'white/brown': 'White/Brown'
};

// Produce color categories (for filtering)
const PRODUCE_COLORS = ['red', 'orange/yellow', 'green', 'leafy_green', 'blue/purple', 'white/brown'];

// Meal slots per day
const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner'];
const NUM_DAYS = 7;

// Current season detection
function getCurrentSeason() {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 4) return 'spring';   // Mar-May
  if (month >= 5 && month <= 7) return 'summer';   // Jun-Aug
  if (month >= 8 && month <= 10) return 'fall';    // Sep-Nov
  return 'winter';                                  // Dec-Feb
}

const CURRENT_SEASON = getCurrentSeason();
