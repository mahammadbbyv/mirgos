/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadLobbyList, joinLobby } from '../utils/lobby';
import BarLoader from 'react-spinners/BarLoader';

export default function LobbyList({ setCurrentLobby }) {
  const [name, setName] = useState('');
  const [lobbies, setLobbies] = useState([]);
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);

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
      setConnected(true);
      loadLobbyList(handleSetLobbies);
    }
  }, []);

  return connected ? (
    <div className="p-6 text-white bg-gray-800 min-h-screen">
      <h2 className="text-2xl mb-6">Welcome, {name}!</h2>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl">Available Lobbies</h3>
        <button
          onClick={() => {
            const lobbyId = `${name}'s Lobby`;
            setCurrentLobby(lobbyId);
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
              </div>
              <button
                className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded"
                onClick={async () => {
                  await joinLobby(lobby.id);
                  setCurrentLobby(lobby.id);
                  localStorage.setItem('currentLobbyId', lobby.id); // Ensure lobbyId is saved for GameHUD
                  navigate(`/lobby/${lobby.id}/waiting-room`);
                }}
              >
                Join
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