import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './pages/Login';
import Signup from './pages/Signup';
import LobbyList from './pages/LobbyList';
import LobbyWaitingRoom from './pages/Lobby';
import GameHUDRefactored from './pages/GameHUDRefactored.jsx'; // Use refactored version

function App() {
  const isAuthenticated = localStorage.getItem('token') !== null;
  const [currentLobby, setCurrentLobby] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      localStorage.removeItem('playerName');
      localStorage.removeItem('token');
    }
    const playerName = localStorage.getItem('playerName');
    if (!playerName) {
      localStorage.removeItem('playerName');
      localStorage.removeItem('token');
    }
    if (isAuthenticated && !playerName) {
      localStorage.removeItem('token');
      localStorage.removeItem('playerName');
    }
    if (isAuthenticated && !currentLobby) {
      const lobbyId = localStorage.getItem('currentLobby');
      if (lobbyId) {
        setCurrentLobby(lobbyId);
      }
    }else if (!isAuthenticated && currentLobby) {
      setCurrentLobby(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/lobbies"
          element={isAuthenticated ? <LobbyList setCurrentLobby={setCurrentLobby} /> : <Navigate to="/login" />} />
        <Route
          path="/lobby/:lobbyId"
          element={isAuthenticated ? <LobbyList setCurrentLobby={setCurrentLobby} /> : <Navigate to="/login" />} />
        <Route
          path="/lobby/:lobbyId/waiting-room"
          element={isAuthenticated ? <LobbyWaitingRoom /> : <Navigate to="/login" />} />
        <Route
          path="/lobby/:lobbyId/game"
          element={isAuthenticated ? <GameHUDRefactored /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;