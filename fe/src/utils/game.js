export function buyArmy({ budget, army, armyCost = 0, count = 1 }) {
  if (budget < armyCost * count) return { success: false, error: 'Недостаточно бюджета' };
  return {
    budget: budget - armyCost * count,
    army: army + count,
    success: true,
    effectDescription: `Your military strength increased by ${count}`,
    effectImpact: 'positive'
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
    success: true,
    effectDescription: `${cityName} stability fully restored to 100%`,
    effectImpact: 'positive',
    cityAffected: cityName
  };
}

export function developNuclear({ budget, nuclearLevel, nuclearCost }) {
  if (budget < nuclearCost) return { success: false, error: 'Недостаточно бюджета' };
  return {
    budget: budget - nuclearCost,
    nuclearLevel: nuclearLevel + 1,
    success: true,
    effectDescription: `Nuclear program advanced to level ${nuclearLevel + 1}`,
    effectImpact: 'positive',
    globalInfluence: nuclearLevel * 5 // Each nuclear level adds 5% to global influence
  };
}

export function setSanction({ sanctions, country, value }) {
  const updated = sanctions.map(s =>
    s.country === country ? { ...s, value } : s
  );
  return {
    sanctions: updated,
    success: true,
    effectDescription: `Sanctions against ${country} established`,
    effectImpact: 'neutral',
    diplomaticEffect: -20, // Negative diplomatic relations with sanctioned country
    targetCountry: country
  };
}

export function annexTerritory({ annexed, city, income, countryName }) {
  return {
    annexed: [...annexed, { city, income }],
    success: true,
    effectDescription: `Territory ${city} annexed successfully`,
    effectImpact: 'positive',
    territoryGained: city,
    incomeGained: income,
    stabilityImpact: -15, // Annexation reduces stability temporarily
    globalReputationImpact: -25 // Global reputation decreases with annexations
  };
}

// New function: Research technology
export function researchTechnology({ budget, techLevel, techCost, techName }) {
  if (budget < techCost) return { success: false, error: 'Недостаточно бюджета' };
  return {
    budget: budget - techCost,
    techLevel: techLevel + 1,
    success: true,
    effectDescription: `Research in ${techName} advanced to level ${techLevel + 1}`,
    effectImpact: 'positive',
    technologyGained: techName,
    productivityBonus: techLevel * 3 // Each tech level adds 3% to national productivity
  };
}

// Utility: Format timer as MM:SS
export function formatTime(t) {
  const m = Math.floor(t / 60).toString().padStart(2, '0');
  const s = (t % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// New function: Establish diplomatic relations
export function establishDiplomacy({ targetCountry, relationLevel = 'friendly' }) {
  const impactMap = {
    'friendly': { reputation: 15, tradePotential: 10, stabilityBoost: 5 },
    'neutral': { reputation: 5, tradePotential: 5, stabilityBoost: 2 },
    'tense': { reputation: -10, tradePotential: -5, stabilityBoost: -5 }
  };

  const impact = impactMap[relationLevel] || impactMap['neutral'];
  
  return {
    success: true,
    effectDescription: `Diplomatic relations with ${targetCountry} established as ${relationLevel}`,
    effectImpact: relationLevel === 'friendly' ? 'positive' : (relationLevel === 'tense' ? 'negative' : 'neutral'),
    targetCountry,
    relationLevel,
    ...impact
  };
}

// New function: Invest in infrastructure
export function investInInfrastructure({ budget, investmentAmount, cityName }) {
  if (budget < investmentAmount) return { success: false, error: 'Недостаточно бюджета' };
  
  const stabilityGain = Math.floor(investmentAmount / 100); // Every 100 units gives 1% stability
  const economyBoost = Math.floor(investmentAmount / 200); // Every 200 units gives 1% economy boost
  
  return {
    budget: budget - investmentAmount,
    success: true,
    effectDescription: `Infrastructure investment in ${cityName} completed`,
    effectImpact: 'positive',
    cityAffected: cityName,
    stabilityGain,
    economyBoost,
    infrastructureLevel: economyBoost
  };
}

// Utility: Action description for summary
export function actionDescription(action, lang = 'en') {
  const descriptions = {
    'en': {
      'buyArmy': `Bought armies: ${action.count}`,
      'upgradeCity': `Upgraded city: ${action.city}`,
      'attack': `Attack on ${action.targetCountry}, city ${action.targetCity}, army: ${action.army}`,
      'developNuclear': `Developed nuclear weapon to level ${action.level || 1}`,
      'setSanction': `Sanctioned ${action.targetCountry}`,
      'researchTechnology': `Researched ${action.techName || 'technology'} to level ${action.level || 1}`,
      'establishDiplomacy': `Established ${action.relationLevel || 'neutral'} relations with ${action.targetCountry}`,
      'investInInfrastructure': `Invested ${action.amount} in ${action.cityName} infrastructure`,
      'default': 'Action'
    },
    'ru': {
      'buyArmy': `Куплено армий: ${action.count}`,
      'upgradeCity': `Улучшен город: ${action.city}`,
      'attack': `Атака на ${action.targetCountry}, город ${action.targetCity}, армия: ${action.army}`,
      'developNuclear': `Развитие ядерного оружия до уровня ${action.level || 1}`,
      'setSanction': `Санкции против ${action.targetCountry}`,
      'researchTechnology': `Исследована технология ${action.techName || 'technology'} до уровня ${action.level || 1}`,
      'establishDiplomacy': `Установлены ${action.relationLevel === 'friendly' ? 'дружеские' : (action.relationLevel === 'tense' ? 'напряжённые' : 'нейтральные')} отношения с ${action.targetCountry}`,
      'investInInfrastructure': `Инвестировано ${action.amount} в инфраструктуру ${action.cityName}`,
      'default': 'Действие'
    },
    'uk': {
      'buyArmy': `Куплено армій: ${action.count}`,
      'upgradeCity': `Покращено місто: ${action.city}`,
      'attack': `Атака на ${action.targetCountry}, місто ${action.targetCity}, армія: ${action.army}`,
      'developNuclear': `Розвиток ядерної зброї до рівня ${action.level || 1}`,
      'setSanction': `Санкції проти ${action.targetCountry}`,
      'researchTechnology': `Досліджено технологію ${action.techName || 'technology'} до рівня ${action.level || 1}`,
      'establishDiplomacy': `Встановлено ${action.relationLevel === 'friendly' ? 'дружні' : (action.relationLevel === 'tense' ? 'напружені' : 'нейтральні')} відносини з ${action.targetCountry}`,
      'investInInfrastructure': `Інвестовано ${action.amount} в інфраструктуру ${action.cityName}`,
      'default': 'Дія'
    }
  };

  const langDescriptions = descriptions[lang] || descriptions['en'];
  return langDescriptions[action.type] || langDescriptions['default'];
}