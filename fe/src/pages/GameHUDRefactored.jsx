import React from 'react';
import { EnhancedGameProvider } from '../context/EnhancedGameContext';
import GameHUD from './GameHUD';
import ConnectionDebugPanel from '../components/UI/ConnectionDebugPanel';
import GameStateDebugger from '../components/UI/GameStateDebugger';

/**
 * Wrapper component that uses the enhanced game context provider
 * with improved socket connection handling and advanced game features
 */
const GameHUDRefactored = () => {
  // Add query parameter ?debug=true to enable debugging tools
  const isDebugMode = new URLSearchParams(window.location.search).get('debug') === 'true';
  
  return (
    <EnhancedGameProvider>
      <GameHUD />
      <ConnectionDebugPanel />
      {isDebugMode && <GameStateDebugger />}
    </EnhancedGameProvider>
  );
};

export default GameHUDRefactored;
