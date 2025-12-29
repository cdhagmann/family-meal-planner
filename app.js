// ============ App State ============
let meals = [];
let inventory = {};  // Map: ingredient -> {category, location, quantity, expires_soon}
let weekPlan = loadWeekPlan();
let selectedSlot = null;
let filters = {
  mealType: 'all',
  proteins: [],
  cuisines: [],
  colorsNeeded: [],
  expiringOnly: false,
};

// ============ Week Plan Management ============

function createEmptyWeekPlan() {
  const plan = [];
  for (let day = 0; day < NUM_DAYS; day++) {
    plan.push({ breakfast: null, lunch: null, dinner: null });
  }
  return plan;
}

function loadWeekPlan() {
  try {
    const saved = localStorage.getItem(CONFIG.STORAGE.weekPlan);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === NUM_DAYS) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load week plan:', e);
  }
  return createEmptyWeekPlan();
}

function saveWeekPlan() {
  localStorage.setItem(CONFIG.STORAGE.weekPlan, JSON.stringify(weekPlan));
}

// ============ Data Loading ============

async function fetchCSV(url, fallbackUrl) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } catch (error) {
    console.warn(`Failed to fetch ${url}, trying fallback...`);
    try {
      const fallbackResponse = await fetch(fallbackUrl);
      if (!fallbackResponse.ok) throw new Error(`Fallback HTTP ${fallbackResponse.status}`);
      return await fallbackResponse.text();
    } catch (fallbackError) {
      console.error(`Fallback also failed for ${fallbackUrl}`);
      throw fallbackError;
    }
  }
}

async function loadAllData(forceRefresh = false) {
  // Caching disabled for now - always fetch fresh
  try {
    document.getElementById('app').innerHTML = '<div class="loading">Loading data...</div>';
    
    // Fetch both CSVs in parallel
    const [mealsCSV, inventoryCSV] = await Promise.all([
      fetchCSV(CONFIG.SHEETS.meals, CONFIG.FALLBACK.meals),
      fetchCSV(CONFIG.SHEETS.inventory, CONFIG.FALLBACK.inventory),
    ]);

    // Parse meals (now includes ingredients column)
    Papa.parse(mealsCSV, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        meals = results.data
          .filter(row => row.name && row.name.trim())
          .map(row => ({
            name: row.name.trim(),
            cuisine: row.cuisine || '',
            format: row.format || '',
            meal_type: row.meal_type || '',
            red_flags: row.red_flags || '',
            green_flags: row.green_flags || '',
            // Parse comma-separated ingredients into array
            ingredients: parseIngredients(row.ingredients || '')
          }));
      }
    });

    // Parse inventory
    Papa.parse(inventoryCSV, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        inventory = {};
        results.data.forEach(row => {
          if (row.name) {
            inventory[row.name.trim().toLowerCase()] = {
              category: row.category || 'pantry',
              location: row.location || 'pantry',
              quantity: parseInt(row.quantity) || 0,
              expires_soon: row.expires_soon === 'TRUE' || row.expires_soon === 'true'
            };
          }
        });
      }
    });

    // Save to cache
    saveToCache();
    
    console.log(`Loaded: ${meals.length} meals, ${Object.keys(inventory).length} inventory items`);
    render();
    
  } catch (error) {
    showError('Failed to load data: ' + error.message);
  }
}

function parseIngredients(ingredientsStr) {
  if (!ingredientsStr) return [];
  return ingredientsStr
    .split(',')
    .map(i => i.trim().toLowerCase())
    .filter(i => i.length > 0);
}

// Cache version - increment when data structure changes
const CACHE_VERSION = 2;

function saveToCache() {
  const data = { 
    version: CACHE_VERSION,
    meals, 
    inventory 
  };
  localStorage.setItem(CONFIG.STORAGE.cachedData, JSON.stringify(data));
  localStorage.setItem(CONFIG.STORAGE.cacheTimestamp, Date.now().toString());
}

