import { useState } from 'react';
import { Form, useNavigate, Link } from "@remix-run/react";
import type { ActionFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  // Aquí irá la lógica de registro cuando la implementemos
  // Por ahora, simplemente redirigimos a inicio
  return redirect('/inicio');
};

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleGoogleSignUp = () => {
    // Implementar signup con Google
    console.log('Google signup');
    navigate('/inicio');
  };

  const handleFacebookSignUp = () => {
    // Implementar signup con Facebook
    console.log('Facebook signup');
    navigate('/inicio');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black border border-gray-800 rounded-lg p-8">
        <h1 className="text-4xl text-white text-center mb-8 font-bold tracking-wider">SIGN UP</h1>
        
        <Form method="post" className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-gray-300 text-sm font-medium mb-2 tracking-wider">
              NAME
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-gray-600 rounded-md text-white focus:outline-none focus:border-white cursor-text"
            />
          </div>

          <div>
            <label htmlFor="surname" className="block text-gray-300 text-sm font-medium mb-2 tracking-wider">
              SURNAME
            </label>
            <input
              type="text"
              id="surname"
              name="surname"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-gray-600 rounded-md text-white focus:outline-none focus:border-white cursor-text"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-gray-300 text-sm font-medium mb-2 tracking-wider">
              USERNAME
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-gray-600 rounded-md text-white focus:outline-none focus:border-white cursor-text"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-gray-300 text-sm font-medium mb-2 tracking-wider">
              EMAIL
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-gray-600 rounded-md text-white focus:outline-none focus:border-white cursor-text"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-300 text-sm font-medium mb-2 tracking-wider">
              PASSWORD
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-transparent border border-gray-600 rounded-md text-white focus:outline-none focus:border-white cursor-text"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-white text-black py-2 px-4 rounded-md hover:bg-gray-200 transition-colors tracking-wider cursor-pointer"
          >
            SIGN UP
          </button>

          <div className="mt-6">
            <p className="text-gray-400 text-center mb-4 tracking-wider">SIGN UP WITH:</p>
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={handleGoogleSignUp}
                className="text-white hover:text-gray-300 tracking-wider cursor-pointer"
              >
                GOOGLE
              </button>
              <button
                type="button"
                onClick={handleFacebookSignUp}
                className="text-white hover:text-gray-300 tracking-wider cursor-pointer"
              >
                FACEBOOK
              </button>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link
              to="/login"
              className="inline-block text-gray-400 hover:text-white text-sm tracking-wider border border-gray-600 px-6 py-2 rounded-md cursor-pointer"
            >
              BACK TO LOGIN
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
