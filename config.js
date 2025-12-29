// Configuration - Update these URLs with your published Google Sheet CSVs
const CONFIG = {
  // Demo mode - set to true to use local fallback data instead of Google Sheets
  DEMO_MODE: false,
  
  // Google Sheets URLs (each sheet published separately as CSV)
  // To get these: File → Share → Publish to web → Select sheet → CSV → Publish
  SHEETS: {
    meals: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQOMZXttvPTb5yoC8O6pQ0xrwGcrhXntVh3L-QGV_wOSOifTsD6TMOdMEm85frRpxgrQyDU-hhjWtA2/pub?gid=0&single=true&output=csv',
    inventory: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQOMZXttvPTb5yoC8O6pQ0xrwGcrhXntVh3L-QGV_wOSOifTsD6TMOdMEm85frRpxgrQyDU-hhjWtA2/pub?gid=817174084&single=true&output=csv',
  },

  // Fallback to local files if Google Sheets unavailable
  FALLBACK: {
    meals: 'data/meals.csv',
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
  orange_yellow: 'Orange/Yellow',
  green: 'Green',
  leafy_green: 'Leafy Green',
  blue_purple: 'Blue/Purple',
  white_brown: 'White/Brown'
};

// Produce color categories (for filtering)
const PRODUCE_COLORS = ['red', 'orange_yellow', 'green', 'leafy_green', 'blue_purple', 'white_brown'];

// Meal slots per day
const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner'];
const NUM_DAYS = 7;