function loadFromCache() {
  try {
    const timestamp = localStorage.getItem(CONFIG.STORAGE.cacheTimestamp);
    if (!timestamp) return null;
    
    const age = Date.now() - parseInt(timestamp);
    if (age > CONFIG.CACHE_DURATION) {
      console.log('Cache expired');
      return null;
    }
    
    const dataStr = localStorage.getItem(CONFIG.STORAGE.cachedData);
    if (!dataStr) return null;
    
    const data = JSON.parse(dataStr);
    
    // Validate cache version
    if (data.version !== CACHE_VERSION) {
      console.log('Cache version mismatch, invalidating');
      clearCache();
      return null;
    }
    
    // Validate data structure
    if (!Array.isArray(data.meals) || data.meals.length === 0) {
      console.log('Invalid cache: meals missing or empty');
      clearCache();
      return null;
    }
    
    // Check that meals have ingredients array (new structure)
    if (!data.meals[0].hasOwnProperty('ingredients')) {
      console.log('Invalid cache: old data structure detected');
      clearCache();
      return null;
    }
    
    if (typeof data.inventory !== 'object') {
      console.log('Invalid cache: inventory missing');
      clearCache();
      return null;
    }
    
    return data;
  } catch (e) {
    console.error('Cache load error:', e);
    clearCache();
    return null;
  }
}

function clearCache() {
  localStorage.removeItem(CONFIG.STORAGE.cachedData);
  localStorage.removeItem(CONFIG.STORAGE.cacheTimestamp);
}

function refreshData() {
  clearCache();
  loadAllData(true);
}

// ============ Ingredient & Meal Calculations ============

function getMealIngredients(mealName) {
  const meal = meals.find(m => m.name === mealName);
  return meal ? meal.ingredients : [];
}

function getIngredientInfo(ingredientName) {
  return inventory[ingredientName.toLowerCase()] || { category: 'pantry', location: 'pantry', quantity: 0, expires_soon: false };
}

function getMealColors(mealName) {
  const colors = {
    red: false,
    orange_yellow: false,
    green: false,
    leafy_green: false,
    blue_purple: false,
    white_brown: false
  };
  
  const ings = getMealIngredients(mealName);
  ings.forEach(ing => {
    const info = getIngredientInfo(ing);
    if (PRODUCE_COLORS.includes(info.category)) {
      colors[info.category] = true;
    }
  });
  
  return colors;
}

function getMealProteins(mealName) {
  const ings = getMealIngredients(mealName);
  const proteins = [];
  ings.forEach(ing => {
    const info = getIngredientInfo(ing);
    if (info.category === 'protein' && ing !== 'vegetarian') {
      proteins.push(ing);
    }
  });
  return proteins;
}

function getMealCarbs(mealName) {
  const ings = getMealIngredients(mealName);
  const carbs = [];
  ings.forEach(ing => {
    const info = getIngredientInfo(ing);
    if (info.category === 'carb') {
      carbs.push(ing);
    }
  });
  return carbs;
}

function hasExpiringIngredients(mealName) {
  const ings = getMealIngredients(mealName);
  return ings.some(ing => {
    const info = getIngredientInfo(ing);
    return info.expires_soon && info.quantity > 0;
  });
}

// ============ Color Counting ============

function getColorCountsForDay(dayIndex) {
  const counts = { red: 0, orange_yellow: 0, green: 0, leafy_green: 0, blue_purple: 0, white_brown: 0 };
  const day = weekPlan[dayIndex];
  
  MEAL_SLOTS.forEach(slot => {
    const meal = day[slot];
    if (meal) {
      const colors = getMealColors(meal.name);
      Object.keys(counts).forEach(color => {
        if (colors[color]) counts[color]++;
      });
    }
  });
  
  return counts;
}

