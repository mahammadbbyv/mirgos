import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './pages/Login';
import Signup from './pages/Signup';
import LobbyList from './pages/LobbyList';
import LobbyWaitingRoom from './pages/Lobby';
import GameHUD from './pages/GameHUD';

function App() {
  const isAuthenticated = localStorage.getItem('token') !== null;
  const [currentLobby, setCurrentLobby] = useState(null);
  
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
          element={isAuthenticated ? <GameHUD /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;