// ============ App State ============
let meals = [];
let ingredients = {};  // Map: ingredient name -> array of {category, sub_category, location}
let inventory = {};    // Map: ingredient name -> array of {format, quantity, unit, expires_soon, min_usage, season}
let weekPlan = loadWeekPlan();
let selectedSlot = null;
let filters = {
  mealType: 'all',
  proteins: [],
  cuisines: [],
  colorsNeeded: [],
  expiringOnly: false,
  ingredients: [],  // Filter by specific ingredients (multi-select)
  autoExcludeProteins: true,  // Auto-exclude protein sub-cats at limit
  autoExcludeCarbs: true,     // Auto-exclude carb sub-cats at limit
};
let sortBy = 'alpha';  // 'alpha', 'spoons-asc', 'spoons-desc'
let flaggedLeftovers = loadFlaggedLeftovers();  // Set of ingredient names flagged for reuse

// ============ Leftover Flagging ============

function loadFlaggedLeftovers() {
  try {
    const saved = localStorage.getItem('flaggedLeftovers');
    if (saved) {
      return new Set(JSON.parse(saved));
    }
  } catch (e) {
    console.error('Failed to load flagged leftovers:', e);
  }
  return new Set();
}

function saveFlaggedLeftovers() {
  localStorage.setItem('flaggedLeftovers', JSON.stringify([...flaggedLeftovers]));
}

function toggleLeftoverFlag(ingredientName) {
  if (flaggedLeftovers.has(ingredientName)) {
    flaggedLeftovers.delete(ingredientName);
  } else {
    flaggedLeftovers.add(ingredientName);
  }
  saveFlaggedLeftovers();
  render();
}

function clearAllLeftoverFlags() {
  flaggedLeftovers.clear();
  saveFlaggedLeftovers();
  render();
}

function getUnusedFlaggedLeftovers() {
  // Returns flagged ingredients that aren't used in any planned meal
  const usage = getIngredientUsage();
  return [...flaggedLeftovers].filter(ing => !usage[ing] || usage[ing] === 0);
}

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
    
    // Use fallback data in demo mode, otherwise fetch from Google Sheets
    const mealsUrl = CONFIG.DEMO_MODE ? CONFIG.FALLBACK.meals : CONFIG.SHEETS.meals;
    const ingredientsUrl = CONFIG.DEMO_MODE ? CONFIG.FALLBACK.ingredients : CONFIG.SHEETS.ingredients;
    const inventoryUrl = CONFIG.DEMO_MODE ? CONFIG.FALLBACK.inventory : CONFIG.SHEETS.inventory;
    
    // Fetch all CSVs in parallel
    const [mealsCSV, ingredientsCSV, inventoryCSV] = await Promise.all([
      fetchCSV(mealsUrl, CONFIG.FALLBACK.meals),
      fetchCSV(ingredientsUrl, CONFIG.FALLBACK.ingredients),
      fetchCSV(inventoryUrl, CONFIG.FALLBACK.inventory),
    ]);

    // Parse meals
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
            spoons: parseInt(row.spoons) || 5,  // Default to 5 if not set
            ingredients: parseIngredients(row.ingredients || '')
          }));
      }
    });

    // Parse ingredients (reference data - can have multiple rows per ingredient for dual-category items)
    Papa.parse(ingredientsCSV, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        ingredients = {};
        results.data.forEach(row => {
          if (row.name) {
            const name = row.name.trim().toLowerCase();
            if (!ingredients[name]) {
              ingredients[name] = [];
            }
            ingredients[name].push({
              category: row.category || 'pantry',
              sub_category: row.sub_category || '',
              location: row.location || 'pantry'
            });
          }
        });
      }
    });

    // Parse inventory (stock tracking - can have multiple rows per ingredient for different formats)
    Papa.parse(inventoryCSV, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        inventory = {};
        results.data.forEach(row => {
          if (row.name) {
            const name = row.name.trim().toLowerCase();
            if (!inventory[name]) {
              inventory[name] = [];
            }
            inventory[name].push({
              format: row.format || 'fresh',
              quantity: parseInt(row.quantity) || 0,
              unit: row.unit || 'ea',
              expires_soon: row.expires_soon === 'TRUE' || row.expires_soon === 'true' || row.expires_soon === true,
              min_usage: parseInt(row.min_usage) || 1,
              season: row.season || 'n/a'
            });
          }
        });
      }
    });

    // Save to cache
    saveToCache();
    
    console.log(`Loaded: ${meals.length} meals, ${Object.keys(ingredients).length} ingredients, ${Object.keys(inventory).length} inventory items`);
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
const CACHE_VERSION = 3;