function getColorCountsForWeek() {
  const counts = { red: 0, orange_yellow: 0, green: 0, leafy_green: 0, blue_purple: 0, white_brown: 0 };
  
  weekPlan.forEach((day, dayIndex) => {
    const dayCounts = getColorCountsForDay(dayIndex);
    Object.keys(counts).forEach(color => {
      counts[color] += dayCounts[color];
    });
  });
  
  return counts;
}

function getMissingColorsForDay(dayIndex) {
  const counts = getColorCountsForDay(dayIndex);
  return Object.entries(counts)
    .filter(([_, count]) => count === 0)
    .map(([color]) => color);
}

// ============ Grocery List Calculation ============

function calculateGroceryList() {
  // Count ingredients needed for all planned meals
  const needed = {};
  
  weekPlan.forEach(day => {
    MEAL_SLOTS.forEach(slot => {
      const meal = day[slot];
      if (meal) {
        const ings = getMealIngredients(meal.name);
        ings.forEach(ing => {
          // Skip vegetarian placeholder
          if (ing === 'vegetarian') return;
          needed[ing] = (needed[ing] || 0) + 1;
        });
      }
    });
  });
  
  // Subtract inventory
  const grocery = {};
  Object.entries(needed).forEach(([ing, count]) => {
    const info = getIngredientInfo(ing);
    const onHand = info.quantity || 0;
    const toBuy = count - onHand;
    if (toBuy > 0) {
      grocery[ing] = toBuy;
    }
  });
  
  return grocery;
}

// ============ Filtering ============

function getUniqueProteins() {
  const proteins = new Set();
  meals.forEach(meal => {
    getMealProteins(meal.name).forEach(p => proteins.add(p));
  });
  return [...proteins].sort();
}

function getUniqueCuisines() {
  const cuisines = new Set();
  meals.forEach(meal => {
    if (meal.cuisine && meal.cuisine !== 'unknown') {
      cuisines.add(meal.cuisine);
    }
  });
  return [...cuisines].sort();
}

function getFilteredMeals() {
  return meals.filter(meal => {
    // Meal type filter
    if (filters.mealType !== 'all' && meal.meal_type !== filters.mealType) return false;
    
    // Protein filter
    if (filters.proteins.length > 0) {
      const mealProteins = getMealProteins(meal.name);
      if (!filters.proteins.some(p => mealProteins.includes(p))) return false;
    }
    
    // Cuisine filter
    if (filters.cuisines.length > 0 && !filters.cuisines.includes(meal.cuisine)) return false;
    
    // Color filter
    if (filters.colorsNeeded.length > 0) {
      const colors = getMealColors(meal.name);
      if (!filters.colorsNeeded.some(c => colors[c])) return false;
    }
    
    // Expiring ingredients filter
    if (filters.expiringOnly && !hasExpiringIngredients(meal.name)) return false;
    
    return true;
  });
}

function sortMeals(filteredMeals) {
  return [...filteredMeals].sort((a, b) => {
    // Prioritize meals with expiring ingredients
    const aExpiring = hasExpiringIngredients(a.name);
    const bExpiring = hasExpiringIngredients(b.name);
    if (aExpiring && !bExpiring) return -1;
    if (!aExpiring && bExpiring) return 1;
    
    // Then by color match count if filtering by colors
    if (filters.colorsNeeded.length > 0) {
      const aColors = getMealColors(a.name);
      const bColors = getMealColors(b.name);
      const aScore = filters.colorsNeeded.filter(c => aColors[c]).length;
      const bScore = filters.colorsNeeded.filter(c => bColors[c]).length;
      if (bScore !== aScore) return bScore - aScore;
    }
    
    return 0;
  });
}

// ============ Inventory Helpers ============

