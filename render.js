// Render functions - separated for easier modification

function render() {
  const filteredMeals = sortMeals(getFilteredMeals());
  const proteins = getUniqueValues('protein');
  const cuisines = getUniqueValues('cuisine');
  const weekColorCounts = getColorCountsForWeek();

  document.getElementById('app').innerHTML = `
    ${renderWeekGrid()}
    ${renderWeekSummary(weekColorCounts)}
    ${renderMealTabs()}
    ${renderFilters(proteins, cuisines)}
    ${renderStats(filteredMeals.length, meals.length)}
    ${renderMealsGrid(filteredMeals)}
  `;
}

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
  return Object.entries(COLOR_NAMES).map(([key, label]) => {
    const hasColor = colorCounts[key] > 0;
    return `<div class="day-color-dot ${key} ${hasColor ? 'filled' : 'empty'}" title="${label}"></div>`;
  }).join('');
}

function renderSlot(day, dayIndex, slot) {
  const meal = day[slot];
  const isSelected = selectedSlot && selectedSlot.day === dayIndex && selectedSlot.slot === slot;
  const slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1);
  
  if (meal) {
    return `
      <div class="meal-slot filled ${slot}" onclick="selectSlot(${dayIndex}, '${slot}')">
        <div class="slot-label">${slotLabel}</div>
        <div class="slot-meal">
          <span class="slot-meal-name">${meal.name}</span>
          <button class="slot-remove" onclick="event.stopPropagation(); removeMealFromSlot(${dayIndex}, '${slot}')" title="Remove">×</button>
        </div>
        <div class="slot-colors">${renderColorDots(meal.colors)}</div>
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

function renderWeekSummary(colorCounts) {
  const totalMeals = weekPlan.reduce((sum, day) => {
    return sum + (day.breakfast ? 1 : 0) + (day.lunch ? 1 : 0) + (day.dinner ? 1 : 0);
  }, 0);
  
  return `
    <div class="week-summary">
      <div class="summary-label">Week Totals (${totalMeals}/21 meals)</div>
      <div class="rainbow-tracker">
        ${Object.entries(COLOR_NAMES).map(([key, label]) => `
          <div class="color-dot ${key} ${filters.colorsNeeded.includes(key) ? 'needed' : ''}" 
               onclick="toggleFilter('colorsNeeded', '${key}')"
               title="${label} - Click to filter">
            ${colorCounts[key]}
            <span class="color-label">${label}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

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

function renderStats(shown, total) {
  let statusText = `Showing <strong>${shown}</strong> of ${total} meals`;
  
  if (selectedSlot) {
    statusText += ` • Adding to <strong>Day ${selectedSlot.day + 1} ${selectedSlot.slot}</strong>`;
  }
  
  if (filters.colorsNeeded.length > 0) {
    statusText += ` • Colors: ${filters.colorsNeeded.map(c => COLOR_NAMES[c]).join(', ')}`;
  }
  
  return `<div class="stats">${statusText}</div>`;
}

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
  const neededColorCount = filters.colorsNeeded.filter(c => meal.colors[c]).length;
  const isRecommended = neededColorCount > 0;
  
  const clickHandler = selectedSlot 
    ? `addMealToSlot(${JSON.stringify(meal).replace(/'/g, "&#39;")})`
    : `alert('Click a meal slot in the week plan first')`;
  
  return `
    <div class="meal-card ${isInPlan ? 'selected' : ''} ${isRecommended ? 'recommended' : ''} ${selectedSlot ? 'clickable' : 'disabled'}" 
         onclick='${clickHandler}'>
      <h3>${meal.name}</h3>
      <div class="meta">
        <span class="tag protein">${meal.protein}</span>
        <span class="tag cuisine">${meal.cuisine}</span>
        <span class="tag format">${meal.format}</span>
        <span class="tag meal_type">${meal.meal_type}</span>
      </div>
      <div class="colors">
        ${renderColorDots(meal.colors)}
      </div>
      ${meal.vegetables ? `<div class="veggies">🥬 ${meal.vegetables}</div>` : ''}
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
