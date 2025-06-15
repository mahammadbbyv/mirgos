import React, { useState, useMemo } from 'react';
import { useGame } from '../../context/GameContext-refactored';
import GamePanel from '../UI/GamePanel';
import SectionModal from '../UI/SectionModal';
import { FaFlask, FaHandshake, FaRoad, FaBomb } from 'react-icons/fa';

/**
 * Actions panel with available game actions
 */
const ActionsPanel = () => {
  const {
    openSection,
    setOpenSection,
    armyCount, 
    setArmyCount,
    upgradeCity,
    sanctionTarget,
    setSanctionTarget,
    handleBuyArmy, 
    handleUpgradeCity,
    handleDevelopNuclear,
    handleSetSanction,
    finished,
    allCountryEnNames,
    myCountryObj,
    gameState,
    myCities,
    myBudget,
    lang
  } = useGame();

  // New local state for enhanced actions
  const [selectedTech, setSelectedTech] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState(100);
  const [diplomacyTarget, setDiplomacyTarget] = useState('');
  const [diplomacyLevel, setDiplomacyLevel] = useState('friendly');

  // Memoized technology options to prevent unnecessary re-renders
  const techOptions = useMemo(() => [
    { id: 'military', name: 'Military Technology', cost: 300, description: 'Increases army effectiveness by 10%' },
    { id: 'economy', name: 'Economic Innovation', cost: 500, description: 'Increases income by 15%' },
    { id: 'science', name: 'Scientific Research', cost: 400, description: 'Unlocks new action options' },
    { id: 'infrastructure', name: 'Infrastructure', cost: 350, description: 'Improves city stability' }
  ], []);

  // Actions list for reference
  const actionsList = [
    { name: 'Buy Army', desc: 'Purchase army units for attack/defense.', cost: '$300/unit', effect: '+1 Army per unit' },
    { name: 'Upgrade City', desc: 'Increase city level for more income and defense.', cost: '$500', effect: '+1 Level, +50 Income, +Shield' },
    { name: 'Repair City', desc: 'Restore city stability after attack.', cost: 'Varies', effect: 'Stability restored to 100' },
    { name: 'Attack', desc: 'Attack another city\'s defenses.', cost: 'Army units used', effect: 'Capture city, reduce stability' },
    { name: 'Develop Nuclear', desc: 'Increase nuclear weapon level (1–3).', cost: '$450/level', effect: 'Chance to create bomb (50%)' },
    { name: 'Use Nuclear', desc: 'Detonate nuclear bomb on a city.', cost: 'Bomb (if available)', effect: 'Massive damage, global stability drop' },
    { name: 'Sanction', desc: 'Suspend a country\'s income for 1–3 turns.', cost: '—', effect: 'Target loses income for duration' },
    { name: 'Form Alliance', desc: 'Form a diplomatic alliance with another player.', cost: '—', effect: 'Joint actions, shared defense' },
    { name: 'Trade', desc: 'Trade resources with another player.', cost: 'Negotiated', effect: 'Exchange budget, army, or cities' },
    { name: 'Research Technology', desc: 'Research advanced technology.', cost: '$300-500', effect: 'Unlock bonuses and special abilities' },
    { name: 'Infrastructure', desc: 'Invest in city infrastructure.', cost: 'Variable', effect: 'Increase stability and income' },
    { name: 'Diplomacy', desc: 'Establish diplomatic relations.', cost: '—', effect: 'Trade benefits, defense pacts, influence' }
  ];

  // Helper function to handle research technology
  const handleResearchTech = () => {
    if (!selectedTech) return;
    const tech = techOptions.find(t => t.id === selectedTech);
    if (!tech) return;
    
    // TODO: Implement the actual action in GameContext
    console.log(`Researching ${tech.name} for ${tech.cost}`);
    
    // Reset selection after action
    setSelectedTech('');
  };

  // Helper function to handle infrastructure investment
  const handleInfrastructureInvestment = () => {
    if (!selectedCity || investmentAmount <= 0) return;
    
    // TODO: Implement the actual action in GameContext
    console.log(`Investing ${investmentAmount} in ${selectedCity} infrastructure`);
    
    // Reset selection after action
    setSelectedCity('');
    setInvestmentAmount(100);
  };

  // Helper function to handle diplomacy
  const handleDiplomacy = () => {
    if (!diplomacyTarget) return;
    
    // TODO: Implement the actual action in GameContext
    console.log(`Establishing ${diplomacyLevel} relations with ${diplomacyTarget}`);
    
    // Reset selection after action
    setDiplomacyTarget('');
  };

  return (
    <>
      <GamePanel
        title="Actions"
        onExpand={() => setOpenSection('actions')}
        expandLabel="Expand Actions"
        className="max-w-md flex flex-col"
      >
        <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-900/80 shadow-inner flex-1">
          <table className="min-w-full text-sm text-left text-white whitespace-nowrap">
            <thead>
              <tr className="bg-gray-900/80">
                <th className="px-2 py-2 font-bold text-blue-200">Action</th>
                <th className="px-2 py-2 font-bold text-blue-200">Description</th>
                <th className="px-2 py-2 font-bold text-blue-200">Cost</th>
                <th className="px-2 py-2 font-bold text-blue-200">Effect</th>
              </tr>
            </thead>
            <tbody>
              {actionsList.slice(0, 5).map((action, index) => (
                <tr key={index}>
                  <td className="font-semibold text-yellow-200 px-2 py-1">{action.name}</td>
                  <td className="px-2 py-1">{action.desc}</td>
                  <td className="px-2 py-1">{action.cost}</td>
                  <td className="px-2 py-1">{action.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xl mt-8">
          {/* Military Actions */}
          <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700">
            <h3 className="text-blue-300 text-lg font-bold mb-4">Military</h3>
            <div className="space-y-4">
              <div className="flex gap-2 items-center">
                <input 
                  type="number" 
                  min={1} 
                  max={10} 
                  value={armyCount} 
                  onChange={e => setArmyCount(Number(e.target.value))} 
                  className="w-20 bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 transition-all" 
                />
                <button 
                  className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-xs text-white shadow focus:ring-2 focus:ring-blue-400 transition-all flex items-center gap-2" 
                  onClick={handleBuyArmy} 
                  disabled={finished}
                >
                  Buy Army
                </button>
              </div>
              
              <div className="flex gap-2 items-center">
                <button 
                  className={`bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-xs text-white shadow focus:ring-2 focus:ring-blue-400 transition-all ${!upgradeCity ? 'opacity-60 cursor-not-allowed' : ''}`} 
                  onClick={handleUpgradeCity} 
                  disabled={finished || !upgradeCity}
                >
                  Upgrade City {upgradeCity && `(${upgradeCity})`}
                </button>
              </div>

              <div className="flex gap-2 items-center">
                <button 
                  className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-xs text-white shadow focus:ring-2 focus:ring-red-400 transition-all flex items-center gap-2" 
                  onClick={handleDevelopNuclear}
                  disabled={finished}
                >
                  <FaBomb className="text-xs" /> Develop Nuclear
                </button>
              </div>
            </div>
          </div>

          {/* Diplomatic Actions */}
          <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700">
            <h3 className="text-blue-300 text-lg font-bold mb-4">Diplomacy</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <select
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 transition-all text-xs"
                  value={sanctionTarget}
                  onChange={(e) => setSanctionTarget(e.target.value)}
                  disabled={finished}
                >
                  <option value="">Select country to sanction</option>
                  {allCountryEnNames
                    .filter(name => name !== myCountryObj?.en)
                    .map(name => (
                      <option key={name} value={name}>
                        {gameState?.countryNames?.[name]?.[lang] || name}
                      </option>
                    ))}
                </select>
                <button
                  className={`bg-orange-700 hover:bg-orange-800 px-3 py-1 rounded text-xs text-white shadow focus:ring-2 focus:ring-orange-400 transition-all ${!sanctionTarget ? 'opacity-60 cursor-not-allowed' : ''}`}
                  onClick={handleSetSanction}
                  disabled={finished || !sanctionTarget}
                >
                  Set Sanctions
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <select
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 transition-all text-xs"
                  value={diplomacyTarget}
                  onChange={(e) => setDiplomacyTarget(e.target.value)}
                  disabled={finished}
                >
                  <option value="">Select country for diplomacy</option>
                  {allCountryEnNames
                    .filter(name => name !== myCountryObj?.en)
                    .map(name => (
                      <option key={name} value={name}>
                        {gameState?.countryNames?.[name]?.[lang] || name}
                      </option>
                    ))}
                </select>
                <select
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 transition-all text-xs"
                  value={diplomacyLevel}
                  onChange={(e) => setDiplomacyLevel(e.target.value)}
                  disabled={finished}
                >
                  <option value="friendly">Friendly Relations</option>
                  <option value="neutral">Neutral Relations</option>
                  <option value="tense">Tense Relations</option>
                </select>
                <button
                  className="flex items-center gap-2 bg-green-700 hover:bg-green-800 px-3 py-1 rounded text-xs text-white shadow focus:ring-2 focus:ring-green-400 transition-all"
                  onClick={handleDiplomacy}
                  disabled={finished || !diplomacyTarget}
                >
                  <FaHandshake className="text-xs" /> Establish Relations
                </button>
              </div>
            </div>
          </div>

          {/* Development Actions */}
          <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700">
            <h3 className="text-blue-300 text-lg font-bold mb-4">Development</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <select
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 transition-all text-xs"
                  value={selectedTech}
                  onChange={(e) => setSelectedTech(e.target.value)}
                  disabled={finished}
                >
                  <option value="">Select technology to research</option>
                  {techOptions.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name} (${tech.cost})
                    </option>
                  ))}
                </select>
                <button
                  className="flex items-center gap-2 bg-purple-700 hover:bg-purple-800 px-3 py-1 rounded text-xs text-white shadow focus:ring-2 focus:ring-purple-400 transition-all"
                  onClick={handleResearchTech}
                  disabled={finished || !selectedTech}
                >
                  <FaFlask className="text-xs" /> Research
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <select
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 transition-all text-xs"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  disabled={finished}
                >
                  <option value="">Select city for infrastructure</option>
                  {myCities.map(city => (
                    <option key={city.name} value={city.name}>
                      {city.displayName || city.name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={100}
                    max={1000}
                    step={50}
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                    className="w-24 bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 transition-all text-xs"
                    disabled={finished}
                  />
                  <button
                    className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 px-3 py-1 rounded text-xs text-white shadow focus:ring-2 focus:ring-teal-400 transition-all"
                    onClick={handleInfrastructureInvestment}
                    disabled={finished || !selectedCity}
                  >
                    <FaRoad className="text-xs" /> Invest
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Summary */}
          <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700">
            <h3 className="text-blue-300 text-lg font-bold mb-4">Budget</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Available:</span>
                <span className="text-xl font-bold text-green-400">${myBudget || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Army Units:</span>
                <span className="text-lg font-semibold text-blue-400">{myBudget ? Math.floor(myBudget / 300) : 0} units max</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">City Upgrades:</span>
                <span className="text-lg font-semibold text-purple-400">{myBudget ? Math.floor(myBudget / 500) : 0} cities max</span>
              </div>
            </div>
          </div>
        </div>
      </GamePanel>
      
      <SectionModal open={openSection === 'actions'} onClose={() => setOpenSection(null)}>
        <h2 className="text-3xl font-bold mb-8 text-blue-300">Available Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-yellow-300">Military</h3>
            <div className="flex flex-col gap-4 bg-gray-800/70 p-4 rounded-lg border border-gray-700">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">Army Units</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={armyCount}
                    onChange={e => setArmyCount(Number(e.target.value))}
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-24 p-2.5"
                  />
                  <button
                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg focus:ring-4 focus:outline-none focus:ring-blue-900"
                    onClick={handleBuyArmy}
                    disabled={finished}
                  >
                    Buy Army (${armyCount * 300})
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  Current army: <span className="font-semibold">{gameState?.armies?.[myCountryObj?.en] || 0} units</span>
                </p>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">Nuclear Program</label>
                <button
                  className="px-5 py-2.5 text-sm font-medium text-white bg-red-700 hover:bg-red-800 rounded-lg focus:ring-4 focus:outline-none focus:ring-red-900"
                  onClick={handleDevelopNuclear}
                  disabled={finished}
                >
                  Develop Nuclear ($450)
                </button>
                <p className="mt-2 text-sm text-gray-400">
                  Current level: <span className="font-semibold">{gameState?.nuclearLevels?.[myCountryObj?.en] || 0}</span>
                </p>
              </div>
            </div>

            <h3 className="text-2xl font-semibold text-yellow-300">Diplomacy</h3>
            <div className="flex flex-col gap-4 bg-gray-800/70 p-4 rounded-lg border border-gray-700">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">Sanctions</label>
                <div className="flex gap-2">
                  <select
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    value={sanctionTarget}
                    onChange={(e) => setSanctionTarget(e.target.value)}
                    disabled={finished}
                  >
                    <option value="">Select country</option>
                    {allCountryEnNames
                      .filter(name => name !== myCountryObj?.en)
                      .map(name => (
                        <option key={name} value={name}>
                          {gameState?.countryNames?.[name]?.[lang] || name}
                        </option>
                      ))}
                  </select>
                  <button
                    className="px-5 py-2.5 text-sm font-medium text-white bg-orange-700 hover:bg-orange-800 rounded-lg focus:ring-4 focus:outline-none focus:ring-orange-900"
                    onClick={handleSetSanction}
                    disabled={finished || !sanctionTarget}
                  >
                    Set Sanctions
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">Diplomatic Relations</label>
                <div className="grid grid-cols-1 gap-2">
                  <select
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    value={diplomacyTarget}
                    onChange={(e) => setDiplomacyTarget(e.target.value)}
                    disabled={finished}
                  >
                    <option value="">Select country</option>
                    {allCountryEnNames
                      .filter(name => name !== myCountryObj?.en)
                      .map(name => (
                        <option key={name} value={name}>
                          {gameState?.countryNames?.[name]?.[lang] || name}
                        </option>
                      ))}
                  </select>
                  <div className="flex gap-2">
                    <select
                      className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      value={diplomacyLevel}
                      onChange={(e) => setDiplomacyLevel(e.target.value)}
                      disabled={finished}
                    >
                      <option value="friendly">Friendly Relations</option>
                      <option value="neutral">Neutral Relations</option>
                      <option value="tense">Tense Relations</option>
                    </select>
                    <button
                      className="px-5 py-2.5 text-sm font-medium text-white bg-green-700 hover:bg-green-800 rounded-lg focus:ring-4 focus:outline-none focus:ring-green-900"
                      onClick={handleDiplomacy}
                      disabled={finished || !diplomacyTarget}
                    >
                      Establish
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-yellow-300">Development</h3>
            <div className="flex flex-col gap-4 bg-gray-800/70 p-4 rounded-lg border border-gray-700">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">Research Technology</label>
                <div className="grid grid-cols-1 gap-2">
                  <select
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    value={selectedTech}
                    onChange={(e) => setSelectedTech(e.target.value)}
                    disabled={finished}
                  >
                    <option value="">Select technology</option>
                    {techOptions.map(tech => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name} (${tech.cost})
                      </option>
                    ))}
                  </select>
                  <button
                    className="px-5 py-2.5 text-sm font-medium text-white bg-purple-700 hover:bg-purple-800 rounded-lg focus:ring-4 focus:outline-none focus:ring-purple-900"
                    onClick={handleResearchTech}
                    disabled={finished || !selectedTech}
                  >
                    Research Technology
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  {selectedTech && techOptions.find(t => t.id === selectedTech)?.description}
                </p>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">Infrastructure Investment</label>
                <div className="grid grid-cols-1 gap-2">
                  <select
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    disabled={finished}
                  >
                    <option value="">Select city</option>
                    {myCities.map(city => (
                      <option key={city.name} value={city.name}>
                        {city.displayName || city.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={100}
                      max={2000}
                      step={50}
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                      className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      disabled={finished}
                    />
                    <button
                      className="px-5 py-2.5 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg focus:ring-4 focus:outline-none focus:ring-teal-900"
                      onClick={handleInfrastructureInvestment}
                      disabled={finished || !selectedCity}
                    >
                      Invest
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  Estimated effects: +{Math.floor(investmentAmount / 100)}% stability, +{Math.floor(investmentAmount / 200)}% economy
                </p>
              </div>
            </div>

            <h3 className="text-2xl font-semibold text-yellow-300">Budget Summary</h3>
            <div className="flex flex-col gap-4 bg-gray-800/70 p-4 rounded-lg border border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Available Budget:</span>
                <span className="text-xl font-bold text-green-400">${myBudget || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Estimated Next Round Income:</span>
                <span className="text-lg font-semibold text-blue-400">+${gameState?.incomes?.[myCountryObj?.en] || 0}</span>
              </div>
              <div className="border-t border-gray-700 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Army Strength:</span>
                <span className="text-lg font-semibold text-orange-400">{gameState?.armies?.[myCountryObj?.en] || 0} units</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Cities Owned:</span>
                <span className="text-lg font-semibold text-indigo-400">{myCities?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </SectionModal>
    </>
  );
};

export default ActionsPanel;
