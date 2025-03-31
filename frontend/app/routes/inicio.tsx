import { useNavigate } from "@remix-run/react";
import Navbar from "~/components/Navbar";
import Post from "~/components/Post";
import { FaSearch } from 'react-icons/fa';

// Datos de ejemplo - En producción vendrían del backend
const MOCK_POSTS = [
  {
    id: '1',
    userImage: 'https://www.gob.mx/cms/uploads/article/main_image/78889/SANDIA_blog.jpg',
    userName: 'Usuario1',
    description: 'Esta es una descripción detallada del post donde el usuario puede explicar el contenido de su publicación. Puede ser un texto más largo que describe el contexto o la historia detrás de la imagen. Las sandías son frutas refrescantes y deliciosas que contienen muchos nutrientes esenciales. Son perfectas para los días calurosos de verano y pueden ser disfrutadas de múltiples formas, ya sea solas o en ensaladas de frutas.',
    content: 'https://fepadiet.com/wp-content/uploads/2024/08/propiedades-de-la-sandia.webp',
    comments: [
      { id: '1', userName: 'Usuario2', text: '¡Gran publicación!' },
      { id: '2', userName: 'Usuario3', text: 'Me encanta esta foto' },
      { id: '3', userName: 'Usuario4', text: '¡Increíble!' }
    ],
    createdAt: '2024-03-31T12:00:00Z'
  },
  {
    id: '2',
    userImage: 'https://img.freepik.com/foto-gratis/retrato-hermoso-gato-blanco-negro_58409-14475.jpg',
    userName: 'CatLover',
    description: 'Mi gato disfrutando de un día soleado en la ventana. Es increíble cómo encuentran los mejores lugares para relajarse. Los gatos son mascotas fascinantes que nos enseñan a disfrutar de los pequeños momentos de la vida. Este pequeño amigo siempre encuentra los mejores lugares para tomar el sol y me recuerda la importancia de tomarse un descanso de vez en cuando.',
    content: 'https://img.freepik.com/foto-gratis/gato-rojo-o-blanco-i-estudio-blanco_155003-13189.jpg',
    comments: [
      { id: '4', userName: 'Usuario5', text: '¡Qué lindo gatito!' },
      { id: '5', userName: 'Usuario6', text: 'Me encantan los gatos' }
    ],
    createdAt: '2024-03-31T13:30:00Z'
  },
  {
    id: '3',
    userImage: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg',
    userName: 'FoodieExplorer',
    description: 'Preparando una deliciosa cena casera. Nada mejor que cocinar con ingredientes frescos y mucho amor. La cocina es una forma de expresión y creatividad que nos permite compartir momentos especiales con nuestros seres queridos. Esta receta ha sido transmitida en mi familia por generaciones y siempre trae buenos recuerdos. Los aromas y sabores de la cocina casera son incomparables.',
    content: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
    comments: [
      { id: '6', userName: 'Usuario7', text: '¡Se ve delicioso!' },
      { id: '7', userName: 'Usuario8', text: '¿Podrías compartir la receta?' }
    ],
    createdAt: '2024-03-31T14:15:00Z'
  },
  {
    id: '4',
    userImage: 'https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg',
    userName: 'TravelBug',
    description: 'Explorando nuevos lugares y creando memorias inolvidables. Cada viaje es una nueva aventura que nos enseña algo nuevo sobre el mundo y sobre nosotros mismos. Este lugar en particular tiene una historia fascinante que se remonta a varios siglos atrás. La arquitectura, la cultura y la gente local han hecho de esta experiencia algo verdaderamente único y memorable. Definitivamente volveré a visitar este increíble destino.',
    content: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg',
    comments: [
      { id: '9', userName: 'Usuario10', text: '¡Qué lugar tan hermoso!' },
      { id: '10', userName: 'Usuario11', text: '¿Dónde es esto?' }
    ],
    createdAt: '2024-03-31T15:00:00Z'
  }
];

export default function InicioPage() {
  const navigate = useNavigate();

  const handleNavigation = (route: string) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Barra lateral usando el componente Navbar */}
      <Navbar onNavigate={handleNavigation} />

      {/* Contenido central */}
      <div className="w-1/2 ml-[16.666667%] border-r border-gray-800">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Feed Principal</h2>
          
          {/* Lista de posts */}
          {MOCK_POSTS.map(post => (
            <Post key={post.id} {...post} />
          ))}
        </div>
      </div>

      {/* Barra lateral derecha */}
      <div className="w-1/3 p-4 fixed right-0">
        <div className="mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar amigos..."
              className="w-full bg-gray-900 rounded-full py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Amigos sugeridos</h3>
          {/* Lista de amigos */}
          {[1, 2, 3, 4, 5].map((friend) => (
            <div key={friend} className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                <div className="ml-3">
                  <p className="font-semibold">Usuario {friend}</p>
                  <p className="text-sm text-gray-400">5 amigos en común</p>
                </div>
              </div>
              <button className="text-blue-500 hover:text-blue-400">Seguir</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 