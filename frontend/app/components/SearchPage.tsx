import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { environment } from '~/config/environment';
import Navbar from './Inicio/Navbar';

interface User {
  user_id: string;
  username: string;
  name: string;
  surname: string;
  profile_picture: string;
  bio: string;
}

export default function SearchPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${environment.apiUrl}/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.surname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="h-screen bg-black text-white flex">
      <Navbar />
      
      <div className="w-5/6 ml-[16.666667%] p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Buscar Usuarios
          </h1>
          
          <div className="mb-6">
            <input
              type="text"
              placeholder="Buscar por nombre de usuario, nombre o apellido..."
              className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.user_id}
                  onClick={() => handleUserClick(user.user_id)}
                  className="flex items-center space-x-4 p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-blue-500 transition-all duration-300 cursor-pointer group"
                >
                  <img
                    src={user.profile_picture || '/default-avatar.png'}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-800 group-hover:border-blue-500 transition-all duration-300"
                  />
                  <div>
                    <h2 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {user.username}
                    </h2>
                    <p className="text-gray-400">{user.name} {user.surname}</p>
                    {user.bio && (
                      <p className="text-sm text-gray-500 mt-1">{user.bio}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 