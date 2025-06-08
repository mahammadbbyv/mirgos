export function buyArmy({ budget, army, armyCost = 0, count = 1 }) {
  if (budget < armyCost * count) return { success: false, error: 'Недостаточно бюджета' };
  return {
    budget: budget - armyCost * count,
    army: army + count,
    success: true
  };
}

export function restoreCity({ budget, cityName, restoreCosts, cities }) {
  const cost = restoreCosts[cityName];
  if (budget < cost) return { success: false, error: 'Недостаточно бюджета' };
  const updatedCities = cities.map(city =>
    city.name === cityName ? { ...city, stability: 100 } : city
  );
  return {
    budget: budget - cost,
    cities: updatedCities,
    success: true
  };
}

export function developNuclear({ budget, nuclearLevel, nuclearCost }) {
  if (budget < nuclearCost) return { success: false, error: 'Недостаточно бюджета' };
  return {
    budget: budget - nuclearCost,
    nuclearLevel: nuclearLevel + 1,
    success: true
  };
}

export function setSanction({ sanctions, country, value }) {
  const updated = sanctions.map(s =>
    s.country === country ? { ...s, value } : s
  );
  return updated;
}

export function annexTerritory({ annexed, city, income }) {
  return [...annexed, { city, income }];
}

// Utility: Format timer as MM:SS
export function formatTime(t) {
  const m = Math.floor(t / 60).toString().padStart(2, '0');
  const s = (t % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Utility: Action description for summary
export function actionDescription(action, lang = 'en') {
  switch (action.type) {
    case 'buyArmy':
      return lang === 'ru' ? `Куплено армий: ${action.count}` : lang === 'uk' ? `Куплено армій: ${action.count}` : `Bought armies: ${action.count}`;
    case 'upgradeCity':
      return lang === 'ru' ? `Улучшен город: ${action.city}` : lang === 'uk' ? `Покращено місто: ${action.city}` : `Upgraded city: ${action.city}`;
    case 'attack':
      return lang === 'ru'
        ? `Атака на ${action.targetCountry}, город ${action.targetCity}, армия: ${action.army}`
        : lang === 'uk'
        ? `Атака на ${action.targetCountry}, місто ${action.targetCity}, армія: ${action.army}`
        : `Attack on ${action.targetCountry}, city ${action.targetCity}, army: ${action.army}`;
    case 'developNuclear':
      return lang === 'ru' ? 'Развитие ядерного оружия' : lang === 'uk' ? 'Розвиток ядерної зброї' : 'Developed nuclear weapon';
    case 'setSanction':
      return lang === 'ru' ? `Санкции против ${action.targetCountry}` : lang === 'uk' ? `Санкції проти ${action.targetCountry}` : `Sanctioned ${action.targetCountry}`;
    default:
      return lang === 'ru' ? 'Действие' : lang === 'uk' ? 'Дія' : 'Action';
  }
}