function saveToCache() {
  const data = { 
    version: CACHE_VERSION,
    meals,
    ingredients,
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

// Get all category info for an ingredient (can be multiple for dual-category items like corn)
function getIngredientCategories(ingredientName) {
  return ingredients[ingredientName.toLowerCase()] || [{ category: 'pantry', sub_category: '', location: 'pantry' }];
}

// Get the primary location for an ingredient (from ingredients.csv)
function getIngredientLocation(ingredientName) {
  const cats = getIngredientCategories(ingredientName);
  return cats[0]?.location || 'pantry';
}

// Get all inventory entries for an ingredient (can be multiple formats: fresh, frozen, canned)
function getIngredientInventory(ingredientName) {
  return inventory[ingredientName.toLowerCase()] || [];
}

// Get the best available format for an ingredient (fresh in season > frozen > canned > shelf stable)
function getBestInventoryFormat(ingredientName) {
  const entries = getIngredientInventory(ingredientName);
  if (entries.length === 0) return null;
  
  // Filter to formats with quantity > 0
  const available = entries.filter(e => e.quantity > 0);
  if (available.length === 0) return null;
  
  // Priority: fresh (if in season) > frozen > shelf stable
  const fresh = available.find(e => e.format === 'fresh');
  if (fresh) {
    // Check if in season
    const seasons = fresh.season.split(',').map(s => s.trim().toLowerCase());
    if (seasons.includes('n/a') || seasons.includes(CURRENT_SEASON)) {
      return fresh;
    }
  }
  
  const frozen = available.find(e => e.format === 'frozen');
  if (frozen) return frozen;
  
  const shelf = available.find(e => e.format === 'shelf stable');
  if (shelf) return shelf;
  
  // Return first available if no priority match
  return available[0];
}

// Get total quantity across all formats
function getTotalQuantity(ingredientName) {
  const entries = getIngredientInventory(ingredientName);
  return entries.reduce((sum, e) => sum + e.quantity, 0);
}

// Check if any format is expiring soon
function isExpiringSoon(ingredientName) {
  const entries = getIngredientInventory(ingredientName);
  return entries.some(e => e.expires_soon && e.quantity > 0);
}

// Legacy compatibility: get combined info (for existing code that expects old structure)
function getIngredientInfo(ingredientName) {
  const cats = getIngredientCategories(ingredientName);
  const bestFormat = getBestInventoryFormat(ingredientName);
  
  return {
    category: cats[0]?.category || 'pantry',
    sub_category: cats[0]?.sub_category || '',
    location: cats[0]?.location || 'pantry',
    quantity: getTotalQuantity(ingredientName),
    expires_soon: isExpiringSoon(ingredientName),
    // All categories this ingredient belongs to (for dual-category items)
    allCategories: cats
  };
}

function getMealColors(mealName) {
  const colors = {
    red: false,
    'orange/yellow': false,
    green: false,
    leafy_green: false,
    'blue/purple': false,
    'white/brown': false
  };
  
  const ings = getMealIngredients(mealName);
  ings.forEach(ing => {
    // Check ALL categories for this ingredient (handles dual-category items)
    const allCats = getIngredientCategories(ing);
    allCats.forEach(catInfo => {
      // Check if sub_category is a produce color
      if (PRODUCE_COLORS.includes(catInfo.sub_category)) {
        colors[catInfo.sub_category] = true;
      }
    });
  });
  
  return colors;
}

function getMealProteins(mealName) {
  const ings = getMealIngredients(mealName);
  const proteins = [];
  ings.forEach(ing => {
    const allCats = getIngredientCategories(ing);
    // Check if any category entry is protein
    if (allCats.some(c => c.category === 'protein') && ing !== 'vegetarian') {
      proteins.push(ing);
    }
  });
  return proteins;
}

function getMealCarbs(mealName) {
  const ings = getMealIngredients(mealName);
  const carbs = [];
  ings.forEach(ing => {
    const allCats = getIngredientCategories(ing);
    // Check if any category entry is carb
    if (allCats.some(c => c.category === 'carb')) {
      carbs.push(ing);
    }
  });
  return carbs;
}

function hasExpiringIngredients(mealName) {
  const ings = getMealIngredients(mealName);
  const usage = getIngredientUsage();
  
  return ings.some(ing => {
    const info = getIngredientInfo(ing);
    if (!info.expires_soon || info.quantity <= 0) return false;
    
    // Only count as expiring if not already fully used
    const needed = usage[ing] || 0;
    const fullyUsed = needed >= info.quantity;
    return !fullyUsed;
  });
}

// ============ Nutrition Tracking ============

// Get protein sub-category for an ingredient
function getProteinSubCategory(ingredientName) {
  const cats = getIngredientCategories(ingredientName);
  const proteinCat = cats.find(c => c.category === 'protein');
  return proteinCat ? proteinCat.sub_category : null;
}

// Get carb sub-category for an ingredient
function getCarbSubCategory(ingredientName) {
  const cats = getIngredientCategories(ingredientName);
  const carbCat = cats.find(c => c.category === 'carb');
  return carbCat ? carbCat.sub_category : null;
}

// Count protein sub-categories used in week plan
function getWeekProteinSubCategoryCounts() {
  const counts = { meat: 0, fish: 0, egg: 0, bean: 0, tofu: 0 };
  
  weekPlan.forEach(day => {
    MEAL_SLOTS.forEach(slot => {
      const meal = day[slot];
      if (meal) {
        const proteins = getMealProteins(meal.name);
        const seenSubCats = new Set();  // Don't double-count same sub-cat in one meal
        proteins.forEach(p => {
          const subCat = getProteinSubCategory(p);
          if (subCat && counts.hasOwnProperty(subCat) && !seenSubCats.has(subCat)) {
            counts[subCat]++;
            seenSubCats.add(subCat);
          }
        });
      }
    });
  });
  
  return counts;
}

// Count carb sub-categories used in week plan
function getWeekCarbSubCategoryCounts() {
  const counts = { bread: 0, noodle: 0, rice: 0, tortilla: 0, potato: 0 };
  
  weekPlan.forEach(day => {
    MEAL_SLOTS.forEach(slot => {
      const meal = day[slot];
      if (meal) {
        const ings = getMealIngredients(meal.name);
        const seenSubCats = new Set();  // Don't double-count same sub-cat in one meal
        ings.forEach(ing => {
          const subCat = getCarbSubCategory(ing);
          if (subCat && counts.hasOwnProperty(subCat) && !seenSubCats.has(subCat)) {
            counts[subCat]++;
            seenSubCats.add(subCat);
          }
        });
      }
    });
  });
  
  return counts;
}

// Check if protein sub-category is at or over limit (2 per week)
function isProteinSubCategoryOverLimit(subCat) {
  const counts = getWeekProteinSubCategoryCounts();
  return counts[subCat] >= 2;
}

// Check if carb sub-category is at or over limit (3 per week)
function isCarbSubCategoryOverLimit(subCat) {
  const counts = getWeekCarbSubCategoryCounts();
  return counts[subCat] >= 3;
}

// ============ Color Counting ============

function getColorCountsForDay(dayIndex) {
  const counts = { red: 0, 'orange/yellow': 0, green: 0, leafy_green: 0, 'blue/purple': 0, 'white/brown': 0 };
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
  const counts = { red: 0, 'orange/yellow': 0, green: 0, leafy_green: 0, 'blue/purple': 0, 'white/brown': 0 };
  
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
  // Get current limits for auto-exclude
  const proteinCounts = getWeekProteinSubCategoryCounts();
  const carbCounts = getWeekCarbSubCategoryCounts();
  
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
    
    // Specific ingredient filter (must have ALL selected ingredients)
    if (filters.ingredients.length > 0) {
      const ings = getMealIngredients(meal.name);
      if (!filters.ingredients.every(fi => ings.includes(fi))) return false;
    }
    
    // Auto-exclude proteins at limit (2 per sub-category)
    if (filters.autoExcludeProteins) {
      const mealProteins = getMealProteins(meal.name);
      for (const p of mealProteins) {
        const subCat = getProteinSubCategory(p);
        if (subCat && proteinCounts[subCat] >= 2) {
          return false;  // This meal uses a protein sub-cat that's at limit
        }
      }
    }
    
    // Auto-exclude carbs at limit (3 per sub-category)
    if (filters.autoExcludeCarbs) {
      const ings = getMealIngredients(meal.name);
      for (const ing of ings) {
        const subCat = getCarbSubCategory(ing);
        if (subCat && carbCounts[subCat] >= 3) {
          return false;  // This meal uses a carb sub-cat that's at limit
        }
      }
    }
    
    return true;
  });
}

