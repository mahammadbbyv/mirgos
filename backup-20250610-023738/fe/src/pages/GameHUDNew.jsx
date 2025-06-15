import React from 'react';
import { useGame } from '../context/GameContext-refactored';
import LoadingState from '../components/UI/LoadingState';
import GameHeader from '../components/Game/GameHeader';
import CitiesPanel from '../components/Game/CitiesPanel';
import CountriesPanel from '../components/Game/CountriesPanel';
import ActionsPanel from '../components/Game/ActionsPanel';
import GameChat from '../components/Game/GameChat';
import RoundSummary from '../components/Game/RoundSummary';

/**
 * Main game HUD component that coordinates all game screens
 */
const GameHUD = () => {
  const {
    gameState,
    error,
    playerName,
    myCountryObj,
    myBudget,
    myArmy,
    myCities,
    finished,
    allFinished,
    waitingPlayers,
    myCountry
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
  
  if (!gameState) {
    return (
      <LoadingState
        type="loading"
        title="Loading game state..."
        message="Waiting for the host to start the game or for the server to respond. If this takes too long, try rejoining the lobby."
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
  
  if (!myCountryObj) {
    return (
      <LoadingState
        type="warning"
        title="Your country is not set or not found in the game state."
        message={
          <>
            Please reselect your country in the lobby or rejoin.
            <br/>
            <span className='text-xs text-gray-500'>
              Available player names: {gameState && gameState.playerCountries && Object.keys(gameState.playerCountries).join(', ')}
            </span>
          </>
        }
        color="#facc15"
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
  
  if (!myCities || myCities.length === 0) {
    return (
      <LoadingState
        type="warning"
        title={`No cities found for your country (${myCountryObj?.en}).`}
        message="Please contact the host or try rejoining the lobby."
        color="#facc15"
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
  
  if (typeof myBudget === 'undefined') {
    return (
      <LoadingState
        type="warning"
        title={`Budget information missing for your country (${myCountry}).`}
        message="Please wait for the next round or rejoin."
        color="#facc15"
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
  
  if (typeof myArmy === 'undefined') {
    return (
      <LoadingState
        type="warning"
        title={`Army information missing for your country (${myCountry}).`}
        message="Please wait for the next round or rejoin."
        color="#facc15"
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
  
  // --- MAIN GAME UI ---
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-gray-800 text-white">
      {/* Header with game logo, timer, language selector and turn controls */}
      <GameHeader />
      
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
          {/* Cities Panel */}
          <CitiesPanel />
          
          {/* Countries Panel */}
          <CountriesPanel />
          
          {/* Actions Panel */}
          <ActionsPanel />
          
          {/* Chat UI */}
          <GameChat />
        </div>
      </main>
    </div>
  );
};

export default GameHUD;
