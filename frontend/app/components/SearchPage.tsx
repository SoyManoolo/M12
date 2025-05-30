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
  bio?: string;
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
      const url = searchTerm ? `${environment.apiUrl}/users/username?username=${searchTerm}` : `${environment.apiUrl}/users`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        if (searchTerm && data.data && !Array.isArray(data.data)) {
           setUsers(data.data ? [data.data] : []);
        } else if (data.data && Array.isArray(data.data.users)) {
           setUsers(data.data.users);
        } else {
           setUsers([]);
        }
      } else {
         setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const initialFilteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.surname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedUsers = searchTerm ? users : initialFilteredUsers;

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  return (
    <div className="h-screen bg-black text-white flex">
      <Navbar />
      
      <div className="w-5/6 ml-[16.666667%] p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Búsqueda de Usuarios
            </h1>
            <p className="text-gray-400 text-sm">Encuentra y conecta con otros usuarios</p>
          </div>
          
          <div className="mb-8">
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
            displayedUsers.length === 0 && searchTerm !== '' ? (
              <div className="text-center text-gray-500 mt-8">
                No se encontraron usuarios que coincidan con la búsqueda.
              </div>
            ) : (
              <div className="space-y-4">
                {displayedUsers.map((user) => (
                  <div
                    key={user.user_id}
                    onClick={() => handleUserClick(user.user_id)}
                    className="flex items-center space-x-4 p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-blue-500 transition-all duration-300 cursor-pointer group min-h-[90px]"
                  >
                    <img
                      src={user.profile_picture || '/default-avatar.png'}
                      alt={user.username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-800 group-hover:border-blue-500 transition-all duration-300"
                    />
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                        {user.username}
                      </h2>
                      <p className="text-sm text-gray-400 truncate">{user.name} {user.surname}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
} 