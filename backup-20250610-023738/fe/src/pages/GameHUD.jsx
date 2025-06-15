import React from 'react';
import { useGame } from '../context/GameContext';
import LoadingState from '../components/UI/LoadingState';
import GameHeader from '../components/Game/GameHeader';
import CitiesPanel from '../components/Game/CitiesPanel';
import CountriesPanel from '../components/Game/CountriesPanel';
import ActionsPanel from '../components/Game/ActionsPanel';
import TechPanel from '../components/Game/TechPanel';
import GameChat from '../components/Game/GameChat';
import RoundSummary from '../components/Game/RoundSummary';
import ActionFeedback from '../components/Game/ActionFeedback';

/**
 * Main game HUD component that coordinates all game screens
 */
const GameHUD = () => {  const {
    gameState,
    error,
    myCountryObj,
    finished,
    allFinished,
    waitingPlayers
  } = useGame();
  
  // Handle various error states and loading screens
  if (error) {
    return (
      <LoadingState
        type="error"
        title={error}
        message="An error occurred. Please try rejoining the lobby or contact the host if the issue persists."
        color="#ef4444"
        buttons={[
          {
            label: "Back to Lobby List",
            onClick: () => window.location.href = '/lobbies',
            variant: "primary"
          },
          {
            label: "Retry",
            onClick: () => window.location.reload(),
            variant: "secondary"
          }
        ]}
      />
    );
  }
  
  // Wait for game state to load
  if (!gameState) {
    return (
      <LoadingState
        type="loading"
        title="Loading Game"
        message="Please wait while the game state is being loaded..."
        color="#3b82f6"
      />
    );
  }
  
  // Check if player has a country
  if (!myCountryObj) {
    return (
      <LoadingState
        type="error"
        title="No Country Assigned"
        message="You don't have a country assigned in this game. Please contact the host to assign you a country."
        color="#f59e0b"
        buttons={[
          {
            label: "Back to Lobby List",
            onClick: () => window.location.href = '/lobbies',
            variant: "primary"
          }
        ]}
      />
    );
  }
  
  // --- MAIN GAME UI ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Game Header */}
      <GameHeader />
      
      {/* Action Feedback Notifications */}
      <ActionFeedback />
      
      <main className="px-4 md:px-10 pb-10">
        {/* Wait message when player has finished but others haven't */}
        {finished && !allFinished && (
          <div className="mb-4 text-yellow-300 text-center text-lg font-semibold animate-pulse">
            Waiting for other players to finish their turn... <span className="font-mono">({waitingPlayers.length} left)</span>
          </div>
        )}
        
        {/* Round Summary Modal */}
        <RoundSummary />
        
        {/* Main Game Panels */}
        <div className="flex flex-wrap gap-8 justify-center">
          {/* First Row - Country Management */}
          <div className="flex flex-wrap gap-8 justify-center w-full">
            {/* Cities Panel */}
            <CitiesPanel />
            
            {/* Technology Panel */}
            <TechPanel />
          </div>
          
          {/* Second Row - Diplomacy and Actions */}
          <div className="flex flex-wrap gap-8 justify-center w-full">
            {/* Countries Panel */}
            <CountriesPanel />
            
            {/* Actions Panel */}
            <ActionsPanel />
          </div>
          
          {/* Chat UI */}
          <GameChat />
        </div>
      </main>
    </div>
  );
};

export default GameHUD;