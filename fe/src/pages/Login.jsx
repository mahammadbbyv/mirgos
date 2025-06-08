import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../utils/auth';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await loginUser(username, password);
    console.log('Login result:', result);
    if (result.success === true || (result && result.success)) {
      navigate('/lobbies');
    } else {
      console.error('Login failed:', result.error);
      setError(result.error);
    }
  };

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
      <h2 className="text-3xl mb-4">Login</h2>
      <form onSubmit={handleLogin} className="flex flex-col items-center w-full">
        <input
          className="p-2 mb-2 text-black rounded"
          placeholder="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <input
          className="p-2 mb-2 text-black rounded"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && <p className="text-red-400 mb-2">{error}</p>}
        <button className="bg-blue-600 px-4 py-2 rounded" type="submit">
          Log In
        </button>
      </form>
      <Link to="/signup" className="mt-4 text-blue-400 hover:underline">
        Don't have an account? Sign up
      </Link>
    </div>
  );
}
