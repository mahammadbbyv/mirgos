/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadLobbyList, joinLobby, connectToServer, getSocket } from '../utils/lobby-refactored';
import BarLoader from 'react-spinners/BarLoader';

export default function LobbyList({ setCurrentLobby }) {
  const [name, setName] = useState('');
  const [lobbies, setLobbies] = useState([]);
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);
  const [joiningLobby, setJoiningLobby] = useState(false);
  const [joinError, setJoinError] = useState(null);

  const handleSetLobbies = (data) => {
    console.log('Lobbies data:', data);
    if (data === 401 || data === 403) {
      localStorage.removeItem('playerName');
      localStorage.removeItem('token');
      navigate('/login');
    } else {
      setLobbies(data);
    }
  };
  useEffect(() => {
    const playerName = localStorage.getItem('playerName');
    if (!playerName) {
      navigate('/login');
    } else {
      setName(playerName);
      
      // Initialize socket connection
      try {
        connectToServer();
        
        // Wait briefly for socket to establish connection
        setTimeout(() => {
          setConnected(true);
          loadLobbyList(handleSetLobbies);
        }, 500);
      } catch (error) {
        console.error('Failed to connect to server:', error);
        setJoinError('Failed to connect to server. Please refresh the page and try again.');
      }
    }
  }, []);
  return connected ? (
    <div className="p-6 text-white bg-gray-800 min-h-screen">
      <h2 className="text-2xl mb-6">Welcome, {name}!</h2>
      {joinError && (
        <div className="bg-red-600 text-white p-2 mb-4 rounded text-center">
          {joinError}
          <button 
            className="ml-2 underline" 
            onClick={() => setJoinError(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl">Available Lobbies</h3>        <button
          onClick={() => {
            const lobbyId = `${name}'s Lobby`;
            setCurrentLobby(lobbyId);
            localStorage.setItem('currentLobby', lobbyId); // Ensure lobbyId is saved for GameHUD
            navigate(`/lobby/${lobbyId}/waiting-room`);
          }}
          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded"
        >
          Create Lobby
        </button>
      </div>
      <ul className="space-y-4">
        {lobbies.length === 0 ? (
          <li className="text-gray-400">No lobbies available.</li>
        ) : (
          lobbies.map((lobby) => (
            <li
              key={lobby.id}
              className="flex justify-between items-center bg-gray-700 rounded px-4 py-3"
            >
              <div>
                <span className="font-semibold">{lobby.id}</span>
                <span className="ml-2 text-sm text-gray-300">
                  ({lobby.players.length} player{lobby.players.length !== 1 ? 's' : ''})
                </span>
              </div>              <button
                className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded"
                disabled={joiningLobby}
                onClick={async () => {
                  try {
                    // Reset any previous errors
                    setJoinError(null);
                    setJoiningLobby(true);
                    
                    // Ensure socket is connected before joining
                    connectToServer();
                    
                    // Wait for socket to be properly connected
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Get the active socket
                    const socket = getSocket();
                    
                    if (!socket || !socket.connected) {
                      throw new Error('Socket is not connected. Please try again.');
                    }
                    
                    console.log(`[${new Date().toLocaleTimeString()}] 🔌 Joining with socket ID: ${socket.id}`);
                    
                    // Try to join the lobby
                    await joinLobby(lobby.id, name);
                    
                    // If successful, update the UI and navigate
                    setCurrentLobby(lobby.id);
                    localStorage.setItem('currentLobby', lobby.id); // Ensure lobbyId is saved for GameHUD
                    navigate(`/lobby/${lobby.id}/waiting-room`);
                  } catch (error) {
                    console.error('Failed to join lobby:', error);
                    setJoinError(error.message || 'Failed to join lobby. Please try again.');
                  } finally {
                    setJoiningLobby(false);
                  }
                }}
              >
                {joiningLobby ? 'Joining...' : 'Join'}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  ) : (
    <div className="h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
      <h2 className="text-3xl mb-4">Connecting...</h2>
      <BarLoader
        color="#36d7b7"
        loading={!connected}
        cssOverride={{ margin: '0 auto' }}
        size={50}
      />
      <p className="mt-4">Please wait while we establish a connection.</p>
    </div>
  );
}