function sortMeals(filteredMeals) {
  return [...filteredMeals].sort((a, b) => {
    // Prioritize meals with expiring ingredients (always first, regardless of sort)
    const aExpiring = hasExpiringIngredients(a.name);
    const bExpiring = hasExpiringIngredients(b.name);
    if (aExpiring && !bExpiring) return -1;
    if (!aExpiring && bExpiring) return 1;
    
    // Apply the user's selected sort method as PRIMARY sort
    if (sortBy === 'spoons-asc') {
      if (a.spoons !== b.spoons) return a.spoons - b.spoons;
    } else if (sortBy === 'spoons-desc') {
      if (a.spoons !== b.spoons) return b.spoons - a.spoons;
    }
    // For 'alpha' or as tie-breaker, use alphabetical
    return a.name.localeCompare(b.name);
  });
}

function setSortBy(sort) {
  sortBy = sort;
  render();
}

// ============ Inventory Helpers ============

function getIngredientUsage() {
  // Count how many of each ingredient is needed by planned meals
  const usage = {};
  
  weekPlan.forEach(day => {
    MEAL_SLOTS.forEach(slot => {
      const meal = day[slot];
      if (meal) {
        const ings = getMealIngredients(meal.name);
        ings.forEach(ing => {
          if (ing !== 'vegetarian') {
            usage[ing] = (usage[ing] || 0) + 1;
          }
        });
      }
    });
  });
  
  return usage;
}

