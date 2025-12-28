// Render functions - separated for easier modification

function render() {
  const colorCounts = getColorCounts();
  const filteredMeals = sortMeals(getFilteredMeals());
  const proteins = getUniqueValues('protein');
  const cuisines = getUniqueValues('cuisine');

  document.getElementById('app').innerHTML = `
    ${renderRainbowTracker(colorCounts)}
    ${renderMealTabs()}
    ${renderFilters(proteins, cuisines)}
    ${renderStats(filteredMeals.length, meals.length)}
    ${renderWeekPlan()}
    ${renderMealsGrid(filteredMeals)}
  `;
}

function renderRainbowTracker(colorCounts) {
  return `
    <div class="rainbow-tracker">
      ${Object.entries(COLOR_NAMES).map(([key, label]) => `
        <div class="color-dot ${key} ${filters.colorsNeeded.includes(key) ? 'needed' : ''}" 
             onclick="toggleFilter('colorsNeeded', '${key}')"
             title="${label} - Click to filter for meals with this color">
          ${colorCounts[key]}
          <span class="color-label">${label}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderMealTabs() {
  const tabs = [
    { key: 'all', label: 'All Meals' },
    { key: 'breakfast', label: 'Breakfast' },
    { key: 'lunch', label: 'Lunch (involved)' },
    { key: 'dinner', label: 'Dinner (easy)' }
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
    </div>
  `;
}

function renderStats(shown, total) {
  return `
    <div class="stats">
      Showing <strong>${shown}</strong> of ${total} meals
      ${filters.colorsNeeded.length > 0 
        ? ` • Filtering for: ${filters.colorsNeeded.map(c => COLOR_NAMES[c]).join(', ')}` 
        : ''}
    </div>
  `;
}

function renderWeekPlan() {
  return `
    <div class="week-plan">
      <div class="week-plan-header">
        <h2>📅 This Week's Plan (${plannedMeals.length} meals)</h2>
        <div class="action-btns">
          <button class="action-btn secondary" onclick="clearFilters()">Clear Filters</button>
          <button class="action-btn danger" onclick="clearPlan()">Clear Plan</button>
        </div>
      </div>
      <div class="planned-meals">
        ${plannedMeals.length === 0 
          ? '<div class="empty-state">Click meals below to add them to your plan</div>'
          : plannedMeals.map((meal, i) => renderPlannedMeal(meal, i)).join('')
        }
      </div>
    </div>
  `;
}

function renderPlannedMeal(meal, index) {
  return `
    <div class="planned-meal ${meal.meal_type}">
      <div class="meal-info">
        <div class="meal-name">${meal.name}</div>
        <div class="meal-meta">${meal.meal_type} • ${meal.protein} • ${meal.cuisine}</div>
        <div class="meal-colors">
          ${renderColorDots(meal.colors)}
        </div>
      </div>
      <button class="remove-btn" onclick="removeMeal(${index})" title="Remove">×</button>
    </div>
  `;
}

function renderMealsGrid(filteredMeals) {
  return `
    <div class="meals-grid">
      ${filteredMeals.map(meal => renderMealCard(meal)).join('')}
    </div>
  `;
}

function renderMealCard(meal) {
  const isPlanned = plannedMeals.find(m => m.name === meal.name);
  const neededColorCount = filters.colorsNeeded.filter(c => meal.colors[c]).length;
  const isRecommended = neededColorCount > 0;
  
  return `
    <div class="meal-card ${isPlanned ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}" 
         onclick='addMeal(${JSON.stringify(meal).replace(/'/g, "&#39;")})'>
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
