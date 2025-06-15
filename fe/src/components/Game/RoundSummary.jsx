import React from 'react';
import { useGame } from '../../context/GameContext-refactored';
import { actionDescription } from '../../utils/game';

/**
 * Enhanced modal component for displaying rich round action summary with effects
 */
const RoundSummary = () => {
  const { 
    showSummary,
    actions, 
    currentRound, 
    handleNextRound,
    actionsHistory,
    lang
  } = useGame();
  
  if (!showSummary) {
    return null;
  }
  
  // Helper function to get action effect impact class
  const getEffectClass = (impact) => {
    switch (impact) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      default: return 'text-blue-300';
    }
  };
  
  // Helper function to get icon for action type
  const getActionIcon = (type) => {
    switch (type) {
      case 'attack': return '⚔️';
      case 'buyArmy': return '👥';
      case 'upgradeCity': return '🏙️';
      case 'developNuclear': return '☢️';
      case 'setSanction': return '🚫';
      case 'researchTechnology': return '🔬';
      case 'establishDiplomacy': return '🤝';
      case 'investInInfrastructure': return '🏗️';
      default: return '🔄';
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-51">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl max-w-3xl w-full border-2 border-blue-700 relative">
        <h2 className="text-3xl font-bold mb-2 text-blue-300">Round {currentRound} Summary</h2>
        <p className="text-gray-400 mb-6">Action results and their effects</p>
        
        {actions && Object.keys(actions).length === 0 ? (
          <div className="mb-6 text-gray-300">No actions were taken this round.</div>
        ) : (
          <div className="mb-6 space-y-6">
            {Object.entries(actions).map(([player, acts]) => (
              <div key={player} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <h3 className="font-bold text-xl text-blue-400 border-b border-gray-700 pb-2 mb-3">{player}</h3>
                
                <div className="space-y-3">
                  {acts.map((action, i) => {
                    // Find matching action from history to get effect info
                    const actionResult = actionsHistory.find(
                      a => a.type === action.type && 
                           a.timestamp && 
                           (
                             (a.techName === action.techName) || 
                             (a.targetCountry === action.targetCountry) || 
                             (a.cityName === action.cityName)
                           )
                    );
                    
                    return (
                      <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-gray-900/60 p-3 rounded border-l-4 border-blue-600">
                        <div className="md:col-span-2 flex items-start">
                          <span className="text-xl mr-2">{getActionIcon(action.type)}</span>
                          <div>
                            <div className="font-semibold">{actionDescription(action, lang)}</div>
                            <div className="text-sm text-gray-400">
                              {action.type === 'attack' && `Strength: ${action.army}`}
                              {action.type === 'researchTechnology' && `Cost: ${action.cost}`}
                              {action.type === 'investInInfrastructure' && `Investment: ${action.amount}`}
                            </div>
                          </div>
                        </div>
                        
                        <div className="md:col-span-3">
                          {actionResult?.effectDescription && (
                            <div className={`${getEffectClass(actionResult.effectImpact)} text-sm`}>
                              <div className="font-semibold">Effect:</div>
                              <div>{actionResult.effectDescription}</div>
                              
                              {/* Display important metrics with visual indicators */}
                              <div className="mt-2 flex flex-wrap gap-2">
                                {actionResult.stabilityGain > 0 && (
                                  <span className="bg-green-900/30 px-2 py-1 rounded text-green-400 text-xs">
                                    +{actionResult.stabilityGain}% Stability
                                  </span>
                                )}
                                {actionResult.economyBoost > 0 && (
                                  <span className="bg-blue-900/30 px-2 py-1 rounded text-blue-400 text-xs">
                                    +{actionResult.economyBoost}% Economy
                                  </span>
                                )}
                                {actionResult.diplomaticEffect && (
                                  <span className={`${actionResult.diplomaticEffect > 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'} px-2 py-1 rounded text-xs`}>
                                    {actionResult.diplomaticEffect > 0 ? '+' : ''}{actionResult.diplomaticEffect} Diplomatic Relations
                                  </span>
                                )}
                                {actionResult.productivityBonus > 0 && (
                                  <span className="bg-yellow-900/30 px-2 py-1 rounded text-yellow-400 text-xs">
                                    +{actionResult.productivityBonus}% Productivity
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {!actionResult?.effectDescription && (
                            <div className="text-gray-500 italic text-sm">Result pending...</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6 flex justify-center">
          <button 
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg text-white font-semibold shadow transition-all focus:ring-2 focus:ring-green-400 w-full" 
            onClick={handleNextRound}
          >
            Continue to Next Round
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoundSummary;
