import React from 'react';
import { GameProvider } from '../context/GameContext-refactored';
import GameHUD from './GameHUD';

/**
 * This component wraps GameHUD with GameProvider to ensure
 * the game context is available to all components in the game UI
 */
function GameHUDWrapper() {
  return (
    <GameProvider>
      <GameHUD />
    </GameProvider>
  );
}

export default GameHUDWrapper;
