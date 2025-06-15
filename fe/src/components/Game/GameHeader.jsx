import React from 'react';
import PropTypes from 'prop-types';
import { useGame } from '../../context/GameContext-refactored';

/**
 * Game header component with timer, language selection, and turn controls
 */
const GameHeader = () => {
  const {
    timer,
    finished,
    showSummary,
    allFinished,
    handleFinishTurn,
    handleUndoFinish,
    handleLangChange,
    lang,
    waitingPlayers
  } = useGame();
  
  // Format timer (mm:ss)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <header className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur shadow-lg flex items-center justify-between px-6 py-4 mb-6 border-b border-gray-800">
      <div className="flex items-center gap-3">
        <img 
          src="/logo.png" 
          alt="Game Logo" 
          className="h-10 w-10 rounded-full shadow-lg border border-gray-700 bg-gray-900" 
        />
        <h1 className="text-3xl font-extrabold tracking-tight text-blue-400 drop-shadow">Mirgos</h1>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-lg font-mono bg-gray-800 px-5 py-2 rounded-lg shadow border border-blue-700 text-blue-300 text-center text-shadow-lg animate-pulse">
          <span className="font-semibold">Timer:</span> {formatTime(timer)}
        </div>
        
        <select 
          value={lang} 
          onChange={handleLangChange} 
          className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 transition-all"
        >
          <option value="en">EN</option>
          <option value="ru">RU</option>
          <option value="uk">UA</option>
        </select>
        
        {!finished ? (
          <button 
            className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg text-white font-semibold shadow transition-all focus:ring-2 focus:ring-blue-400" 
            onClick={handleFinishTurn} 
            disabled={finished || showSummary}
          >
            Finish Turn
          </button>
        ) : (
          !allFinished && (
            <button 
              className="bg-yellow-600 hover:bg-yellow-700 px-5 py-2 rounded-lg text-white font-semibold shadow transition-all focus:ring-2 focus:ring-yellow-400" 
              onClick={handleUndoFinish}
            >
              Undo Finish
            </button>
          )
        )}
      </div>
      
      {finished && !allFinished && (
        <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-10 mb-4 text-yellow-300 text-center text-lg font-semibold animate-pulse">
          Waiting for other players to finish their turn... <span className="font-mono">({waitingPlayers.length} left)</span>
        </div>
      )}
    </header>
  );
};

export default GameHeader;
