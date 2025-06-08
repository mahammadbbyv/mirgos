import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../utils/auth';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async () => {
    const success = await registerUser(username, password);
    if (success.success) {
      navigate('/login');
    } else {
      console.log(success)
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
      <h2 className="text-3xl mb-4">Sign Up</h2>
      <input
        className="p-2 mb-2 text-black rounded"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <input
        className="p-2 mb-2 text-black rounded"
        placeholder="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      {error && <p className="text-red-400 mb-2">{error}</p>}
      <button className="bg-blue-600 px-4 py-2 rounded" onClick={handleSignup}>
        Sign Up
      </button>
    </div>
  );
}