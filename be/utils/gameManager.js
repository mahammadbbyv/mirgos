/**
 * Game State Manager Module
 * Handles game state management for the Mirgos application
 */

// Country name mapping with multilingual support
const countryLangMap = {
  'France':     { en: 'France', ru: 'Франция', uk: 'Франція' },
  'Germany':    { en: 'Germany', ru: 'Германия', uk: 'Німеччина' },
  'Israel':     { en: 'Israel', ru: 'Израиль', uk: 'Ізраїль' },
  'Kazakhstan': { en: 'Kazakhstan', ru: 'Казахстан', uk: 'Казахстан' },
  'North Korea':{ en: 'North Korea', ru: 'Северная Корея', uk: 'Північна Корея' },
  'Russia':     { en: 'Russia', ru: 'Россия', uk: 'Росія' },
  'Ukraine':    { en: 'Ukraine', ru: 'Украина', uk: 'Україна' },
  'USA':        { en: 'USA', ru: 'США', uk: 'США' },
};

// Initialize cities for a country
const initializeCountryCities = (country) => {
  let cities = [];
  switch (country) {
    case 'France':
      cities = [
        { name_en: 'Paris', name_ru: 'Париж', name_uk: 'Париж', shield: 0, level: 1, income: 120, defense: 0, stability: 100 },
        { name_en: 'Lyon', name_ru: 'Лион', name_uk: 'Ліон', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
        { name_en: 'Marseille', name_ru: 'Марсель', name_uk: 'Марсель', shield: 0, level: 1, income: 90, defense: 0, stability: 100 },
        { name_en: 'Nantes', name_ru: 'Нант', name_uk: 'Нант', shield: 0, level: 1, income: 80, defense: 0, stability: 100 },
      ]; break;
    case 'Germany':
      cities = [
        { name_en: 'Berlin', name_ru: 'Берлин', name_uk: 'Берлін', shield: 0, level: 1, income: 120, defense: 0, stability: 100 },
        { name_en: 'Leipzig', name_ru: 'Лейпциг', name_uk: 'Лейпциг', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
        { name_en: 'Frankfurt', name_ru: 'Франкфурт', name_uk: 'Франкфурт', shield: 0, level: 1, income: 90, defense: 0, stability: 100 },
        { name_en: 'Rhein', name_ru: 'Рейн', name_uk: 'Рейн', shield: 0, level: 1, income: 80, defense: 0, stability: 100 },
      ]; break;
    case 'Israel':
      cities = [
        { name_en: 'Jerusalem', name_ru: 'Иерусалим', name_uk: 'Єрусалим', shield: 0, level: 1, income: 120, defense: 0, stability: 100 },
        { name_en: 'Tel Aviv', name_ru: 'Тель-Авив', name_uk: 'Тель-Авів', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
        { name_en: 'Akko', name_ru: 'Акко', name_uk: 'Ако', shield: 0, level: 1, income: 90, defense: 0, stability: 100 },
        { name_en: 'Ashkelon', name_ru: 'Ашкелон', name_uk: 'Ашкелон', shield: 0, level: 1, income: 80, defense: 0, stability: 100 },
      ]; break;
    case 'Kazakhstan':
      cities = [
        { name_en: 'Nur-Sultan', name_ru: 'Нур-Султан', name_uk: 'Нур-Султан', shield: 0, level: 1, income: 120, defense: 0, stability: 100 },
        { name_en: 'Almaty', name_ru: 'Алматы', name_uk: 'Алмати', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
        { name_en: 'Shymkent', name_ru: 'Шымкент', name_uk: 'Шимкент', shield: 0, level: 1, income: 90, defense: 0, stability: 100 },
        { name_en: 'Karaganda', name_ru: 'Караганда', name_uk: 'Караганда', shield: 0, level: 1, income: 80, defense: 0, stability: 100 },
      ]; break;
    case 'North Korea':
      cities = [
        { name_en: 'Pyongyang', name_ru: 'Пхеньян', name_uk: 'Пхеньян', shield: 0, level: 1, income: 120, defense: 0, stability: 100 },
        { name_en: 'Kaesong', name_ru: 'Кэсон', name_uk: 'Кесон', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
        { name_en: 'Nampo', name_ru: 'Нампо', name_uk: 'Нампо', shield: 0, level: 1, income: 90, defense: 0, stability: 100 },
        { name_en: 'Wonsan', name_ru: 'Вонсан', name_uk: 'Вонсан', shield: 0, level: 1, income: 80, defense: 0, stability: 100 },
      ]; break;
    case 'Russia':
      cities = [
        { name_en: 'Moscow', name_ru: 'Москва', name_uk: 'Москва', shield: 0, level: 1, income: 120, defense: 0, stability: 100 },
        { name_en: 'Saint Petersburg', name_ru: 'Питер', name_uk: 'Пітер', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
        { name_en: 'Crimea', name_ru: 'Крым', name_uk: 'Крим', shield: 0, level: 1, income: 90, defense: 0, stability: 100 },
        { name_en: 'Novosibirsk', name_ru: 'Новосибирск', name_uk: 'Новосибірськ', shield: 0, level: 1, income: 80, defense: 0, stability: 100 },
      ]; break;
    case 'Ukraine':
      cities = [
        { name_en: 'Kyiv', name_uk: 'Київ', name_ru: 'Киев', shield: 0, level: 1, income: 120, defense: 0, stability: 100 },
        { name_en: 'Lviv', name_uk: 'Львів', name_ru: 'Львов', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
        { name_en: 'Kharkiv', name_uk: 'Харків', name_ru: 'Харьков', shield: 0, level: 1, income: 90, defense: 0, stability: 100 },
        { name_en: 'Odesa', name_uk: 'Одеса', name_ru: 'Одесса', shield: 0, level: 1, income: 80, defense: 0, stability: 100 },
      ]; break;
    case 'USA':
      cities = [
        { name_en: 'Washington DC', name_ru: 'Вашингтон ДС', name_uk: 'Вашингтон ДС', shield: 0, level: 1, income: 120, defense: 0, stability: 100 },
        { name_en: 'New York', name_ru: 'Нью-Йорк', name_uk: 'Нью-Йорк', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
        { name_en: 'San Francisco', name_ru: 'Сан-Франциско', name_uk: 'Сан-Франциско', shield: 0, level: 1, income: 90, defense: 0, stability: 100 },
        { name_en: 'Las Vegas', name_ru: 'Лас-Вегас', name_uk: 'Лас-Вегас', shield: 0, level: 1, income: 80, defense: 0, stability: 100 },
      ]; break;
    default:
      cities = [
        { name_en: country + ' City 1', name_ru: country + ' Город 1', name_uk: country + ' Місто 1', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
        { name_en: country + ' City 2', name_ru: country + ' Город 2', name_uk: country + ' Місто 2', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
        { name_en: country + ' City 3', name_ru: country + ' Город 3', name_uk: country + ' Місто 3', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
        { name_en: country + ' City 4', name_ru: country + ' Город 4', name_uk: country + ' Місто 4', shield: 0, level: 1, income: 100, defense: 0, stability: 100 },
      ]; break;
  }
  return cities;
};

// Initialize game state with all countries
const initializeGameState = (lobby) => {
  if (!lobby) return null;
  
  // Save selected countries for each player (with all language variants)
  const playerCountries = {};
  for (const [name, info] of lobby.players.entries()) {
    const country = info.country;
    playerCountries[name] = countryLangMap[country] || { en: country, ru: country, uk: country };
  }
  
  // Save all countries in this game (for frontend language toggle)
  const countryNames = {};
  for (const c of Object.values(playerCountries)) {
    countryNames[c.en] = c;
  }
  
  // Initialize game state
  const gameState = {
    round: 1,
    playerCountries, // { playerName: {en,ru,uk} }
    countryNames,    // { enName: {en,ru,uk} }
    actions: {},     // { playerName: [actions] }
    finished: {},    // { playerName: true/false }
    cities: {},
    armies: {},
    budgets: {},
    stability: {},
    nuclear: {},
    sanctions: {},
    technologies: {},
    relations: {},
    roundStartTime: new Date().toISOString(),
  };
  
  // Initialize cities, armies, budgets, stability for each country
  for (const c of Object.values(playerCountries)) {
    const country = c.en;
    gameState.cities[country] = initializeCountryCities(country);
    gameState.armies[country] = 0;
    gameState.budgets[country] = 1000;
    gameState.stability[country] = 100;
    gameState.nuclear[country] = 0;
    gameState.technologies[country] = {
      military: 0,
      economic: 0,
      infrastructure: 0,
    };
  }
  
  // Set initialized game state on lobby
  lobby.gameState = gameState;
  
  return gameState;
};

// Process player actions and update game state
const processActionsAndUpdateGameState = (lobby) => {
  if (!lobby || !lobby.gameState) return false;
  
  const gameState = lobby.gameState;
  const actionsByPlayer = gameState.actions;
  const allPlayers = Object.keys(gameState.playerCountries);
  
  // 1. Collect income for all countries
  for (const country of Object.keys(gameState.cities)) {
    const income = gameState.cities[country].reduce((sum, c) => sum + c.income, 0);
    gameState.budgets[country] += income;
  }
  
  // 2. Process all actions
  for (const player of allPlayers) {
    const countryObj = gameState.playerCountries[player];
    const country = countryObj.en;
    const actions = actionsByPlayer[player] || [];
    
    for (const action of actions) {
      switch (action.type) {
        case 'buyArmy':
          const armyCost = 300 * (action.count || 1);
          if (gameState.budgets[country] >= armyCost) {
            gameState.budgets[country] -= armyCost;
            gameState.armies[country] += (action.count || 1);
          }
          break;
          
        case 'upgradeCity':
          const city = gameState.cities[country].find(c => 
            c.name_en === action.city || c.name === action.city
          );
          if (city && gameState.budgets[country] >= 500) {
            city.level += 1;
            city.income += 50;
            city.shield = Math.min(3, (city.shield || 0) + 1);
            gameState.budgets[country] -= 500;
          }
          break;
          
        case 'attack':
          const targetCountry = action.targetCountry;
          const targetCityName = action.targetCity;
          const attackForce = action.army;
          
          if (gameState.armies[country] >= attackForce && targetCountry && targetCityName) {
            const targetCity = gameState.cities[targetCountry]?.find(c => 
              c.name_en === targetCityName || c.name === targetCityName
            );
            
            if (targetCity) {
              // Attack logic would go here
              gameState.armies[country] -= attackForce;
            }
          }
          break;
          
        case 'developNuclear':
          if (!gameState.nuclear) gameState.nuclear = {};
          if (gameState.nuclear[country] === undefined) gameState.nuclear[country] = 0;
          
          if (gameState.budgets[country] >= 450 && gameState.nuclear[country] < 3) {
            gameState.budgets[country] -= 450;
            gameState.nuclear[country]++;
          }
          break;
          
        case 'setSanction':
          if (!gameState.sanctions) gameState.sanctions = {};
          // Sanction for 2 rounds by default
          gameState.sanctions[action.targetCountry] = 2;
          break;
        
        case 'researchTechnology':
          if (!gameState.technologies) gameState.technologies = {};
          if (!gameState.technologies[country]) gameState.technologies[country] = {};
          
          const techName = action.techName;
          const cost = action.cost || 400;
          if (gameState.budgets[country] >= cost) {
            if (!gameState.technologies[country][techName]) {
              gameState.technologies[country][techName] = 0;
            }
            gameState.technologies[country][techName]++;
            gameState.budgets[country] -= cost;
          }
          break;
      }
    }
  }
  
  // 3. Apply sanctions (reduce income for sanctioned countries)
  if (gameState.sanctions) {
    for (const [country, rounds] of Object.entries(gameState.sanctions)) {
      if (rounds > 0) {
        const income = gameState.cities[country].reduce((sum, c) => sum + c.income, 0);
        gameState.budgets[country] -= income;
        gameState.sanctions[country]--;
        if (gameState.sanctions[country] <= 0) {
          delete gameState.sanctions[country];
        }
      }
    }
  }
  
  return true;
};

// Prepare game state for next round
const prepareNextRound = (lobby) => {
  if (!lobby || !lobby.gameState) return false;
  
  const gameState = lobby.gameState;
  
  // Increment round
  gameState.round++;
  
  // Reset actions and finished state
  gameState.actions = {};
  gameState.finished = {};
  
  // Set new round start time
  gameState.roundStartTime = new Date().toISOString();
  
  return true;
};

// Get formatted game state for client
const getGameStateForClient = (lobby) => {
  if (!lobby || !lobby.gameState) return null;
  
  // Create a clean copy of game state with current player list
  const clientState = { ...lobby.gameState };
  
  // Add players array for frontend chat dropdown
  clientState.players = Array.from(lobby.players.keys());
  
  return clientState;
};

module.exports = {
  countryLangMap,
  initializeCountryCities,
  initializeGameState,
  processActionsAndUpdateGameState,
  prepareNextRound,
  getGameStateForClient
};
