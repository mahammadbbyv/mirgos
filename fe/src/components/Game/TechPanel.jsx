import React, { useState } from 'react';
import { useGame } from '../../context/GameContext-refactored';
import GamePanel from '../UI/GamePanel';
import SectionModal from '../UI/SectionModal';

/**
 * Technology research panel for the Mirgos game
 * Shows available technologies and research progress
 */
const TechPanel = () => {
  const {
    gameState,
    myCountryObj,
    myBudget,
    openSection,
    setOpenSection,
    handleResearchTechnology,
    finished,
    lang
  } = useGame();

  // Local state for technology costs
  const [selectedTech, setSelectedTech] = useState(null);
  
  // Available technologies with their descriptions and costs
  const availableTechnologies = [
    {
      id: 'agriculture',
      name: 'Agriculture',
      icon: '🌾',
      baseDescription: 'Improves food production and city income',
      costFormula: level => 500 + (level * 300),
      benefits: level => ({
        incomeBoost: level * 2,
        stabilityBoost: level * 1
      })
    },
    {
      id: 'industry',
      name: 'Industry',
      icon: '🏭',
      baseDescription: 'Enhances production efficiency and economic output',
      costFormula: level => 600 + (level * 400),
      benefits: level => ({
        productionBoost: level * 3,
        incomeBoost: level * 3,
        stabilityPenalty: level * 0.5
      })
    },
    {
      id: 'military',
      name: 'Military Science',
      icon: '🛡️',
      baseDescription: 'Improves army effectiveness and defense capabilities',
      costFormula: level => 800 + (level * 500),
      benefits: level => ({
        armyEffectiveness: level * 5,
        defensiveBonus: level * 3
      })
    },
    {
      id: 'diplomacy',
      name: 'Diplomatic Relations',
      icon: '🤝',
      baseDescription: 'Enhances international influence and negotiation capabilities',
      costFormula: level => 400 + (level * 200),
      benefits: level => ({
        diplomaticPower: level * 4,
        sanctionResistance: level * 2
      })
    },
    {
      id: 'infrastructure',
      name: 'Infrastructure',
      icon: '🏗️',
      baseDescription: 'Improves city development and growth potential',
      costFormula: level => 700 + (level * 350),
      benefits: level => ({
        cityGrowthRate: level * 2,
        stabilityBoost: level * 2,
        incomeBoost: level * 1.5
      })
    },
    {
      id: 'education',
      name: 'Education',
      icon: '🎓',
      baseDescription: 'Enhances research speed and technology adoption',
      costFormula: level => 600 + (level * 350),
      benefits: level => ({
        researchSpeedBoost: level * 5,
        techCostReduction: level * 2
      })
    },
  ];

  // Get current research levels for player's country
  const getResearchLevel = (techId) => {
    return gameState?.technologies?.[myCountryObj?.en]?.[techId] || 0;
  };
  
  // Calculate research cost based on current level
  const getResearchCost = (tech) => {
    const currentLevel = getResearchLevel(tech.id);
    return tech.costFormula(currentLevel);
  };
  
  // Determine if player can afford to research a technology
  const canAffordResearch = (tech) => {
    return myBudget >= getResearchCost(tech);
  };
  
  // Handle research button click
  const handleResearch = (tech) => {
    handleResearchTechnology(tech.id, getResearchCost(tech));
  };

  return (
    <>
      <GamePanel
        title="Technology Research"
        onExpand={() => setOpenSection('tech')}
        expandLabel="Expand Technologies"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availableTechnologies.slice(0, 4).map(tech => {
            const currentLevel = getResearchLevel(tech.id);
            const cost = getResearchCost(tech);
            const canAfford = canAffordResearch(tech);
            
            return (
              <div key={tech.id} className="bg-gray-900/70 p-3 rounded-lg border border-gray-700 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{tech.icon}</span>
                  <span className="font-semibold text-blue-300">{tech.name}</span>
                </div>
                
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xs text-gray-400">Level: {currentLevel}</div>
                  <div className="text-xs text-green-400">Cost: {cost}</div>
                </div>
                
                <div className="mt-2">
                  <button
                    className={`w-full py-1 rounded text-xs ${
                      canAfford && !finished
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-700 opacity-50 cursor-not-allowed'
                    } text-white`}
                    onClick={() => handleResearch(tech)}
                    disabled={!canAfford || finished}
                  >
                    Research to Level {currentLevel + 1}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        <button
          onClick={() => setOpenSection('tech')}
          className="w-full mt-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
        >
          View All Technologies
        </button>
      </GamePanel>
      
      {/* Expanded view in modal */}
      <SectionModal open={openSection === 'tech'} onClose={() => setOpenSection(null)}>
        <div className="w-full">
          <h2 className="text-3xl font-bold text-blue-300 mb-2">Technology Research</h2>
          <p className="text-gray-400 mb-6">Research technologies to advance your nation's capabilities</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableTechnologies.map(tech => {
              const currentLevel = getResearchLevel(tech.id);
              const nextLevel = currentLevel + 1;
              const cost = getResearchCost(tech);
              const canAfford = canAffordResearch(tech);
              const benefits = tech.benefits(nextLevel);
              
              return (
                <div
                  key={tech.id}
                  className={`bg-gray-900/80 rounded-lg border ${
                    selectedTech?.id === tech.id ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-gray-700'
                  } p-4 shadow-lg`}
                  onClick={() => setSelectedTech(tech)}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{tech.icon}</span>
                      <div>
                        <h3 className="font-bold text-lg text-blue-300">{tech.name}</h3>
                        <div className="text-xs text-gray-400">Current Level: {currentLevel}</div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs ${canAfford ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                      Cost: {cost}
                    </div>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-3">{tech.baseDescription}</p>
                  
                  <div className="mb-4">
                    <div className="text-xs text-blue-300 mb-1">Research Progress:</div>
                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500"
                        style={{ width: `${currentLevel > 0 ? (currentLevel / 10) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/80 p-3 rounded mb-4">
                    <div className="text-xs text-blue-300 mb-2">Benefits at Level {nextLevel}:</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(benefits).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-400">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                          <span className={value > 0 ? 'text-green-400' : 'text-red-400'}>
                            {value > 0 ? '+' : ''}{value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    className={`w-full py-2 rounded ${
                      canAfford && !finished
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-700 opacity-50 cursor-not-allowed'
                    } text-white`}
                    onClick={() => handleResearch(tech)}
                    disabled={!canAfford || finished}
                  >
                    Research to Level {nextLevel}
                  </button>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 text-right">
            <div className="text-lg text-gray-300">
              Available Budget: <span className="font-bold text-green-400">{myBudget}</span>
            </div>
          </div>
        </div>
      </SectionModal>
    </>
  );
};

export default TechPanel;
