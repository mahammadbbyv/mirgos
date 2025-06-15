import React from 'react';
import { GameProvider } from '../context/GameContext-refactored';
import GameHUD from './GameHUD';

/**
 * Wrapper component that ensures GameHUD is used within a GameProvider
 */
const GameHUDWrapper = () => {
  return (
    <GameProvider>
      <GameHUD />
    </GameProvider>
  );
};

export default GameHUDWrapper;
