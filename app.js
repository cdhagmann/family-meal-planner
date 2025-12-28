// Configuration
const CONFIG = {
  SHEET_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSI1SbacmBCYeZLc717wSxtvJ9MgirIp97I58FGtX3V3YHQ1gnZhyUvp7c3PMvhXaUv6J73LW8spsDi/pub?output=csv',
  COLOR_MAPPING_URL: 'color_mapping.json',
  STORAGE_KEY: 'plannedMeals'
};

const COLOR_NAMES = {
  red: 'Red',
  orange_yellow: 'Orange/Yellow', 
  green: 'Green',
  leafy_green: 'Leafy Green',
  blue_purple: 'Blue/Purple',
  white_brown: 'White/Brown'
};

// App state
let colorMapping = {};
let meals = [];
let plannedMeals = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');
let filters = {
  mealType: 'all',
  proteins: [],
  cuisines: [],
  colorsNeeded: []
};

// ============ Data Loading ============

async function loadColorMapping() {
  try {
    const response = await fetch(CONFIG.COLOR_MAPPING_URL);
    colorMapping = await response.json();
    console.log('Color mapping loaded');
  } catch (error) {
    console.error('Failed to load color mapping, using defaults:', error);
    colorMapping = getDefaultColorMapping();
  }
}

function getDefaultColorMapping() {
  return {
    red: ['tomato', 'tomatoes', 'red pepper'],
    orange_yellow: ['carrot', 'carrots', 'pepper', 'peppers', 'squash', 'corn'],
    green: ['cucumber', 'celery', 'cabbage', 'green beans', 'green_beans', 'peas', 'avocado', 'zucchini'],
    leafy_green: ['lettuce', 'kale', 'spinach', 'broccoli', 'brussels'],
    blue_purple: ['olive', 'olives', 'eggplant', 'blueberries', 'grapes', 'raisins'],
    white_brown: ['cauliflower', 'mushroom', 'mushrooms', 'onion', 'onions', 'garlic', 'potato', 'potatoes']
  };
}

async function loadMeals() {
  try {
    const response = await fetch(CONFIG.SHEET_URL);
    const csvText = await response.text();
    
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        meals = results.data
          .map(row => parseMealRow(row))
          .filter(m => m.name);
        
        // Recalculate colors for planned meals
        plannedMeals = plannedMeals.map(pm => ({
          ...pm,
          colors: calculateColors(pm.vegetables || '')
        }));
        savePlan();
        
        console.log(`Loaded ${meals.length} meals`);
        render();
      },
      error: function(error) {
        showError('Failed to parse meal data: ' + error.message);
      }
    });
  } catch (error) {
    showError('Failed to load meals: ' + error.message);
  }
}

function parseMealRow(row) {
  const vegetables = row.vegetables || '';
  return {
    name: row.name || '',
    protein: row.protein || 'unknown',
    cuisine: row.cuisine || 'unknown',
    format: row.format || 'unknown',
    meal_type: row.meal_type || 'unknown',
    red_flags: row.red_flags || '',
    green_flags: row.green_flags || '',
    vegetables: vegetables,
    colors: calculateColors(vegetables)
  };
}

// ============ Color Calculation ============

function calculateColors(vegetablesStr) {
  const colors = {
    red: false,
    orange_yellow: false,
    green: false,
    leafy_green: false,
    blue_purple: false,
    white_brown: false
  };
  
  if (!vegetablesStr) return colors;
  
  const veggiesLower = vegetablesStr.toLowerCase();
  
  for (const [color, keywords] of Object.entries(colorMapping)) {
    for (const keyword of keywords) {
      if (veggiesLower.includes(keyword.toLowerCase())) {
        colors[color] = true;
        break;
      }
    }
  }
  
  return colors;
}

function getColorCounts() {
  const counts = { red: 0, orange_yellow: 0, green: 0, leafy_green: 0, blue_purple: 0, white_brown: 0 };
  plannedMeals.forEach(meal => {
    Object.keys(counts).forEach(color => {
      if (meal.colors && meal.colors[color]) counts[color]++;
    });
  });
  return counts;
}

// ============ Filtering ============

function getUniqueValues(key) {
  return [...new Set(meals.map(m => m[key]).filter(v => v && v !== 'unknown'))].sort();
}

function getFilteredMeals() {
  return meals.filter(meal => {
    if (filters.mealType !== 'all' && meal.meal_type !== filters.mealType) return false;
    if (filters.proteins.length > 0 && !filters.proteins.includes(meal.protein)) return false;
    if (filters.cuisines.length > 0 && !filters.cuisines.includes(meal.cuisine)) return false;
    if (filters.colorsNeeded.length > 0) {
      const hasNeededColor = filters.colorsNeeded.some(color => meal.colors[color]);
      if (!hasNeededColor) return false;
    }
    return true;
  });
}

function sortMeals(filteredMeals) {
  if (filters.colorsNeeded.length === 0) return filteredMeals;
  return [...filteredMeals].sort((a, b) => {
    const aScore = filters.colorsNeeded.filter(c => a.colors[c]).length;
    const bScore = filters.colorsNeeded.filter(c => b.colors[c]).length;
    return bScore - aScore;
  });
}

// ============ User Actions ============

function toggleFilter(type, value) {
  const arr = filters[type];
  const idx = arr.indexOf(value);
  if (idx === -1) arr.push(value);
  else arr.splice(idx, 1);
  render();
}

function setMealType(type) {
  filters.mealType = type;
  render();
}

function addMeal(meal) {
  if (!plannedMeals.find(m => m.name === meal.name)) {
    plannedMeals.push(meal);
    savePlan();
    render();
  }
}

function removeMeal(index) {
  plannedMeals.splice(index, 1);
  savePlan();
  render();
}

function clearPlan() {
  if (confirm('Clear all planned meals?')) {
    plannedMeals = [];
    savePlan();
    render();
  }
}

function clearFilters() {
  filters = { mealType: 'all', proteins: [], cuisines: [], colorsNeeded: [] };
  render();
}

function savePlan() {
  localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(plannedMeals));
}

// ============ Error Handling ============

function showError(message) {
  document.getElementById('app').innerHTML = `
    <div class="error">
      <p>${message}</p>
      <p style="margin-top: 10px; font-size: 14px;">Make sure the Google Sheet is published to web.</p>
    </div>
  `;
}

// ============ Initialize ============

async function init() {
  await loadColorMapping();
  await loadMeals();
}

init();
