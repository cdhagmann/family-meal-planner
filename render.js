// ============ Main Render ============

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
  
  return `
    <div class="sidebar-header">
      <h3>📦 Inventory</h3>
      <button class="refresh-btn" onclick="refreshData()" title="Refresh from Google Sheets">↻</button>
    </div>
    
    ${expiring.length > 0 ? `
      <div class="expiring-section">
        <h4>⚠️ Use Soon</h4>
        <ul class="inventory-list expiring">
          ${expiring.map(item => `
            <li class="inventory-item expiring">
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
      <a href="https://docs.google.com/spreadsheets/d/1u4fWqFhBKxtekeXHjsSH7SQ8zcuoXM4oXWEfw5pt7Qg/edit" 
         target="_blank" class="edit-link">Edit in Google Sheets →</a>
    </div>
  `;
}

function renderInventoryLocation(title, items) {
  if (items.length === 0) return '';
  
  return `
    <div class="inventory-location">
      <h4>${title}</h4>
      <ul class="inventory-list">
        ${items.map(item => `
          <li class="inventory-item ${item.expires_soon ? 'expiring' : ''} cat-${item.category}">
            <span class="item-name">${item.name}</span>
            <span class="item-qty">${item.quantity}</span>
          </li>
        `).join('')}
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
  
  const categoryOrder = ['protein', 'red', 'orange_yellow', 'green', 'leafy_green', 'blue_purple', 'white_brown', 'carb', 'dairy', 'pantry'];
  const categoryNames = {
    protein: '🥩 Protein',
    red: '🔴 Red',
    orange_yellow: '🟠 Orange/Yellow',
    green: '🟢 Green',
    leafy_green: '🥬 Leafy Green',
    blue_purple: '🟣 Blue/Purple',
    white_brown: '⚪ White/Brown',
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
    return `<div class="day-color-dot ${key} ${hasColor ? 'filled' : 'empty'}" title="${COLOR_NAMES[key]}"></div>`;
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
  
  return `
    <div class="week-summary">
      <div class="summary-label">Week Totals (${totalMeals}/21 meals)</div>
      <div class="rainbow-tracker">
        ${PRODUCE_COLORS.map(key => `
          <div class="color-dot ${key} ${filters.colorsNeeded.includes(key) ? 'needed' : ''}" 
               onclick="toggleFilter('colorsNeeded', '${key}')"
               title="${COLOR_NAMES[key]} - Click to filter">
            ${colorCounts[key]}
            <span class="color-label">${COLOR_NAMES[key]}</span>
          </div>
        `).join('')}
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
  return `
    <div class="filters">
      <div class="filter-section">
        <h3>Protein</h3>
        <div class="filter-options">
          ${proteins.map(p => `
            <button class="filter-btn ${filters.proteins.includes(p) ? 'active' : ''}"
                    onclick="toggleFilter('proteins', '${p}')">
              ${p}
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
              ${c}
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
  
  const clickHandler = selectedSlot 
    ? `addMealToSlot(${JSON.stringify(meal).replace(/'/g, "&#39;")})`
    : `alert('Click a meal slot in the week plan first')`;
  
  return `
    <div class="meal-card ${isInPlan ? 'selected' : ''} ${isRecommended ? 'recommended' : ''} ${hasExpiring ? 'has-expiring' : ''} ${selectedSlot ? 'clickable' : 'disabled'}" 
         onclick='${clickHandler}'>
      ${hasExpiring ? '<div class="expiring-indicator" title="Uses expiring ingredients">⚠️</div>' : ''}
      <h3>${meal.name}</h3>
      <div class="meta">
        ${proteins.map(p => `<span class="tag protein">${p}</span>`).join('')}
        <span class="tag cuisine">${meal.cuisine}</span>
        <span class="tag format">${meal.format}</span>
        ${carbs.map(c => `<span class="tag carb">${c}</span>`).join('')}
      </div>
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
    .map(([color]) => `<div class="mini-dot ${color}" title="${COLOR_NAMES[color]}"></div>`)
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
