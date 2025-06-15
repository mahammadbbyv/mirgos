import React, { useState } from 'react';
import { useGame } from '../../context/GameContext-refactored';
import GamePanel from '../UI/GamePanel';
import SectionModal from '../UI/SectionModal';
import StabilityIndicator from '../UI/StabilityIndicator';

/**
 * Countries panel with attack UI for targeting other countries' cities
 * Enhanced with diplomatic relationship features
 */
const CountriesPanel = () => {
  const {
    gameState,
    allCountryEnNames,
    myCountryObj,
    attackTarget,
    setAttackTarget,
    finished,
    handleAttack,
    openSection,
    setOpenSection,
    sanctionTarget,
    setSanctionTarget,
    handleSetSanction,
    handleEstablishDiplomacy,
    myArmy,
    lang
  } = useGame();

  // Local state for diplomacy actions
  const [relationLevel, setRelationLevel] = useState('friendly');
  
  // Get diplomatic relations data from gameState
  const getDiplomaticStatus = (countryEn) => {
    if (countryEn === myCountryObj?.en) return { status: 'self', color: 'text-blue-400' };
    
    // Relations data would be in gameState.diplomacy
    const relations = gameState?.diplomacy?.[myCountryObj?.en]?.[countryEn] || 'neutral';
    
    // Define visual indication based on relation level
    switch (relations) {
      case 'friendly': 
        return { status: 'Friendly', color: 'text-green-400', icon: '🤝' };
      case 'tense': 
        return { status: 'Tense', color: 'text-red-400', icon: '⚠️' };
      case 'neutral': 
      default:
        return { status: 'Neutral', color: 'text-gray-400', icon: '🔄' };
    }
  };
  
  // Check if a country is under sanctions
  const isSanctioned = (countryEn) => {
    return gameState?.sanctions?.[myCountryObj?.en]?.includes(countryEn);
  };

  return (
    <>
      <GamePanel
        title="All Countries"
        onExpand={() => setOpenSection('countries')}
        expandLabel="Expand Countries"
        className="max-w-xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allCountryEnNames.map(countryEn => {
            const countryObj = gameState.countryNames && gameState.countryNames[countryEn];
            const countryLabel = countryObj ? countryObj[lang] : countryEn;
            const countryStability = gameState.stability && gameState.stability[countryEn];
            const diplomaticStatus = getDiplomaticStatus(countryEn);
            
            return (
              <div key={countryEn} className="mb-2 bg-gray-900/80 rounded-lg p-4 shadow border border-gray-700">
                <div className="flex justify-between items-center mb-3">
                  <div className="font-bold text-yellow-300 text-xl flex items-center gap-2">
                    {countryLabel}
                    {isSanctioned(countryEn) && (
                      <span className="bg-red-900/40 text-red-400 text-xs px-2 py-0.5 rounded-full">Sanctioned</span>
                    )}
                  </div>
                  <div className="bg-gray-800 rounded-lg px-3 py-1 border border-gray-700 flex items-center gap-2">
                    {countryEn !== myCountryObj?.en && (
                      <span className={`font-semibold ${diplomaticStatus.color}`}>
                        {diplomaticStatus.icon} {diplomaticStatus.status}
                      </span>
                    )}
                    <span className="font-medium text-blue-300 ml-2">Stability:</span> 
                    <span className={`font-bold ${countryStability > 70 ? 'text-green-400' : countryStability > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {countryStability !== undefined ? countryStability : '?'}
                    </span>
                  </div>
                </div>
                
                <div className="font-semibold text-blue-200 mb-2">Cities:</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {gameState.cities[countryEn].map(city => (
                    <span key={city[`name_${lang}`] || city.name_en} className="bg-gray-700 rounded px-2 py-1 text-xs mr-1 mb-1 inline-block text-blue-200 shadow flex items-center gap-1">
                      <span>{city[`name_${lang}`] || city.name_en}</span>
                      <span className="text-xs text-gray-400"> - </span>
                      <span className={`text-xs ${city.stability > 70 ? 'text-green-400' : city.stability > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {city.stability}%
                      </span>
                    </span>
                  ))}
                </div>
                
                {/* Diplomacy and Actions UI - Only show for countries that aren't the player's */}
                {countryEn !== (myCountryObj && myCountryObj.en) && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 items-center">
                      <select
                        className="bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 focus:ring-2 focus:ring-red-400 transition-all"
                        value={attackTarget.country === countryEn ? attackTarget.city : ''}
                        onChange={e => setAttackTarget(t =>
                          t.country === countryEn
                            ? { ...t, city: e.target.value }
                            : { country: countryEn, city: e.target.value, army: 0 }
                        )}
                      >
                        <option value="">Select City</option>
                        {gameState.cities[countryEn].map(city => (
                          <option key={city[`name_${lang}`] || city.name_en} value={city[`name_${lang}`] || city.name_en}>
                            {city[`name_${lang}`] || city.name_en}
                          </option>
                        ))}
                      </select>
                      
                      <input 
                        type="number" 
                        min={1} 
                        max={myArmy} 
                        value={attackTarget.country === countryEn ? attackTarget.army : ''} 
                        onChange={e => setAttackTarget(t => ({ ...t, country: countryEn, army: Number(e.target.value) }))} 
                        className="w-20 bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 focus:ring-2 focus:ring-red-400 transition-all" 
                        placeholder="Army" 
                      />
                      
                      <button 
                        className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-xs text-white shadow focus:ring-2 focus:ring-red-400 transition-all" 
                        onClick={handleAttack} 
                        disabled={finished || !attackTarget.city || !attackTarget.army || attackTarget.country !== countryEn}
                      >
                        Attack
                      </button>
                    </div>
                    
                    {/* Diplomacy UI */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs flex items-center justify-center gap-1 text-white shadow"
                        onClick={() => setOpenSection(`diplomacy-${countryEn}`)}
                        disabled={finished}
                      >
                        🤝 Diplomacy
                      </button>
                      
                      <button
                        className={`${
                          sanctionTarget === countryEn
                            ? 'bg-orange-700 hover:bg-orange-800'
                            : 'bg-orange-600 hover:bg-orange-700'
                        } px-2 py-1 rounded text-xs flex items-center justify-center gap-1 text-white shadow`}
                        onClick={() => {
                          setSanctionTarget(countryEn);
                          handleSetSanction();
                        }}
                        disabled={finished || isSanctioned(countryEn)}
                      >
                        🚫 Sanction
                      </button>
                      
                      <button
                        className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs flex items-center justify-center gap-1 text-white shadow"
                        onClick={() => setOpenSection(`info-${countryEn}`)}
                      >
                        ℹ️ Info
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </GamePanel>
      
      {/* Expanded view in modal */}
      <SectionModal open={openSection === 'countries'} onClose={() => setOpenSection(null)}>
        <h2 className="text-3xl font-bold mb-8 text-blue-300">All Countries</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {allCountryEnNames.map(countryEn => {
            const countryObj = gameState.countryNames && gameState.countryNames[countryEn];
            const countryLabel = countryObj ? countryObj[lang] : countryEn;
            const countryStability = gameState.stability && gameState.stability[countryEn];
            const diplomaticStatus = getDiplomaticStatus(countryEn);
            
            return (
              <div key={countryEn} className="mb-2 bg-gray-900/80 rounded-lg p-4 shadow border border-gray-700">
                <div className="flex justify-between items-center mb-3">
                  <div className="font-bold text-yellow-300 text-xl flex items-center gap-2">
                    {countryLabel}
                    {isSanctioned(countryEn) && (
                      <span className="bg-red-900/40 text-red-400 text-xs px-2 py-0.5 rounded-full">Sanctioned</span>
                    )}
                  </div>
                  <div className="bg-gray-800 rounded-lg px-3 py-1 border border-gray-700 flex items-center gap-2">
                    {countryEn !== myCountryObj?.en && (
                      <span className={`font-semibold ${diplomaticStatus.color}`}>
                        {diplomaticStatus.icon} {diplomaticStatus.status}
                      </span>
                    )}
                    <span className="font-medium text-blue-300 ml-2">Stability:</span> 
                    <span className={`font-bold ${countryStability > 70 ? 'text-green-400' : countryStability > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {countryStability !== undefined ? countryStability : '?'}
                    </span>
                  </div>
                </div>
                
                <div className="font-semibold text-blue-200 mb-2">Cities:</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {gameState.cities[countryEn].map(city => (
                    <span key={city[`name_${lang}`] || city.name_en} className="bg-gray-700 rounded px-2 py-1 text-xs mr-1 mb-1 inline-block text-blue-200 shadow flex items-center gap-1">
                      <span>{city[`name_${lang}`] || city.name_en}</span>
                      <span className="text-xs text-gray-400"> - </span>
                      <span className={`text-xs ${city.stability > 70 ? 'text-green-400' : city.stability > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {city.stability}%
                      </span>
                    </span>
                  ))}
                </div>
                
                {/* Attack UI - Only show for countries that aren't the player's */}
                {countryEn !== (myCountryObj && myCountryObj.en) && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 items-center">
                      <select
                        className="bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 focus:ring-2 focus:ring-red-400 transition-all"
                        value={attackTarget.country === countryEn ? attackTarget.city : ''}
                        onChange={e => setAttackTarget(t =>
                          t.country === countryEn
                            ? { ...t, city: e.target.value }
                            : { country: countryEn, city: e.target.value, army: 0 }
                        )}
                      >
                        <option value="">Select City</option>
                        {gameState.cities[countryEn].map(city => (
                          <option key={city[`name_${lang}`] || city.name_en} value={city[`name_${lang}`] || city.name_en}>
                            {city[`name_${lang}`] || city.name_en}
                          </option>
                        ))}
                      </select>
                      
                      <input 
                        type="number" 
                        min={1} 
                        max={myArmy} 
                        value={attackTarget.country === countryEn ? attackTarget.army : ''} 
                        onChange={e => setAttackTarget(t => ({ ...t, country: countryEn, army: Number(e.target.value) }))} 
                        className="w-20 bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 focus:ring-2 focus:ring-red-400 transition-all" 
                        placeholder="Army" 
                      />
                      
                      <button 
                        className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-xs text-white shadow focus:ring-2 focus:ring-red-400 transition-all" 
                        onClick={handleAttack} 
                        disabled={finished || !attackTarget.city || !attackTarget.army || attackTarget.country !== countryEn}
                      >
                        Attack
                      </button>
                    </div>
                    
                    {/* Diplomacy UI */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs flex items-center justify-center gap-1 text-white shadow"
                        onClick={() => setOpenSection(`diplomacy-${countryEn}`)}
                        disabled={finished}
                      >
                        🤝 Diplomacy
                      </button>
                      
                      <button
                        className={`${
                          sanctionTarget === countryEn
                            ? 'bg-orange-700 hover:bg-orange-800'
                            : 'bg-orange-600 hover:bg-orange-700'
                        } px-2 py-1 rounded text-xs flex items-center justify-center gap-1 text-white shadow`}
                        onClick={() => {
                          setSanctionTarget(countryEn);
                          handleSetSanction();
                        }}
                        disabled={finished || isSanctioned(countryEn)}
                      >
                        🚫 Sanction
                      </button>
                      
                      <button
                        className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs flex items-center justify-center gap-1 text-white shadow"
                        onClick={() => setOpenSection(`info-${countryEn}`)}
                      >
                        ℹ️ Info
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionModal>
      
      {/* Diplomacy Modal for each country */}
      {allCountryEnNames.map(countryEn => {
        const countryObj = gameState.countryNames && gameState.countryNames[countryEn];
        const countryLabel = countryObj ? countryObj[lang] : countryEn;
        
        if (countryEn === (myCountryObj && myCountryObj.en)) return null;
        
        return (
          <SectionModal 
            key={`diplomacy-${countryEn}`}
            open={openSection === `diplomacy-${countryEn}`} 
            onClose={() => setOpenSection(null)}
          >
            <div className="w-full max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                Diplomatic Relations
              </h2>
              <h3 className="text-xl text-yellow-300 mb-6">With {countryLabel}</h3>
              
              <div className="bg-gray-800 p-4 rounded-lg mb-6">
                <p className="text-gray-300 mb-4">
                  Establish diplomatic relations with this country to gain trade advantages
                  and influence regional stability.
                </p>
                
                <div className="mb-4">
                  <label className="block text-blue-300 mb-1">Relation Type:</label>
                  <select 
                    value={relationLevel} 
                    onChange={(e) => setRelationLevel(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2"
                  >
                    <option value="friendly">Friendly Alliance (+15% reputation)</option>
                    <option value="neutral">Neutral Relations (+5% reputation)</option>
                    <option value="tense">Tense Relations (-10% reputation)</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <div className={`${relationLevel === 'friendly' ? 'bg-green-900/30' : relationLevel === 'tense' ? 'bg-red-900/30' : 'bg-gray-700'} p-3 rounded`}>
                    <div className="text-blue-300">Effect:</div>
                    <div className={`${relationLevel === 'friendly' ? 'text-green-400' : relationLevel === 'tense' ? 'text-red-400' : 'text-gray-300'} font-semibold`}>
                      {relationLevel === 'friendly' && '🤝 Friendly Relations'}
                      {relationLevel === 'neutral' && '🔄 Neutral Relations'}
                      {relationLevel === 'tense' && '⚠️ Tense Relations'}
                    </div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-blue-300">Status:</div>
                    <div className={`${getDiplomaticStatus(countryEn).color} font-semibold`}>
                      {getDiplomaticStatus(countryEn).icon} {getDiplomaticStatus(countryEn).status}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between gap-4">
                  <button
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded shadow flex-1"
                    onClick={() => setOpenSection(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className={`${
                      relationLevel === 'friendly' ? 'bg-green-600 hover:bg-green-700' :
                      relationLevel === 'tense' ? 'bg-red-600 hover:bg-red-700' :
                      'bg-blue-600 hover:bg-blue-700'
                    } text-white font-bold py-2 px-4 rounded shadow flex-1`}
                    onClick={() => {
                      handleEstablishDiplomacy(countryEn, relationLevel);
                      setOpenSection(null);
                    }}
                    disabled={finished}
                  >
                    Establish {relationLevel.charAt(0).toUpperCase() + relationLevel.slice(1)} Relations
                  </button>
                </div>
              </div>
            </div>
          </SectionModal>
        );
      })}
      
      {/* Country Info Modal for each country */}
      {allCountryEnNames.map(countryEn => {
        const countryObj = gameState.countryNames && gameState.countryNames[countryEn];
        const countryLabel = countryObj ? countryObj[lang] : countryEn;
        const countryStability = gameState.stability && gameState.stability[countryEn];
        const diplomaticStatus = getDiplomaticStatus(countryEn);
        
        return (
          <SectionModal 
            key={`info-${countryEn}`}
            open={openSection === `info-${countryEn}`} 
            onClose={() => setOpenSection(null)}
          >
            <div className="w-full max-w-lg mx-auto">
              <h2 className="text-2xl font-bold text-yellow-300 mb-4">{countryLabel}</h2>
              
              <div className="bg-gray-800 p-5 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-blue-300 mb-3">National Info</h3>
                  
                  <div className="space-y-3">
                    <div className="bg-gray-700/50 p-3 rounded flex justify-between items-center">
                      <div className="text-gray-300">Stability:</div>
                      <div className={`font-bold ${countryStability > 70 ? 'text-green-400' : countryStability > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {countryStability !== undefined ? countryStability : '?'}%
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 p-3 rounded flex justify-between items-center">
                      <div className="text-gray-300">Army:</div>
                      <div className="font-bold text-yellow-400">
                        {gameState?.armies?.[countryEn] || '?'}
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 p-3 rounded flex justify-between items-center">
                      <div className="text-gray-300">Budget:</div>
                      <div className="font-bold text-green-400">
                        {gameState?.budgets?.[countryEn] || '?'}
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 p-3 rounded flex justify-between items-center">
                      <div className="text-gray-300">Nuclear Level:</div>
                      <div className="font-bold text-red-400">
                        {gameState?.nuclearLevel?.[countryEn] || 0}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-blue-300 mb-3">Diplomatic Relations</h3>
                  
                  {countryEn !== myCountryObj?.en ? (
                    <div className="space-y-3">
                      <div className="bg-gray-700/50 p-3 rounded flex justify-between items-center">
                        <div className="text-gray-300">Status:</div>
                        <div className={`font-bold ${diplomaticStatus.color}`}>
                          {diplomaticStatus.icon} {diplomaticStatus.status}
                        </div>
                      </div>
                      
                      <div className="bg-gray-700/50 p-3 rounded flex justify-between items-center">
                        <div className="text-gray-300">Sanctions:</div>
                        <div className="font-bold">
                          {isSanctioned(countryEn) ? 
                            <span className="text-red-400">Active</span> : 
                            <span className="text-green-400">None</span>}
                        </div>
                      </div>
                      
                      <div className="bg-gray-700/50 p-3 rounded flex justify-between items-center">
                        <div className="text-gray-300">Trade Potential:</div>
                        <div className="font-bold text-blue-400">
                          {diplomaticStatus.status === 'Friendly' ? 'High' : 
                            diplomaticStatus.status === 'Neutral' ? 'Medium' : 'Low'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400 italic">This is your country</div>
                  )}
                  
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-blue-300 mb-3">Cities</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {gameState.cities[countryEn].map(city => (
                        <div key={city[`name_${lang}`] || city.name_en} 
                          className="bg-gray-700/50 p-2 rounded flex flex-col text-center text-sm">
                          <div className="font-semibold text-yellow-200">{city[`name_${lang}`] || city.name_en}</div>
                          <div className="text-xs text-gray-400">Income: {city.income}</div>
                          <div className={`text-xs ${city.stability > 70 ? 'text-green-400' : city.stability > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                            Stability: {city.stability}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionModal>
        );
      })}
    </>
  );
};

export default CountriesPanel;
