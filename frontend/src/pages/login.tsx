import { useState } from 'react';
import { useRouter } from 'next/router';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Por ahora solo redirigimos a la página de inicio
    router.push('/inicio');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black border border-gray-800 rounded-lg p-8">
        <h1 className="text-4xl text-white text-center mb-8 font-bold">LOG IN</h1>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-gray-300 text-sm font-medium mb-2">
              USER
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-gray-600 rounded-md text-white focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-300 text-sm font-medium mb-2">
              PASSWORD
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-gray-600 rounded-md text-white focus:outline-none focus:border-white"
            />
          </div>

          <div className="text-right">
            <a href="#" className="text-sm text-gray-400 hover:text-white">
              FORGOT PASSWORD?
            </a>
          </div>

          <button
            type="submit"
            className="w-full bg-white text-black py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
          >
            LOG IN
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/signup')}
              className="text-gray-400 hover:text-white text-sm border border-gray-600 px-4 py-2 rounded-md"
            >
              OR SIGN UP
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage; 