import { useEffect, useState, useMemo, useCallback } from 'react';
import { socket, connectToServer } from '../utils/lobby';
import ChatUI from './Components/ChatUI';
import {
  formatTime,
  actionDescription,
} from '../utils/game';
import { FaExpandAlt } from 'react-icons/fa';
import BarLoader from 'react-spinners/BarLoader';

export default function GameHUD() {
  // Local state for UI
  const [gameState, setGameState] = useState(null);
  const [actions, setActions] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [timer, setTimer] = useState(300);
  const [roundStartTime, setRoundStartTime] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [finished, setFinished] = useState(false);
  const [allFinished, setAllFinished] = useState(false);
  const [waitingPlayers, setWaitingPlayers] = useState([]);
  const [attackTarget, setAttackTarget] = useState({ country: '', city: '', army: 0 });
  const [upgradeCity, setUpgradeCity] = useState('');
  const [sanctionTarget, setSanctionTarget] = useState('');
  const [armyCount, setArmyCount] = useState(1);
  const [error, setError] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  // --- Language state ---
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const playerName = localStorage.getItem('playerName');
  const lobbyId = localStorage.getItem('currentLobbyId');
  const [openSection, setOpenSection] = useState(null);
  const [loadingChats, setLoadingChats] = useState(false);
    const [selectedChat, setSelectedChat] = useState('all');

  // Section modal wrapper
  const SectionModal = ({ open, onClose, children }) => open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-3xl shadow-2xl border-4 border-blue-700 p-14 max-w-6xl w-full min-h-[70vh] min-w-[70vw] relative">
        <button onClick={onClose} className="absolute top-8 right-8 text-white bg-gray-700 hover:bg-gray-800 rounded-full px-5 py-2 text-3xl font-bold z-10">×</button>
        {children}
      </div>
    </div>
  ) : null;

  // Memoized derived values
  const myCountryObj = useMemo(() => gameState?.playerCountries?.[playerName], [gameState, playerName]);
  const myCountry = useMemo(() => myCountryObj?.[lang], [myCountryObj, lang]);
  const allCountryEnNames = useMemo(() => Object.keys(gameState?.cities || {}), [gameState]);
  const myBudget = useMemo(() => gameState?.budgets?.[myCountryObj?.en], [gameState, myCountryObj]);
  const myArmy = useMemo(() => gameState?.armies?.[myCountryObj?.en], [gameState, myCountryObj]);
  const myCities = useMemo(() => {
    if (gameState && gameState.cities && myCountryObj && myCountryObj.en) {
      // Find the country key in gameState.cities that matches myCountryObj.en
      const countryKey = Object.keys(gameState.cities).find(
        key => key.toLowerCase() === myCountryObj.en.toLowerCase()
      );
      if (countryKey) {
        // Add displayName for each city based on selected language
        return gameState.cities[countryKey].map(city => ({
          ...city,
          displayName: city[`name_${lang}`] || city.name_en || city.name_ru || city.name_uk || ''
        }));
      }
    }
    return [];
  }, [gameState, myCountryObj, lang]);
  // Remove unused state variables
  // const allPlayers = useMemo(() => {
  //   if (!gameState?.players) return [];
  //   return gameState.players.filter(p => p !== playerName);
  // }, [gameState, playerName]);

  // Connect to socket if not already
  useEffect(() => {
    if (!socket) connectToServer();
    if (!lobbyId || !playerName) setError("Missing lobby or player information. Please rejoin the lobby.");
  }, [lobbyId, playerName]);

  // Join lobby and request game state
  useEffect(() => {
    if (!socket || !socket.connected) connectToServer();
    if (lobbyId && playerName && socket) {
      socket.emit('join_lobby', { lobbyId, playerName, country: localStorage.getItem('country') || '' });
      const handleGameState = (state) => {
        setGameState(state);
        setLoadingChats(false);
      };
      socket.on('game_state', handleGameState);
      socket.emit('request_game_state', { lobbyId });
      return () => {
        socket.off('game_state', handleGameState);
      };
    }
  }, [lobbyId, playerName]);

  // Listen for game state, round actions, and round start from server
  useEffect(() => {
    if (!socket) return;
    const handleGameState = (state) => {
      if (!state) {
        setGameState(null);
        setError("Game state is missing or not initialized. Please wait for the host to start the game, or rejoin the lobby.");
        return;
      }
      setGameState(state);
      setCurrentRound(state.round);
      setFinished(false);
      setAllFinished(false);
      setWaitingPlayers([]);
      setActions([]);
      if (state.roundStartTime) setRoundStartTime(state.roundStartTime);
      setError("");
    };
    const handleRoundActions = ({ actions: allActions, round, updatedState }) => {
      setShowSummary(true);
      setActions(allActions);
      setGameState(updatedState);
      setCurrentRound(round);
      setFinished(false);
      setAllFinished(false);
      setWaitingPlayers([]);
      setError("");
    };
    const handleWaitingPlayers = (waiting) => {
      setWaitingPlayers(waiting);
      setAllFinished(waiting.length === 0);
    };
    const handleRoundStart = ({ roundStartTime: serverTime }) => {
      setRoundStartTime(serverTime);
    };
    socket.on('game_state', handleGameState);
    socket.on('round_actions', handleRoundActions);
    socket.on('waiting_players', handleWaitingPlayers);
    socket.on('round_start', handleRoundStart);
    return () => {
      socket.off('game_state', handleGameState);
      socket.off('round_actions', handleRoundActions);
      socket.off('waiting_players', handleWaitingPlayers);
      socket.off('round_start', handleRoundStart);
    };
  }, []);

  // Request round start time if not present (on mount or new round)
  useEffect(() => {
    if (socket && lobbyId && !roundStartTime) {
      socket.emit('request_round_start', { lobbyId });
    }
  }, [lobbyId, roundStartTime]);

  // Timer effect: always sync with server roundStartTime
  useEffect(() => {
    if (showSummary || finished) return;
    if (!roundStartTime) return;
    const updateTimer = () => {
      const now = Date.now();
      const start = new Date(roundStartTime).getTime();
      if (now < start) {
        setTimer(300);
        return;
      }
      let elapsed = Math.floor((now - start) / 1000);
      let remaining = Math.max(0, 300 - elapsed);
      setTimer(remaining);
      if (remaining === 0 && !finished) {
        setFinished(true);
        socket.emit('finish_turn', { lobbyId, playerName });
      }
    };
    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [roundStartTime, showSummary, finished, lobbyId, playerName]);

  // --- Language selector UI ---
  const handleLangChange = useCallback((e) => {
    setLang(e.target.value);
    localStorage.setItem('lang', e.target.value);
  }, []);

  // --- ACTIONS ---
  const handleBuyArmy = useCallback(() => {
    if (!myBudget || myBudget < 300 * armyCount) return;
    const action = { type: 'buyArmy', count: armyCount };
    socket.emit('submit_action', { lobbyId, playerName, action });
    setActions((prev) => [...prev, action]);
  }, [myBudget, armyCount, lobbyId, playerName]);

  const handleUpgradeCity = useCallback(() => {
    if (!upgradeCity) return;
    const action = { type: 'upgradeCity', city: upgradeCity };
    socket.emit('submit_action', { lobbyId, playerName, action });
    setActions((prev) => [...prev, action]);
  }, [upgradeCity, lobbyId, playerName]);

  const handleAttack = useCallback(() => {
    if (!attackTarget.country || !attackTarget.city || !attackTarget.army) return;
    const action = { type: 'attack', targetCountry: attackTarget.country, targetCity: attackTarget.city, army: attackTarget.army };
    socket.emit('submit_action', { lobbyId, playerName, action });
    setActions((prev) => [...prev, action]);
  }, [attackTarget, lobbyId, playerName]);

  const handleDevelopNuclear = useCallback(() => {
    const action = { type: 'developNuclear' };
    socket.emit('submit_action', { lobbyId, playerName, action });
    setActions((prev) => [...prev, action]);
  }, [lobbyId, playerName]);

  const handleSetSanction = useCallback(() => {
    if (!sanctionTarget) return;
    const action = { type: 'setSanction', targetCountry: sanctionTarget };
    socket.emit('submit_action', { lobbyId, playerName, action });
    setActions((prev) => [...prev, action]);
  }, [sanctionTarget, lobbyId, playerName]);

  const handleFinishTurn = useCallback(() => {
    setFinished(true);
    socket.emit('finish_turn', { lobbyId, playerName });
  }, [lobbyId, playerName]);

  const handleUndoFinish = useCallback(() => {
    setFinished(false);
    socket.emit('undo_finish', { lobbyId, playerName });
  }, [lobbyId, playerName]);

  const handleNextRound = useCallback(() => {
    setShowSummary(false);
    setActions([]);
    setFinished(false);
    setAllFinished(false);
    setWaitingPlayers([]);
    setRoundStartTime(null);
  }, []);
  // --- CHAT SOCKET LISTENERS ---
  useEffect(() => {
    if (!socket) return;
    setChatMessages([]); // Clear messages when chat changes
    setLoadingChats(true);
    // Request chat history for the selected chat
    if (selectedChat === 'all') {
      socket.emit('request_chat_history', { lobbyId, chatType: 'room' });
    } else {
      socket.emit('request_chat_history', { lobbyId, chatType: 'private', withPlayer: selectedChat });
    }
    // Helper to check if a message is already in chatMessages
    const isDuplicate = (msg, arr) => arr.some(m => m.player === msg.player && m.to === msg.to && m.text === msg.text && m.time === msg.time);
    const handleMsg = (msg) => {
      if (msg.lobbyId !== lobbyId) return;
      // Only add if not already present
      setChatMessages((prev) => {
        if (isDuplicate(msg, prev)) return prev;
        if (msg.to === 'all' && selectedChat === 'all') {
          return [...prev, msg];
        } else if (
          msg.to !== 'all' &&
          ((msg.player === playerName && msg.to === selectedChat) ||
           (msg.player === selectedChat && msg.to === playerName))
        ) {
          return [...prev, msg];
        }
        return prev;
      });
      setLoadingChats(false);
    };
    socket.on('room_message', handleMsg);
    socket.on('private_message', handleMsg);
    socket.on('chat_history', (history) => {
      setChatMessages(history.messages);
      setLoadingChats(false);
    });
    return () => {
      socket.off('room_message', handleMsg);
      socket.off('private_message', handleMsg);
      socket.off('chat_history');
    };
  }, [lobbyId, playerName, selectedChat]);
  // --- SEND CHAT ---
  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const msg = {
      player: playerName,
      text: chatInput.trim(),
      to: selectedChat,
      lobbyId,
      time: Date.now()
    };
    if (window.socket) {
      if (selectedChat === 'all') {
        console.log('Sending room message:', msg);
        window.socket.emit('room_message', msg);
      } else {
        console.log('Sending private message:', msg);
        window.socket.emit('private_message', msg);
      }
    }
    setChatInput('');
  };

  const handleRefreshChats = () => {
    console.log('Refreshing chats...');
    if (window.socket) {
      window.socket.emit('request_game_state', { lobbyId });
    }
    setLoadingChats(true);
  };

  // --- CHAT GROUPS ---
  const allUsers = useMemo(() => (gameState?.players || []).sort(), [gameState]);
  const chatGroups = useMemo(() => {
    const groups = { all: [] };
    allUsers.forEach(u => { if (u !== playerName) groups[u] = []; });
    chatMessages.forEach(msg => {
      if (msg.to === 'all') {
        groups.all.push(msg);
      } else {
        // Include private messages for both sender and recipient
        if (groups[msg.player] && msg.to === playerName) groups[msg.player].push(msg);
        if (groups[msg.to] && msg.player === playerName) groups[msg.to].push(msg);
      }
    });
    return groups;
  }, [chatMessages, allUsers, playerName]);

  useEffect(() => {
    if (gameState && myCountryObj) {
      console.log("Game state:", gameState);
    }
  }, [gameState, myCountryObj]);

  // Debugging log to inspect the `chatGroups` state whenever it updates.
  useEffect(() => {
    console.log('chatGroups updated:', chatGroups);
  }, [chatGroups]);

  // --- UI ---
  if (error) return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-950 to-gray-800 min-h-screen flex flex-col items-center justify-center text-white">
      <div className="flex flex-col items-center justify-center gap-8">
        <div className="flex items-center gap-4 mb-6 animate-pulse">
          <img src="/logo.png" alt="Game Logo" className="h-16 w-16 rounded-full shadow-lg border border-blue-700 bg-gray-900" />
          <h1 className="text-4xl font-extrabold tracking-tight text-blue-400 drop-shadow">Mirgos</h1>
        </div>
        <div className="flex flex-col items-center gap-4 bg-gray-900/90 rounded-2xl shadow-2xl border-2 border-blue-700 px-12 py-10 text-center">
          <BarLoader color="#ef4444" height={8} width={220} speedMultiplier={0.7} />
          <div className="text-2xl font-semibold text-red-300 mt-4">{error}</div>
          <div className="text-gray-400 text-base mt-2">An error occurred. Please try rejoining the lobby or contact the host if the issue persists.</div>
          <div className="flex gap-4 mt-6">
            <button className="bg-blue-700 hover:bg-blue-800 px-6 py-3 rounded-lg text-white font-bold shadow text-lg" onClick={() => window.location.href = '/lobbies'}>Back to Lobby List</button>
            <button className="bg-gray-700 hover:bg-gray-800 px-6 py-3 rounded-lg text-white font-bold shadow text-lg" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    </div>
  );
  if (!gameState) return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-950 to-gray-800 min-h-screen flex flex-col items-center justify-center text-white">
      <div className="flex flex-col items-center justify-center gap-8">
        <div className="flex items-center gap-4 mb-6 animate-pulse">
          <img src="/logo.png" alt="Game Logo" className="h-16 w-16 rounded-full shadow-lg border border-blue-700 bg-gray-900" />
          <h1 className="text-4xl font-extrabold tracking-tight text-blue-400 drop-shadow">Mirgos</h1>
        </div>
        <div className="flex flex-col items-center gap-4 bg-gray-900/90 rounded-2xl shadow-2xl border-2 border-blue-700 px-12 py-10 text-center">
          <BarLoader color="#3b82f6" height={8} width={220} speedMultiplier={0.7} />
          <div className="text-2xl font-semibold text-blue-200 mt-4">Loading game state...</div>
          <div className="text-gray-400 text-base mt-2">Waiting for the host to start the game or for the server to respond.<br/>If this takes too long, try rejoining the lobby.</div>
          <div className="flex gap-4 mt-6">
            <button className="bg-blue-700 hover:bg-blue-800 px-6 py-3 rounded-lg text-white font-bold shadow text-lg" onClick={() => window.location.href = '/lobbies'}>Back to Lobby List</button>
            <button className="bg-gray-700 hover:bg-gray-800 px-6 py-3 rounded-lg text-white font-bold shadow text-lg" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    </div>
  );
  if (!myCountryObj) return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-950 to-gray-800 min-h-screen flex flex-col items-center justify-center text-white">
      <div className="flex flex-col items-center justify-center gap-8">
        <div className="flex items-center gap-4 mb-6 animate-pulse">
          <img src="/logo.png" alt="Game Logo" className="h-16 w-16 rounded-full shadow-lg border border-blue-700 bg-gray-900" />
          <h1 className="text-4xl font-extrabold tracking-tight text-blue-400 drop-shadow">Mirgos</h1>
        </div>
        <div className="flex flex-col items-center gap-4 bg-gray-900/90 rounded-2xl shadow-2xl border-2 border-blue-700 px-12 py-10 text-center">
          <BarLoader color="#facc15" height={8} width={220} speedMultiplier={0.7} />
          <div className="text-2xl font-semibold text-yellow-200 mt-4">Your country is not set or not found in the game state.</div>
          <div className="text-gray-400 text-base mt-2">Please reselect your country in the lobby or rejoin.<br/><span className='text-xs text-gray-500'>Available player names: {gameState && gameState.playerCountries && Object.keys(gameState.playerCountries).join(', ')}</span></div>
          <div className="flex gap-4 mt-6">
            <button className="bg-blue-700 hover:bg-blue-800 px-6 py-3 rounded-lg text-white font-bold shadow text-lg" onClick={() => window.location.href = '/lobbies'}>Back to Lobby List</button>
            <button className="bg-gray-700 hover:bg-gray-800 px-6 py-3 rounded-lg text-white font-bold shadow text-lg" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    </div>
  );
  if (!myCities || myCities.length === 0) return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-950 to-gray-800 min-h-screen flex flex-col items-center justify-center text-white">
      <div className="flex flex-col items-center justify-center gap-8">
        <div className="flex items-center gap-4 mb-6 animate-pulse">
          <img src="/logo.png" alt="Game Logo" className="h-16 w-16 rounded-full shadow-lg border border-blue-700 bg-gray-900" />
          <h1 className="text-4xl font-extrabold tracking-tight text-blue-400 drop-shadow">Mirgos</h1>
        </div>
        <div className="flex flex-col items-center gap-4 bg-gray-900/90 rounded-2xl shadow-2xl border-2 border-blue-700 px-12 py-10 text-center">
          <BarLoader color="#facc15" height={8} width={220} speedMultiplier={0.7} />
          <div className="text-2xl font-semibold text-yellow-200 mt-4">No cities found for your country (<b>{myCountryObj?.en}</b>).</div>
          <div className="text-gray-400 text-base mt-2">Please contact the host or try rejoining the lobby.<br/><span className='text-xs text-gray-500'>Available country keys: {gameState && gameState.cities && Object.keys(gameState.cities).join(', ')}</span></div>
          <div className="flex gap-4 mt-6">
            <button className="bg-blue-700 hover:bg-blue-800 px-6 py-3 rounded-lg text-white font-bold shadow text-lg" onClick={() => window.location.href = '/lobbies'}>Back to Lobby List</button>
            <button className="bg-gray-700 hover:bg-gray-800 px-6 py-3 rounded-lg text-white font-bold shadow text-lg" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    </div>
  );
  if (typeof myBudget === 'undefined') return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-950 to-gray-800 min-h-screen flex flex-col items-center justify-center text-white">
      <div className="flex flex-col items-center justify-center gap-8">
        <div className="flex items-center gap-4 mb-6 animate-pulse">
          <img src="/logo.png" alt="Game Logo" className="h-16 w-16 rounded-full shadow-lg border border-blue-700 bg-gray-900" />
          <h1 className="text-4xl font-extrabold tracking-tight text-blue-400 drop-shadow">Mirgos</h1>
        </div>
        <div className="flex flex-col items-center gap-4 bg-gray-900/90 rounded-2xl shadow-2xl border-2 border-blue-700 px-12 py-10 text-center">
          <BarLoader color="#facc15" height={8} width={220} speedMultiplier={0.7} />
          <div className="text-2xl font-semibold text-yellow-200 mt-4">Budget information missing for your country ({myCountry}).</div>
          <div className="text-gray-400 text-base mt-2">Please wait for the next round or rejoin.</div>
          <div className="flex gap-4 mt-6">
            <button className="bg-blue-700 hover:bg-blue-800 px-6 py-3 rounded-lg text-white font-bold shadow text-lg" onClick={() => window.location.href = '/lobbies'}>Back to Lobby List</button>
            <button className="bg-gray-700 hover:bg-gray-800 px-6 py-3 rounded-lg text-white font-bold shadow text-lg" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    </div>
  );
  if (typeof myArmy === 'undefined') return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-950 to-gray-800 min-h-screen flex flex-col items-center justify-center text-white">
      <div className="flex flex-col items-center justify-center gap-8">
        <div className="flex items-center gap-4 mb-6 animate-pulse">
          <img src="/logo.png" alt="Game Logo" className="h-16 w-16 rounded-full shadow-lg border border-blue-700 bg-gray-900" />
          <h1 className="text-4xl font-extrabold tracking-tight text-blue-400 drop-shadow">Mirgos</h1>
        </div>
        <div className="flex flex-col items-center gap-4 bg-gray-900/90 rounded-2xl shadow-2xl border-2 border-blue-700 px-12 py-10 text-center">
          <BarLoader color="#facc15" height={8} width={220} speedMultiplier={0.7} />
          <div className="text-2xl font-semibold text-yellow-200 mt-4">Army information missing for your country ({myCountry}).</div>
          <div className="text-gray-400 text-base mt-2">Please wait for the next round or rejoin.</div>
          <div className="flex gap-4 mt-6">
            <button className="bg-blue-700 hover:bg-blue-800 px-6 py-3 rounded-lg text-white font-bold shadow text-lg" onClick={() => window.location.href = '/lobbies'}>Back to Lobby List</button>
            <button className="bg-gray-700 hover:bg-gray-800 px-6 py-3 rounded-lg text-white font-bold shadow text-lg" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    </div>
  );

  // --- MAIN GAME UI ---
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-gray-800 text-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur shadow-lg flex items-center justify-between px-6 py-4 mb-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Game Logo" className="h-10 w-10 rounded-full shadow-lg border border-gray-700 bg-gray-900" />
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-400 drop-shadow">Mirgos</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-lg font-mono bg-gray-800 px-5 py-2 rounded-lg shadow border border-blue-700 text-blue-300 text-center text-shadow-lg animate-pulse">
            <span className="font-semibold">Timer:</span> {formatTime(timer)}
          </div>
          <select value={lang} onChange={handleLangChange} className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 transition-all">
            <option value="en">EN</option>
            <option value="ru">RU</option>
            <option value="uk">UA</option>
          </select>
          {!finished ? (
            <button className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg text-white font-semibold shadow transition-all focus:ring-2 focus:ring-blue-400" onClick={handleFinishTurn} disabled={finished || showSummary}>Finish Turn</button>
          ) : (
            !allFinished && <button className="bg-yellow-600 hover:bg-yellow-700 px-5 py-2 rounded-lg text-white font-semibold shadow transition-all focus:ring-2 focus:ring-yellow-400" onClick={handleUndoFinish}>Undo Finish</button>
          )}
        </div>
      </header>
      
      <main className="px-4 md:px-10 pb-10">
        {finished && !allFinished && (
          <div className="mb-4 text-yellow-300 text-center text-lg font-semibold animate-pulse">Waiting for other players to finish their turn... <span className="font-mono">({waitingPlayers.length} left)</span></div>
        )}
        {/* Action Summary Modal */}
        {showSummary && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-51">
            <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl max-w-lg w-full border-2 border-blue-700 relative">
              <h2 className="text-2xl font-bold mb-6 text-blue-300">Round {currentRound} Actions</h2>
              {actions && Object.keys(actions).length === 0 ? (
                <div className="mb-6 text-gray-300">No actions were taken this round.</div>
              ) : (
                <table className="w-full text-sm mb-4 rounded overflow-hidden">
                  <thead>
                    <tr className="bg-gray-900 text-blue-200">
                      <th className="px-3 py-2 text-left">Player</th>
                      <th className="px-3 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(actions).map(([player, acts]) => (
                      <tr key={player}>
                        <td className="font-semibold text-blue-400 px-3 py-2">{player}</td>
                        <td className="px-3 py-2">
                          <ul className="list-disc pl-4">
                            {acts.map((a, i) => (
                              <li key={i}>{actionDescription(a, lang)}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <button className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg text-white font-semibold shadow transition-all focus:ring-2 focus:ring-green-400 w-full" onClick={handleNextRound}>Continue to Next Round</button>
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-8 justify-center">
          {/* My Cities */}
          <section className="bg-gray-800/90 rounded-2xl p-6 min-w-[320px] shadow-lg border border-gray-700 flex-1 max-w-md hover:scale-105 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-blue-300">My Cities <span className="text-white font-normal">({myCountry})</span></h2>
              <button
                className="ml-4 bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-full text-white text-lg font-semibold shadow focus:ring-2 focus:ring-blue-400 transition-all flex items-center gap-2"
                onClick={() => setOpenSection('cities')}
                aria-label="Expand Cities"
              >
                <FaExpandAlt />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm mb-4 rounded overflow-hidden min-w-[650px]">
                <colgroup>
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '16%' }} />
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
                      <td>{city.stability}</td>
                      <td><button className="bg-blue-700 hover:bg-blue-800 px-2 py-1 rounded text-xs shadow focus:ring-2 focus:ring-blue-400" onClick={() => setUpgradeCity(city.displayName)} disabled={finished}>Select</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mb-2 text-lg">Available Budget: <span className="font-bold text-green-400">{myBudget}</span></div>
            <div className="mb-2 text-lg">Army: <span className="font-bold text-yellow-400">{myArmy}</span></div>
          </section>
          <SectionModal open={openSection === 'cities'} onClose={() => setOpenSection(null)}>
            <div className="w-full">
              <h2 className="text-3xl font-bold text-blue-300 mb-6">My Cities <span className="text-white text-2xl">({myCountry})</span></h2>
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
                        <td className="px-2 py-2 text-center">{city.stability}</td>
                        <td className="px-2 py-2 text-center">
                          <button
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded shadow text-sm"
                            onClick={() => setUpgradeCity(city.displayName)}
                            disabled={upgradeCity === city.displayName}
                          >
                            {upgradeCity === city.displayName ? 'Selected' : 'Select'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <div className="text-lg font-semibold text-white">Available Budget: <span className="text-green-400 text-2xl font-bold">{myBudget}</span></div>
                <div className="text-lg font-semibold text-white">Army: <span className="text-yellow-400 text-2xl font-bold">{myArmy}</span></div>
              </div>
            </div>
          </SectionModal>
          {/* All Countries & Attack UI */}
          <section className="bg-gray-800/90 rounded-2xl p-6 min-w-[320px] shadow-lg border border-gray-700 flex-1 max-w-xl hover:scale-105 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-blue-300">All Countries</h2>
              <button
                className="ml-4 bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-full text-white text-lg font-semibold shadow focus:ring-2 focus:ring-blue-400 transition-all flex items-center gap-2"
                onClick={() => setOpenSection('countries')}
                aria-label="Expand Countries"
              >
                <FaExpandAlt />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allCountryEnNames.map(countryEn => {
                const countryObj = gameState.countryNames && gameState.countryNames[countryEn];
                const countryLabel = countryObj ? countryObj[lang] : countryEn;
                return (
                  <div key={countryEn} className="mb-2 bg-gray-900/80 rounded-lg p-3 shadow border border-gray-700">
                    <div className="font-bold text-yellow-300 text-lg mb-1">{countryLabel}</div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {gameState.cities[countryEn].map(city => (
                        <span key={city[`name_${lang}`] || city.name_en} className="bg-gray-700 rounded px-2 py-1 text-xs mr-1 mb-1 inline-block text-blue-200 shadow">{city[`name_${lang}`] || city.name_en}</span>
                      ))}
                    </div>
                    {/* Attack UI */}
                    {countryEn !== (myCountryObj && myCountryObj.en) && (
                      <div className="mt-2 flex flex-wrap gap-2 items-center">
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
                            <option key={city[`name_${lang}`] || city.name_en} value={city[`name_${lang}`] || city.name_en}>{city[`name_${lang}`] || city.name_en}</option>
                          ))}
                        </select>
                        <input type="number" min={1} max={myArmy} value={attackTarget.country === countryEn ? attackTarget.army : ''} onChange={e => setAttackTarget(t => ({ ...t, country: countryEn, army: Number(e.target.value) }))} className="w-20 bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 focus:ring-2 focus:ring-red-400 transition-all" placeholder="Army" />
                        <button className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-xs text-white shadow focus:ring-2 focus:ring-red-400 transition-all" onClick={handleAttack} disabled={finished || !attackTarget.city || !attackTarget.army || attackTarget.country !== countryEn}>Attack</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
          <SectionModal open={openSection === 'countries'} onClose={() => setOpenSection(null)}>
            <h2 className="text-3xl font-bold mb-8 text-blue-300">All Countries</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {allCountryEnNames.map(countryEn => {
                const countryObj = gameState.countryNames && gameState.countryNames[countryEn];
                const countryLabel = countryObj ? countryObj[lang] : countryEn;
                return (
                  <div key={countryEn} className="mb-2 bg-gray-900/80 rounded-lg p-3 shadow border border-gray-700">
                    <div className="font-bold text-yellow-300 text-lg mb-1">{countryLabel}</div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {gameState.cities[countryEn].map(city => (
                        <span key={city[`name_${lang}`] || city.name_en} className="bg-gray-700 rounded px-2 py-1 text-xs mr-1 mb-1 inline-block text-blue-200 shadow">{city[`name_${lang}`] || city.name_en}</span>
                      ))}
                    </div>
                    {/* Attack UI */}
                    {countryEn !== (myCountryObj && myCountryObj.en) && (
                      <div className="mt-2 flex flex-wrap gap-2 items-center">
                        <select
                          className="bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 focus:ring-2 focus:ring-red-400 transition-all"
                          value={attackTarget.country === countryEn ? attackTarget.city : ''}
                          onChange={e => setAttackTarget(t =>
                            t.country === countryEn
                              ? { ...t, city: e.target.value }
                              : { country: countryEn, city: e.target.value, army: 0 }
                          )}
                        >
                          {gameState.cities[countryEn].map(city => (
                            <option key={city[`name_${lang}`] || city.name_en} value={city[`name_${lang}`] || city.name_en}>{city[`name_${lang}`] || city.name_en}</option>
                          ))}
                        </select>
                        <input type="number" min={1} max={myArmy} value={attackTarget.country === countryEn ? attackTarget.army : ''} onChange={e => setAttackTarget(t => ({ ...t, country: countryEn, army: Number(e.target.value) }))} className="w-20 bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 focus:ring-2 focus:ring-red-400 transition-all" placeholder="Army" />
                        <button className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-xs text-white shadow focus:ring-2 focus:ring-red-400 transition-all" onClick={handleAttack} disabled={finished || !attackTarget.city || !attackTarget.army || attackTarget.country !== countryEn}>Attack</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </SectionModal>
          {/* Actions Panel */}
          <section className="bg-gray-800/90 rounded-2xl p-6 min-w-[320px] shadow-lg border border-gray-700 flex-1 max-w-md hover:scale-105 transition-all flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-blue-300">Actions</h2>
              <button
                className="ml-4 bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-full text-white text-lg font-semibold shadow focus:ring-2 focus:ring-blue-400 transition-all flex items-center gap-2"
                onClick={() => setOpenSection('actions')}
                aria-label="Expand Actions"
              >
                <FaExpandAlt />
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-900/80 shadow-inner flex-1">
              <table className="min-w-full text-sm text-left text-white whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-900/80">
                    <th className="px-2 py-2 font-bold text-blue-200">Action</th>
                    <th className="px-2 py-2 font-bold text-blue-200">Description</th>
                    <th className="px-2 py-2 font-bold text-blue-200">Cost</th>
                    <th className="px-2 py-2 font-bold text-blue-200">Effect</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-semibold text-yellow-200 px-2 py-1">Buy Army</td>
                    <td className="px-2 py-1">Purchase army units for attack/defense.</td>
                    <td className="px-2 py-1">$300/unit</td>
                    <td className="px-2 py-1">+1 Army per unit</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-yellow-200 px-2 py-1">Upgrade City</td>
                    <td className="px-2 py-1">Increase city level for more income and defense.</td>
                    <td className="px-2 py-1">$500</td>
                    <td className="px-2 py-1">+1 Level, +50 Income, +Shield</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-yellow-200 px-2 py-1">Repair City</td>
                    <td className="px-2 py-1">Restore city stability after attack.</td>
                    <td className="px-2 py-1">Varies</td>
                    <td className="px-2 py-1">Stability restored to 100</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-yellow-200 px-2 py-1">Attack</td>
                    <td className="px-2 py-1">Attack another city's defenses.</td>
                    <td className="px-2 py-1">Army units used</td>
                    <td className="px-2 py-1">Capture city, reduce stability</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-yellow-200 px-2 py-1">Develop Nuclear</td>
                    <td className="px-2 py-1">Increase nuclear weapon level (1–3).</td>
                    <td className="px-2 py-1">$450/level</td>
                    <td className="px-2 py-1">Chance to create bomb (50%)</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-yellow-200 px-2 py-1">Use Nuclear</td>
                    <td className="px-2 py-1">Detonate nuclear bomb on a city.</td>
                    <td className="px-2 py-1">Bomb (if available)</td>
                    <td className="px-2 py-1">Massive damage, global stability drop</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-yellow-200 px-2 py-1">Sanction</td>
                    <td className="px-2 py-1">Suspend a country's income for 1–3 turns.</td>
                    <td className="px-2 py-1">—</td>
                    <td className="px-2 py-1">Target loses income for duration</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-yellow-200 px-2 py-1">Form Alliance</td>
                    <td className="px-2 py-1">Form a diplomatic alliance with another player.</td>
                    <td className="px-2 py-1">—</td>
                    <td className="px-2 py-1">Joint actions, shared defense</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-yellow-200 px-2 py-1">Trade</td>
                    <td className="px-2 py-1">Trade resources with another player.</td>
                    <td className="px-2 py-1">Negotiated</td>
                    <td className="px-2 py-1">Exchange budget, army, or cities</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="space-y-8 text-xl mt-8">
              <div className="flex gap-2 items-center">
                <input type="number" min={1} max={10} value={armyCount} onChange={e => setArmyCount(Number(e.target.value))} className="w-20 bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 transition-all" />
                <button className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-xs text-white shadow focus:ring-2 focus:ring-blue-400 transition-all" onClick={handleBuyArmy} disabled={finished}>Buy Army</button>
              </div>
              <div className="flex gap-2 items-center">
                <button className={`bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-xs text-white shadow focus:ring-2 focus:ring-blue-400 transition-all ${!upgradeCity ? 'opacity-60 cursor-not-allowed' : ''}`} onClick={handleUpgradeCity} disabled={finished || !upgradeCity}>Upgrade City {upgradeCity && `(${upgradeCity})`}</button>
              </div>
              <div className="flex gap-2 items-center">
                <button className="bg-purple-700 hover:bg-purple-800 px-3 py-1 rounded text-xs text-white shadow focus:ring-2 focus:ring-purple-400 transition-all" onClick={handleDevelopNuclear} disabled={finished}>Develop Nuclear</button>
              </div>
              <div className="flex gap-2 items-center">
                <select className="bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 focus:ring-2 focus:ring-red-400 transition-all" value={sanctionTarget} onChange={e => setSanctionTarget(e.target.value)}>
                  <option value="">Sanction Country</option>
                  {allCountryEnNames.filter(c => c !== (myCountryObj && myCountryObj.en)).map(c => {
                    const countryObj = gameState.countryNames && gameState.countryNames[c];
                    const countryLabel = countryObj ? countryObj[lang] : c;
                    return <option key={c} value={c}>{countryLabel}</option>;
                  })}
                </select>
                <button className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-xs text-white shadow focus:ring-2 focus:ring-red-400 transition-all" onClick={handleSetSanction} disabled={finished || !sanctionTarget}>Sanction</button>
              </div>
            </div>
          </section>
          <SectionModal open={openSection === 'actions'} onClose={() => setOpenSection(null)}>
            <h2 className="text-3xl font-bold mb-8 text-blue-300">Actions</h2>
            <div className="overflow-x-auto max-w-full">
              <table className="w-full text-base text-left text-white whitespace-nowrap min-w-[600px] border border-gray-700 bg-gray-900/80">
                <thead>
                  <tr className="bg-gray-900/80">
                    <th className="px-2 py-2 font-bold text-blue-200">Action</th>
                    <th className="px-2 py-2 font-bold text-blue-200">Description</th>
                    <th className="px-2 py-2 font-bold text-blue-200">Cost</th>
                    <th className="px-2 py-2 font-bold text-blue-200">Effect</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-semibold text-yellow-200 px-2 py-1">Buy Army</td>
                    <td className="px-2 py-1">Purchase army units for attack/defense.</td>
                    <td className="px-2 py-1">$300/unit</td>
                    <td className="px-2 py-1">+1 Army per unit</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-yellow-200 px-2 py-1">Upgrade City</td>
                    <td className="px-2 py-1">Increase city level for more income and defense.</td>
                    <td className="px-2 py-1">$500</td>
                    <td className="px-2 py-1">+1 Level, +50 Income, +Shield</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-yellow-200 px-2 py-1">Repair City</td>
                    <td className="px-2 py-1">Restore city stability after attack.</td>
                    <td className="px-2 py-1">Varies</td>
                    <td className="px-2 py-1">Stability restored to 100</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-yellow-200 px-2 py-1">Attack</td>
                    <td className="px-2 py-1">Attack another city's defenses.</td>
                    <td className="px-2 py-1">Army units used</td>
                    <td className="px-2 py-1">Capture city, reduce stability</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-yellow-200 px-2 py-1">Develop Nuclear</td>
                    <td className="px-2 py-1">Increase nuclear weapon level (1–3).</td>
                    <td className="px-2 py-1">$450/level</td>
                    <td className="px-2 py-1">Chance to create bomb (50%)</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-yellow-200 px-2 py-1">Use Nuclear</td>
                    <td className="px-2 py-1">Detonate nuclear bomb on a city.</td>
                    <td className="px-2 py-1">Bomb (if available)</td>
                    <td className="px-2 py-1">Massive damage, global stability drop</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-yellow-200 px-2 py-1">Sanction</td>
                    <td className="px-2 py-1">Suspend a country's income for 1–3 turns.</td>
                    <td className="px-2 py-1">—</td>
                    <td className="px-2 py-1">Target loses income for duration</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-yellow-200 px-2 py-1">Form Alliance</td>
                    <td className="px-2 py-1">Form a diplomatic alliance with another player.</td>
                    <td className="px-2 py-1">—</td>
                    <td className="px-2 py-1">Joint actions, shared defense</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-yellow-200 px-2 py-1">Trade</td>
                    <td className="px-2 py-1">Trade resources with another player.</td>
                    <td className="px-2 py-1">Negotiated</td>
                    <td className="px-2 py-1">Exchange budget, army, or cities</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="space-y-8 text-xl mt-8">
              <div className="flex gap-2 items-center">
                <input type="number" min={1} max={10} value={armyCount} onChange={e => setArmyCount(Number(e.target.value))} className="w-20 bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 transition-all" />
                <button className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-xs text-white shadow focus:ring-2 focus:ring-blue-400 transition-all" onClick={handleBuyArmy} disabled={finished}>Buy Army</button>
              </div>
              <div className="flex gap-2 items-center">
                <button className={`bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-xs text-white shadow focus:ring-2 focus:ring-blue-400 transition-all ${!upgradeCity ? 'opacity-60 cursor-not-allowed' : ''}`} onClick={handleUpgradeCity} disabled={finished || !upgradeCity}>Upgrade City {upgradeCity && `(${upgradeCity})`}</button>
              </div>
              <div className="flex gap-2 items-center">
                <button className="bg-purple-700 hover:bg-purple-800 px-3 py-1 rounded text-xs text-white shadow focus:ring-2 focus:ring-purple-400 transition-all" onClick={handleDevelopNuclear} disabled={finished}>Develop Nuclear</button>
              </div>
              <div className="flex gap-2 items-center">
                <select className="bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 focus:ring-2 focus:ring-red-400 transition-all" value={sanctionTarget} onChange={e => setSanctionTarget(e.target.value)}>
                  <option value="">Sanction Country</option>
                  {allCountryEnNames.filter(c => c !== (myCountryObj && myCountryObj.en)).map(c => {
                    const countryObj = gameState.countryNames && gameState.countryNames[c];
                    const countryLabel = countryObj ? countryObj[lang] : c;
                    return <option key={c} value={c}>{countryLabel}</option>;
                  })}
                </select>
                <button className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-xs text-white shadow focus:ring-2 focus:ring-red-400 transition-all" onClick={handleSetSanction} disabled={finished || !sanctionTarget}>Sanction</button>
              </div>
            </div>
          </SectionModal>
        </div>
        {/* Chat UI with user list and multiple chats */}
        <div className="mt-8 bg-gray-800/90 rounded-2xl p-6 shadow-lg border border-gray-700 flex">
          {loadingChats ? (
            <div className="flex items-center justify-center w-full h-full">
              <BarLoader />
            </div>
          ) : (
            <>
              <ChatUI
                playerName={playerName}
                allUsers={allUsers}
                chatGroups={chatGroups}
                handleRefreshChats={handleRefreshChats}
                handleSendChat={handleSendChat}
                setSelectedChat={setSelectedChat}
                selectedChat={selectedChat}
                chatInput={chatInput}
                setChatInput={setChatInput}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