function getInventoryByLocation() {
  const byLocation = {
    fridge: [],
    freezer: [],
    pantry: [],
    counter: []
  };
  
  Object.entries(inventory).forEach(([name, data]) => {
    if (data.quantity > 0 && data.location !== 'SKIP') {
      const location = data.location || 'pantry';
      if (byLocation[location]) {
        byLocation[location].push({
          name,
          quantity: data.quantity,
          expires_soon: data.expires_soon,
          category: data.category
        });
      }
    }
  });
  
  // Sort each location: expiring first, then alphabetically
  Object.keys(byLocation).forEach(loc => {
    byLocation[loc].sort((a, b) => {
      if (a.expires_soon && !b.expires_soon) return -1;
      if (!a.expires_soon && b.expires_soon) return 1;
      return a.name.localeCompare(b.name);
    });
  });
  
  return byLocation;
}

function getExpiringItems() {
  return Object.entries(inventory)
    .filter(([name, data]) => data.expires_soon && data.quantity > 0 && data.location !== 'SKIP')
    .map(([name, data]) => ({ name, quantity: data.quantity }));
}

// ============ User Actions ============

function toggleFilter(type, value) {
  if (type === 'expiringOnly') {
    filters.expiringOnly = !filters.expiringOnly;
  } else {
    const arr = filters[type];
    const idx = arr.indexOf(value);
    if (idx === -1) arr.push(value);
    else arr.splice(idx, 1);
  }
  render();
}

function setMealType(type) {
  filters.mealType = type;
  render();
}

function selectSlot(day, slot) {
  if (selectedSlot && selectedSlot.day === day && selectedSlot.slot === slot) {
    selectedSlot = null;
  } else {
    selectedSlot = { day, slot };
    filters.mealType = slot;
    filters.colorsNeeded = getMissingColorsForDay(day);
  }
  render();
}

function addMealToSlot(meal) {
  if (selectedSlot) {
    weekPlan[selectedSlot.day][selectedSlot.slot] = meal;
    saveWeekPlan();
    
    const nextSlot = findNextEmptySlot(selectedSlot.day, selectedSlot.slot);
    selectedSlot = nextSlot;
    if (nextSlot) {
      filters.mealType = nextSlot.slot;
      filters.colorsNeeded = getMissingColorsForDay(nextSlot.day);
    }
    render();
  }
}

function findNextEmptySlot(startDay, startSlot) {
  const slotIndex = MEAL_SLOTS.indexOf(startSlot);
  
  for (let s = slotIndex + 1; s < MEAL_SLOTS.length; s++) {
    if (!weekPlan[startDay][MEAL_SLOTS[s]]) {
      return { day: startDay, slot: MEAL_SLOTS[s] };
    }
  }
  
  for (let d = startDay + 1; d < NUM_DAYS; d++) {
    for (let s = 0; s < MEAL_SLOTS.length; s++) {
      if (!weekPlan[d][MEAL_SLOTS[s]]) {
        return { day: d, slot: MEAL_SLOTS[s] };
      }
    }
  }
  
  return null;
}

function removeMealFromSlot(day, slot) {
  weekPlan[day][slot] = null;
  saveWeekPlan();
  render();
}

function clearDay(day) {
  weekPlan[day] = { breakfast: null, lunch: null, dinner: null };
  saveWeekPlan();
  render();
}

function clearWeek() {
  if (confirm('Clear all meals for the week?')) {
    weekPlan = createEmptyWeekPlan();
    selectedSlot = null;
    saveWeekPlan();
    render();
  }
}

function clearFilters() {
  filters = { mealType: 'all', proteins: [], cuisines: [], colorsNeeded: [], expiringOnly: false };
  render();
}

// ============ Error Handling ============

function showError(message) {
  document.getElementById('app').innerHTML = `
    <div class="error">
      <p>${message}</p>
      <p style="margin-top: 10px; font-size: 14px;">Check that the Google Sheets are published, or try the local fallback files.</p>
      <button class="action-btn primary" onclick="refreshData()" style="margin-top: 15px;">Retry</button>
    </div>
  `;
}

// ============ Initialize ============

loadAllData();