function getInventoryByLocation() {
  const byLocation = {
    fridge: [],
    freezer: [],
    pantry: [],
    counter: []
  };
  
  const usage = getIngredientUsage();
  
  // Iterate through all inventory items
  Object.entries(inventory).forEach(([name, formats]) => {
    // Get the ingredient's location from ingredients.csv
    const location = getIngredientLocation(name);
    
    // Get total quantity across all formats
    const totalQty = formats.reduce((sum, f) => sum + f.quantity, 0);
    if (totalQty <= 0) return;
    
    // Check if any format is expiring
    const expiring = formats.some(f => f.expires_soon && f.quantity > 0);
    
    // Get category info
    const cats = getIngredientCategories(name);
    const category = cats[0]?.sub_category || cats[0]?.category || 'pantry';
    
    const needed = usage[name] || 0;
    const fullyUsed = needed >= totalQty;
    
    if (byLocation[location]) {
      byLocation[location].push({
        name,
        quantity: totalQty,
        expires_soon: expiring,
        category: category,
        needed,
        fullyUsed
      });
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
  const usage = getIngredientUsage();
  const expiring = [];
  
  Object.entries(inventory).forEach(([name, formats]) => {
    // Check if any format is expiring with quantity > 0
    const expiringFormats = formats.filter(f => f.expires_soon && f.quantity > 0);
    if (expiringFormats.length === 0) return;
    
    const totalQty = formats.reduce((sum, f) => sum + f.quantity, 0);
    const needed = usage[name] || 0;
    const fullyUsed = needed >= totalQty;
    
    expiring.push({ name, quantity: totalQty, needed, fullyUsed });
  });
  
  return expiring;
}

// ============ User Actions ============

function toggleFilter(type, value) {
  if (type === 'expiringOnly') {
    filters.expiringOnly = !filters.expiringOnly;
  } else if (type === 'ingredient') {
    const idx = filters.ingredients.indexOf(value);
    if (idx === -1) filters.ingredients.push(value);
    else filters.ingredients.splice(idx, 1);
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
    
    // Clear include filters (proteins, cuisines, ingredients) but keep exclude filters
    filters.proteins = [];
    filters.cuisines = [];
    filters.ingredients = [];
    filters.expiringOnly = false;
    
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

function toggleAutoExclude(type) {
  if (type === 'proteins') {
    filters.autoExcludeProteins = !filters.autoExcludeProteins;
  } else if (type === 'carbs') {
    filters.autoExcludeCarbs = !filters.autoExcludeCarbs;
  }
  render();
}

function clearFilters() {
  filters = { 
    mealType: 'all', 
    proteins: [], 
    cuisines: [], 
    colorsNeeded: [], 
    expiringOnly: false, 
    ingredients: [],
    autoExcludeProteins: true,
    autoExcludeCarbs: true
  };
  render();
}

function toggleDemoMode() {
  CONFIG.DEMO_MODE = !CONFIG.DEMO_MODE;
  loadAllData(true);
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
