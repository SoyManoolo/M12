import { useState } from 'react';
import { Form, useNavigate } from "@remix-run/react";
import type { ActionFunction } from "@remix-run/node";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  // Aquí irá la lógica de autenticación cuando la implementemos
  return null;
};

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Por ahora solo redirigimos a la página de inicio
    navigate('/inicio');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black border border-gray-800 rounded-lg p-8">
        <h1 className="text-4xl text-white text-center mb-8 font-bold">LOG IN</h1>
        
        <Form method="post" onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-gray-300 text-sm font-medium mb-2">
              USER
            </label>
            <input
              type="text"
              id="username"
              name="username"
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
              name="password"
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
              onClick={() => navigate('/signup')}
              className="text-gray-400 hover:text-white text-sm border border-gray-600 px-4 py-2 rounded-md"
            >
              OR SIGN UP
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
} 