import React, { useState } from 'react';
import { useGame } from '../../context/GameContext-refactored';
import GamePanel from '../UI/GamePanel';
import SectionModal from '../UI/SectionModal';
import StabilityIndicator from '../UI/StabilityIndicator';

/**
 * Cities management panel and modal with infrastructure investment feature
 */
const CitiesPanel = () => {  const {
    myCities,
    myCountry,
    myBudget,
    myArmy,
    gameState,
    myCountryObj,
    finished,
    upgradeCity,
    setUpgradeCity,
    openSection,
    setOpenSection,
    handleInvestInInfrastructure,
    lang
  } = useGame();
  
  // The country's stability value
  const countryStability = gameState?.stability?.[myCountryObj?.en];
  
  // Local state for investment amount
  const [investmentAmount, setInvestmentAmount] = useState(100);
  
  // Handle infrastructure investment
  const handleInfrastructureInvest = (cityName) => {
    handleInvestInInfrastructure(cityName, investmentAmount);
    setInvestmentAmount(100); // Reset to default after investment
  };
  
  return (
    <>
      <GamePanel 
        title={<>My Cities <span className="text-white font-normal">({myCountry})</span></>}
        onExpand={() => setOpenSection('cities')}
        expandLabel="Expand Cities"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm mb-4 rounded overflow-hidden min-w-[650px]">
            <colgroup>
              <col style={{ width: '16%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '14%' }} />
            </colgroup>
            
            <thead>
              <tr className="bg-gray-900 text-blue-200">
                <th className="px-3 py-2 whitespace-nowrap text-left">City</th>
                <th className="px-3 py-2 whitespace-nowrap text-left">Shield</th>
                <th className="px-3 py-2 whitespace-nowrap text-left">Level</th>
                <th className="px-3 py-2 whitespace-nowrap text-left">Income</th>
                <th className="px-3 py-2 whitespace-nowrap text-left">Defenders</th>
                <th className="px-3 py-2 whitespace-nowrap text-left">Stability</th>
                <th className="px-3 py-2 whitespace-nowrap text-left">Upgrade</th>
                <th className="px-3 py-2 whitespace-nowrap text-left">Invest</th>
              </tr>
            </thead>
            
            <tbody>
              {myCities && myCities.map((city, i) => (
                <tr key={i} className="hover:bg-gray-900/70 transition-all">
                  <td className="font-semibold text-yellow-200">{city.displayName}</td>
                  <td>{city.shield}</td>
                  <td>{city.level}</td>
                  <td>{city.income}</td>
                  <td>{city.defense}</td>
                  <td>
                    <StabilityIndicator stability={city.stability} />
                  </td>
                  <td>
                    <button 
                      className="bg-blue-700 hover:bg-blue-800 px-2 py-1 rounded text-xs shadow focus:ring-2 focus:ring-blue-400" 
                      onClick={() => setUpgradeCity(city.displayName)} 
                      disabled={finished}
                    >
                      Select
                    </button>
                  </td>
                  <td>
                    <button 
                      className="bg-green-700 hover:bg-green-800 px-2 py-1 rounded text-xs shadow focus:ring-2 focus:ring-green-400" 
                      onClick={() => setOpenSection(`invest-${city.displayName}`)} 
                      disabled={finished || myBudget < 100}
                    >
                      Invest
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mb-2 text-lg">Available Budget: <span className="font-bold text-green-400">{myBudget}</span></div>
        <div className="mb-2 text-lg">Army: <span className="font-bold text-yellow-400">{myArmy}</span></div>
        
        <div className="mb-2 mt-3 pt-3 border-t border-gray-700">
          <div className="text-lg">
            National Stability: 
            <span className={`ml-2 font-bold ${countryStability > 70 ? 'text-green-400' : countryStability > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
              {countryStability || '?'}
            </span>
          </div>
          <StabilityIndicator stability={countryStability} />
        </div>
      </GamePanel>
      
      {/* Expanded view in modal */}
      <SectionModal open={openSection === 'cities'} onClose={() => setOpenSection(null)}>
        <div className="w-full">
          <h2 className="text-3xl font-bold text-blue-300 mb-6">
            My Cities <span className="text-white text-2xl">({myCountry})</span>
          </h2>
          
          <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-800/80 shadow-lg">
            <table className="min-w-full text-base text-left text-white whitespace-nowrap">
              <thead>
                <tr className="bg-gray-900/80">
                  <th className="px-4 py-3 font-bold text-blue-200">City</th>
                  <th className="px-2 py-3 font-bold text-blue-200">Shield</th>
                  <th className="px-2 py-3 font-bold text-blue-200">Level</th>
                  <th className="px-2 py-3 font-bold text-blue-200">Income</th>
                  <th className="px-2 py-3 font-bold text-blue-200">Defenders</th>
                  <th className="px-2 py-3 font-bold text-blue-200">Stability</th>
                  <th className="px-2 py-3 font-bold text-blue-200">Upgrade</th>
                  <th className="px-2 py-3 font-bold text-blue-200">Infrastructure</th>
                </tr>
              </thead>
              
              <tbody>
                {myCities.map((city) => (
                  <tr key={city.displayName} className="border-b border-gray-700 hover:bg-gray-700/40 transition">
                    <td className="px-4 py-2 font-semibold text-yellow-300">{city.displayName}</td>
                    <td className="px-2 py-2 text-center">{city.shield}</td>
                    <td className="px-2 py-2 text-center">{city.level}</td>
                    <td className="px-2 py-2 text-center">{city.income}</td>
                    <td className="px-2 py-2 text-center">{city.defense || 0}</td>
                    <td className="px-2 py-2 text-center">
                      <StabilityIndicator stability={city.stability} />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded shadow text-sm"
                        onClick={() => setUpgradeCity(city.displayName)}
                        disabled={upgradeCity === city.displayName}
                      >
                        {upgradeCity === city.displayName ? 'Selected' : 'Select'}
                      </button>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded shadow text-sm"
                        onClick={() => setOpenSection(`invest-${city.displayName}`)}
                        disabled={finished || myBudget < 100}
                      >
                        Invest
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex flex-col gap-2">
            <div className="text-lg font-semibold text-white">
              Available Budget: <span className="text-green-400 text-2xl font-bold">{myBudget}</span>
            </div>
            <div className="text-lg font-semibold text-white">
              Army: <span className="text-yellow-400 text-2xl font-bold">{myArmy}</span>
            </div>
            <div className="text-lg font-semibold text-white mt-2">
              National Stability: 
              <span className={`ml-2 text-2xl font-bold ${countryStability > 70 ? 'text-green-400' : countryStability > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                {countryStability || '?'}
              </span>
              <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden mt-1">
                <div 
                  className={`h-full ${countryStability > 70 ? 'bg-green-500' : countryStability > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${countryStability || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </SectionModal>
      
      {/* Infrastructure Investment Modal */}
      {myCities && myCities.map((city) => (
        <SectionModal 
          key={`invest-${city.displayName}`}
          open={openSection === `invest-${city.displayName}`} 
          onClose={() => setOpenSection(null)}
        >
          <div className="w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-green-400 mb-4">
              Infrastructure Investment
            </h2>
            <h3 className="text-xl text-yellow-300 mb-6">{city.displayName}</h3>
            
            <div className="bg-gray-800 p-4 rounded-lg mb-6">
              <p className="text-gray-300 mb-4">
                Investing in infrastructure improves city stability and increases economic output.
                Every 100 units increases stability by 1%, and every 200 units boosts economy by 1%.
              </p>
              
              <div className="mb-4">
                <label className="block text-blue-300 mb-1">Investment Amount:</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="100" 
                    max={Math.min(5000, myBudget)} 
                    step="100" 
                    value={investmentAmount} 
                    onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <input 
                    type="number" 
                    min="100" 
                    max={Math.min(5000, myBudget)} 
                    step="100" 
                    value={investmentAmount} 
                    onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                    className="w-24 bg-gray-700 border border-gray-600 rounded p-1 text-center"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="bg-gray-700 p-2 rounded">
                  <div className="text-blue-300">Stability Gain:</div>
                  <div className="text-green-400 text-xl font-bold">+{Math.floor(investmentAmount / 100)}%</div>
                </div>
                <div className="bg-gray-700 p-2 rounded">
                  <div className="text-blue-300">Economy Boost:</div>
                  <div className="text-green-400 text-xl font-bold">+{Math.floor(investmentAmount / 200)}%</div>
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
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow flex-1"
                  onClick={() => {
                    handleInfrastructureInvest(city.displayName);
                    setOpenSection(null);
                  }}
                  disabled={investmentAmount < 100 || investmentAmount > myBudget || finished}
                >
                  Invest {investmentAmount}
                </button>
              </div>
            </div>
            
            <div className="text-right text-gray-400 text-sm">
              Available Budget: <span className="text-green-400 font-semibold">{myBudget}</span>
            </div>
          </div>
        </SectionModal>
      ))}
    </>
  );
};

export default CitiesPanel;
