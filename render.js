// ============ Main Render ============

// Helper to convert color keys to CSS-safe class names
function colorToCssClass(color) {
  return color.replace(/\//g, '_');
}

function render() {
  const filteredMeals = sortMeals(getFilteredMeals());
  const proteins = getUniqueProteins();
  const cuisines = getUniqueCuisines();
  const weekColorCounts = getColorCountsForWeek();
  const groceryList = calculateGroceryList();

  document.getElementById('app').innerHTML = `
    <div class="three-column-layout">
      <aside class="sidebar inventory-sidebar">
        ${renderInventorySidebar()}
      </aside>
      
      <main class="main-content">
        ${renderWeekGrid()}
        ${renderWeekSummary(weekColorCounts)}
        ${renderMealTabs()}
        ${renderFilters(proteins, cuisines)}
        ${renderStats(filteredMeals.length, meals.length)}
        ${renderMealsGrid(filteredMeals)}
      </main>
      
      <aside class="sidebar grocery-sidebar">
        ${renderGrocerySidebar(groceryList)}
      </aside>
    </div>
  `;
}

// ============ Inventory Sidebar ============

function renderInventorySidebar() {
  const byLocation = getInventoryByLocation();
  const expiring = getExpiringItems();
  const isDemo = CONFIG.DEMO_MODE;
  const unusedFlagged = getUnusedFlaggedLeftovers();
  
  return `
    <div class="sidebar-header">
      <h3>📦 Inventory</h3>
      <button class="refresh-btn" onclick="refreshData()" title="Refresh from Google Sheets">↻</button>
    </div>
    
    ${isDemo ? '<div class="demo-badge">Demo Mode</div>' : ''}
    
    ${flaggedLeftovers.size > 0 ? `
      <div class="flagged-section">
        <h4>🚩 Flagged Leftovers</h4>
        <ul class="inventory-list">
          ${[...flaggedLeftovers].map(item => {
            const isUsed = !unusedFlagged.includes(item);
            return `
              <li class="inventory-item flagged ${isUsed ? 'used' : 'unused'}"
                  onclick="toggleLeftoverFlag('${item}')">
                <span class="item-name">${item} ${isUsed ? '✓' : ''}</span>
                <span class="item-action">✕</span>
              </li>
            `;
          }).join('')}
        </ul>
        ${unusedFlagged.length > 0 ? `
          <div class="flagged-warning">⚠️ ${unusedFlagged.length} flagged item(s) not yet used in plan!</div>
        ` : `
          <div class="flagged-success">✓ All flagged items used</div>
        `}
        <button class="clear-flags-btn" onclick="clearAllLeftoverFlags()">Clear all flags</button>
      </div>
    ` : ''}
    
    ${expiring.length > 0 && !expiring.every(i => i.fullyUsed) ? `
      <div class="expiring-section">
        <h4>⚠️ Use Soon</h4>
        <ul class="inventory-list expiring">
          ${expiring.map(item => `
            <li class="inventory-item expiring ${item.fullyUsed ? 'fully-used' : ''} ${filters.ingredients.includes(item.name) ? 'selected' : ''}"
                onclick="toggleFilter('ingredient', '${item.name}')">
              <span class="item-name">${item.name}</span>
              <span class="item-qty">${item.quantity}</span>
            </li>
          `).join('')}
        </ul>
        <button class="filter-expiring-btn ${filters.expiringOnly ? 'active' : ''}" 
                onclick="toggleFilter('expiringOnly')">
          ${filters.expiringOnly ? '✓ Showing expiring' : 'Show meals using these'}
        </button>
      </div>
    ` : ''}
    
    ${renderInventoryLocation('🧊 Fridge', byLocation.fridge)}
    ${renderInventoryLocation('❄️ Freezer', byLocation.freezer)}
    ${renderInventoryLocation('🥫 Pantry', byLocation.pantry)}
    ${renderInventoryLocation('🍌 Counter', byLocation.counter)}
    
    <div class="sidebar-footer">
      ${isDemo ? '' : `<a href="https://docs.google.com/spreadsheets/d/1ugx_pPD_Zw5Fl18vTLwyNH7gzKMe7NI3LlZcDPOzcFc/edit" 
         target="_blank" class="edit-link">Edit in Google Sheets →</a>`}
      <button class="demo-toggle" onclick="toggleDemoMode()">
        ${isDemo ? 'Exit Demo Mode' : 'Try Demo Mode'}
      </button>
    </div>
  `;
}

function renderInventoryLocation(title, items) {
  if (items.length === 0) return '';
  
  return `
    <div class="inventory-location">
      <h4>${title}</h4>
      <ul class="inventory-list">
        ${items.map(item => {
          const isFlagged = flaggedLeftovers.has(item.name);
          return `
            <li class="inventory-item ${item.expires_soon ? 'expiring' : ''} ${item.fullyUsed ? 'fully-used' : ''} ${filters.ingredients.includes(item.name) ? 'selected' : ''} ${isFlagged ? 'flagged' : ''} cat-${item.category}">
              <span class="item-name" onclick="toggleFilter('ingredient', '${item.name}')">${item.name}</span>
              <button class="flag-btn ${isFlagged ? 'active' : ''}" onclick="event.stopPropagation(); toggleLeftoverFlag('${item.name}')" title="${isFlagged ? 'Remove flag' : 'Flag for reuse'}">🚩</button>
              <span class="item-qty">${item.quantity}</span>
            </li>
          `;
        }).join('')}
      </ul>
    </div>
  `;
}

// ============ Grocery Sidebar ============

function renderGrocerySidebar(groceryList) {
  const items = Object.entries(groceryList).sort((a, b) => a[0].localeCompare(b[0]));
  const totalItems = items.reduce((sum, [_, qty]) => sum + qty, 0);
  
  // Group by category
  const byCategory = {};
  items.forEach(([name, qty]) => {
    const info = getIngredientInfo(name);
    const cat = info.category || 'other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push({ name, qty });
  });
  
  const categoryOrder = ['protein', 'red', 'orange/yellow', 'green', 'leafy_green', 'blue/purple', 'white/brown', 'carb', 'dairy', 'pantry'];
  const categoryNames = {
    protein: '🥩 Protein',
    red: '🔴 Red',
    'orange/yellow': '🟠 Orange/Yellow',
    green: '🟢 Green',
    leafy_green: '🥬 Leafy Green',
    'blue/purple': '🟣 Blue/Purple',
    'white/brown': '⚪ White/Brown',
    carb: '🍞 Carbs',
    dairy: '🧀 Dairy',
    pantry: '🥫 Pantry'
  };
  
  return `
    <div class="sidebar-header">
      <h3>🛒 Grocery List</h3>
      <span class="grocery-count">${totalItems} items</span>
    </div>
    
    ${items.length === 0 ? `
      <div class="empty-grocery">
        <p>No items needed!</p>
        <p class="hint">Add meals to your plan to generate a grocery list.</p>
      </div>
    ` : `
      <div class="grocery-categories">
        ${categoryOrder.map(cat => {
          if (!byCategory[cat] || byCategory[cat].length === 0) return '';
          return `
            <div class="grocery-category">
              <h4>${categoryNames[cat] || cat}</h4>
              <ul class="grocery-list">
                ${byCategory[cat].map(item => `
                  <li class="grocery-item">
                    <span class="item-name">${item.name}</span>
                    <span class="item-qty">${item.qty}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          `;
        }).join('')}
      </div>
    `}
  `;
}

// ============ Week Grid ============

function renderWeekGrid() {
  return `
    <div class="week-grid">
      <div class="week-header">
        <h2>📅 Week Plan</h2>
        <button class="action-btn danger" onclick="clearWeek()">Clear Week</button>
      </div>
      <div class="days-container">
        ${weekPlan.map((day, dayIndex) => renderDay(day, dayIndex)).join('')}
      </div>
    </div>
  `;
}

function renderDay(day, dayIndex) {
  const colorCounts = getColorCountsForDay(dayIndex);
  const missingColors = getMissingColorsForDay(dayIndex);
  const colorsComplete = missingColors.length === 0;
  const hasAnyMeal = day.breakfast || day.lunch || day.dinner;
  
  return `
    <div class="day-card ${colorsComplete && hasAnyMeal ? 'complete' : ''}">
      <div class="day-header">
        <span class="day-title">Day ${dayIndex + 1}</span>
        <div class="day-colors">
          ${renderDayColorDots(colorCounts)}
        </div>
      </div>
      <div class="day-slots">
        ${MEAL_SLOTS.map(slot => renderSlot(day, dayIndex, slot)).join('')}
      </div>
    </div>
  `;
}

function renderDayColorDots(colorCounts) {
  return PRODUCE_COLORS.map(key => {
    const hasColor = colorCounts[key] > 0;
    return `<div class="day-color-dot ${colorToCssClass(key)} ${hasColor ? 'filled' : 'empty'}" title="${COLOR_NAMES[key]}"></div>`;
  }).join('');
}

function renderSlot(day, dayIndex, slot) {
  const meal = day[slot];
  const isSelected = selectedSlot && selectedSlot.day === dayIndex && selectedSlot.slot === slot;
  const slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1);
  
  if (meal) {
    const colors = getMealColors(meal.name);
    const hasExpiring = hasExpiringIngredients(meal.name);
    
    return `
      <div class="meal-slot filled ${slot} ${hasExpiring ? 'has-expiring' : ''}" onclick="selectSlot(${dayIndex}, '${slot}')">
        <div class="slot-label">${slotLabel}</div>
        <div class="slot-meal">
          <span class="slot-meal-name">${meal.name}</span>
          <button class="slot-remove" onclick="event.stopPropagation(); removeMealFromSlot(${dayIndex}, '${slot}')" title="Remove">×</button>
        </div>
        <div class="slot-colors">${renderColorDots(colors)}</div>
      </div>
    `;
  } else {
    return `
      <div class="meal-slot empty ${slot} ${isSelected ? 'selected' : ''}" onclick="selectSlot(${dayIndex}, '${slot}')">
        <div class="slot-label">${slotLabel}</div>
        <div class="slot-empty-text">${isSelected ? 'Select a meal below...' : 'Click to add'}</div>
      </div>
    `;
  }
}

// ============ Week Summary ============

function renderWeekSummary(colorCounts) {
  const totalMeals = weekPlan.reduce((sum, day) => {
    return sum + (day.breakfast ? 1 : 0) + (day.lunch ? 1 : 0) + (day.dinner ? 1 : 0);
  }, 0);
  
  const proteinCounts = getWeekProteinSubCategoryCounts();
  const carbCounts = getWeekCarbSubCategoryCounts();
  
  return `
    <div class="week-summary">
      <div class="summary-label">Week Totals (${totalMeals}/21 meals)</div>
      
      <div class="summary-section">
        <div class="summary-section-label">Rainbow (colors per week)</div>
        <div class="rainbow-tracker">
          ${PRODUCE_COLORS.map(key => `
            <div class="color-dot ${colorToCssClass(key)} ${filters.colorsNeeded.includes(key) ? 'needed' : ''}" 
                 onclick="toggleFilter('colorsNeeded', '${key}')"
                 title="${COLOR_NAMES[key]} - Click to filter">
              ${colorCounts[key]}
              <span class="color-label">${COLOR_NAMES[key]}</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="summary-section">
        <div class="summary-section-label">
          Protein Variety (max 2 each/week)
          <label class="auto-exclude-toggle">
            <input type="checkbox" ${filters.autoExcludeProteins ? 'checked' : ''} onchange="toggleAutoExclude('proteins')">
            Auto-hide at limit
          </label>
        </div>
        <div class="variety-tracker">
          ${Object.entries(proteinCounts).map(([subCat, count]) => {
            const isOver = count >= 2;
            const emoji = { meat: '🥩', fish: '🐟', egg: '🥚', bean: '🫘', tofu: '🥬' }[subCat] || '🍽️';
            return `
              <div class="variety-item ${isOver ? 'at-limit' : ''}" title="${subCat}: ${count}/2">
                <span class="variety-emoji">${emoji}</span>
                <span class="variety-name">${subCat}</span>
                <span class="variety-count">${count}/2</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      <div class="summary-section">
        <div class="summary-section-label">
          Carb Variety (max 3 each/week)
          <label class="auto-exclude-toggle">
            <input type="checkbox" ${filters.autoExcludeCarbs ? 'checked' : ''} onchange="toggleAutoExclude('carbs')">
            Auto-hide at limit
          </label>
        </div>
        <div class="variety-tracker">
          ${Object.entries(carbCounts).map(([subCat, count]) => {
            const isOver = count >= 3;
            const emoji = { bread: '🍞', noodle: '🍜', rice: '🍚', tortilla: '🌮', potato: '🥔' }[subCat] || '🍽️';
            return `
              <div class="variety-item ${isOver ? 'at-limit' : ''}" title="${subCat}: ${count}/3">
                <span class="variety-emoji">${emoji}</span>
                <span class="variety-name">${subCat}</span>
                <span class="variety-count">${count}/3</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

// ============ Meal Tabs ============

function renderMealTabs() {
  const tabs = [
    { key: 'all', label: 'All Meals' },
    { key: 'breakfast', label: 'Breakfast' },
    { key: 'lunch', label: 'Lunch' },
    { key: 'dinner', label: 'Dinner' }
  ];
  
  return `
    <div class="meal-tabs">
      ${tabs.map(tab => `
        <button class="meal-tab ${filters.mealType === tab.key ? 'active' : ''}" 
                onclick="setMealType('${tab.key}')">
          ${tab.label}
        </button>
      `).join('')}
    </div>
  `;
}

// ============ Filters ============

function renderFilters(proteins, cuisines) {
  // Count proteins in planned meals
  const proteinCounts = {};
  proteins.forEach(p => proteinCounts[p] = 0);
  
  weekPlan.forEach(day => {
    MEAL_SLOTS.forEach(slot => {
      const meal = day[slot];
      if (meal) {
        getMealProteins(meal.name).forEach(p => {
          if (proteinCounts.hasOwnProperty(p)) proteinCounts[p]++;
        });
      }
    });
  });
  
  // Count cuisines in planned meals
  const cuisineCounts = {};
  cuisines.forEach(c => cuisineCounts[c] = 0);
  
  weekPlan.forEach(day => {
    MEAL_SLOTS.forEach(slot => {
      const meal = day[slot];
      if (meal && meal.cuisine) {
        if (cuisineCounts.hasOwnProperty(meal.cuisine)) cuisineCounts[meal.cuisine]++;
      }
    });
  });
  
  return `
    <div class="filters">
      <div class="filter-section">
        <h3>Sort By</h3>
        <div class="filter-options">
          <button class="filter-btn ${sortBy === 'alpha' ? 'active' : ''}" onclick="setSortBy('alpha')">A-Z</button>
          <button class="filter-btn ${sortBy === 'spoons-asc' ? 'active' : ''}" onclick="setSortBy('spoons-asc')">🥄 Easiest</button>
          <button class="filter-btn ${sortBy === 'spoons-desc' ? 'active' : ''}" onclick="setSortBy('spoons-desc')">🥄 Hardest</button>
        </div>
      </div>
      <div class="filter-section">
        <h3>Protein</h3>
        <div class="filter-options">
          ${proteins.map(p => `
            <button class="filter-btn ${filters.proteins.includes(p) ? 'active' : ''}"
                    onclick="toggleFilter('proteins', '${p}')">
              ${p}<span class="filter-count">${proteinCounts[p]}</span>
            </button>
          `).join('')}
        </div>
      </div>
      <div class="filter-section">
        <h3>Cuisine</h3>
        <div class="filter-options">
          ${cuisines.map(c => `
            <button class="filter-btn ${filters.cuisines.includes(c) ? 'active' : ''}"
                    onclick="toggleFilter('cuisines', '${c}')">
              ${c}<span class="filter-count">${cuisineCounts[c]}</span>
            </button>
          `).join('')}
        </div>
      </div>
      <div class="filter-actions">
        <button class="action-btn secondary" onclick="clearFilters()">Clear Filters</button>
      </div>
    </div>
  `;
}

// ============ Stats ============

function renderStats(shown, total) {
  let statusText = `Showing <strong>${shown}</strong> of ${total} meals`;
  
  if (selectedSlot) {
    statusText += ` • Adding to <strong>Day ${selectedSlot.day + 1} ${selectedSlot.slot}</strong>`;
  }
  
  if (filters.colorsNeeded.length > 0) {
    statusText += ` • Colors: ${filters.colorsNeeded.map(c => COLOR_NAMES[c]).join(', ')}`;
  }
  
  if (filters.expiringOnly) {
    statusText += ` • <span class="expiring-badge">Using expiring items</span>`;
  }
  
  if (filters.ingredients.length > 0) {
    statusText += ` • <span class="ingredient-badge">${filters.ingredients.join(' + ')}</span>`;
  }
  
  return `<div class="stats">${statusText}</div>`;
}

// ============ Meals Grid ============

function renderMealsGrid(filteredMeals) {
  return `
    <div class="meals-grid">
      ${filteredMeals.map(meal => renderMealCard(meal)).join('')}
    </div>
  `;
}

function renderMealCard(meal) {
  const isInPlan = weekPlan.some(day => 
    (day.breakfast && day.breakfast.name === meal.name) ||
    (day.lunch && day.lunch.name === meal.name) ||
    (day.dinner && day.dinner.name === meal.name)
  );
  
  const colors = getMealColors(meal.name);
  const proteins = getMealProteins(meal.name);
  const carbs = getMealCarbs(meal.name);
  const hasExpiring = hasExpiringIngredients(meal.name);
  const neededColorCount = filters.colorsNeeded.filter(c => colors[c]).length;
  const isRecommended = neededColorCount > 0;
  const ingredients = getMealIngredients(meal.name);
  
  const clickHandler = selectedSlot 
    ? `addMealToSlot(${JSON.stringify(meal).replace(/'/g, "&#39;")})`
    : `alert('Click a meal slot in the week plan first')`;
  
  // Build tooltip with ingredients
  const ingredientList = ingredients.length > 0 ? ingredients.join(', ') : 'No ingredients listed';
  const tooltip = `Ingredients: ${ingredientList}`;
  
  // Spoon display (show as emoji string)
  const spoonDisplay = '🥄'.repeat(Math.min(meal.spoons, 10));
  
  return `
    <div class="meal-card ${isInPlan ? 'selected' : ''} ${isRecommended ? 'recommended' : ''} ${hasExpiring ? 'has-expiring' : ''} ${selectedSlot ? 'clickable' : 'disabled'}" 
         onclick='${clickHandler}'
         title="${tooltip}">
      ${hasExpiring ? '<div class="expiring-indicator" title="Uses expiring ingredients">⚠️</div>' : ''}
      <h3>${meal.name}</h3>
      <div class="meta">
        ${proteins.map(p => `<span class="tag protein">${p}</span>`).join('')}
        <span class="tag cuisine">${meal.cuisine}</span>
        <span class="tag format">${meal.format}</span>
        ${carbs.map(c => `<span class="tag carb">${c}</span>`).join('')}
      </div>
      <div class="spoons" title="Effort: ${meal.spoons}/10">${spoonDisplay}</div>
      <div class="colors">
        ${renderColorDots(colors)}
      </div>
      ${renderFlags(meal)}
    </div>
  `;
}

function renderColorDots(colors) {
  if (!colors) return '';
  return Object.entries(colors)
    .filter(([_, hasColor]) => hasColor)
    .map(([color]) => `<div class="mini-dot ${colorToCssClass(color)}" title="${COLOR_NAMES[color]}"></div>`)
    .join('');
}

function renderFlags(meal) {
  if (!meal.red_flags && !meal.green_flags) return '';
  return `
    <div class="flags">
      ${meal.red_flags ? `<span class="red-flag">⚠️ ${meal.red_flags}</span>` : ''}
      ${meal.green_flags ? `<span class="green-flag">✓ ${meal.green_flags}</span>` : ''}
    </div>
  `;
}
