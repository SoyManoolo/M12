import { useNavigate } from "@remix-run/react";
import Navbar from "~/components/Navbar";
import Post from "~/components/Post";
import RightSidebar from "~/components/RightSidebar";
import { useState } from "react";

// Datos de ejemplo - En producción vendrían del backend
const MOCK_POSTS = [
  {
    post_id: '1',
    user: {
      user_id: 'user1',
      username: 'Usuario1',
      profile_picture_url: 'https://www.gob.mx/cms/uploads/article/main_image/78889/SANDIA_blog.jpg'
    },
    description: 'Esta es una descripción detallada del post donde el usuario puede explicar el contenido de su publicación. Puede ser un texto más largo que describe el contexto o la historia detrás de la imagen. Las sandías son frutas refrescantes y deliciosas que contienen muchos nutrientes esenciales. Son perfectas para los días calurosos de verano y pueden ser disfrutadas de múltiples formas, ya sea solas o en ensaladas de frutas.',
    media_url: 'https://fepadiet.com/wp-content/uploads/2024/08/propiedades-de-la-sandia.webp',
    comments: [
      { 
        comment_id: '1', 
        user_id: 'user2',
        username: 'Usuario2',
        content: '¡Gran publicación!',
        created_at: '2024-03-31T12:00:00Z'
      },
      { 
        comment_id: '2', 
        user_id: 'user3',
        username: 'Usuario3',
        content: 'Me encanta esta foto',
        created_at: '2024-03-31T12:01:00Z'
      },
      { 
        comment_id: '3', 
        user_id: 'user4',
        username: 'Usuario4',
        content: '¡Increíble!',
        created_at: '2024-03-31T12:02:00Z'
      }
    ],
    created_at: '2024-03-31T12:00:00Z',
    likes_count: 0,
    is_saved: false
  },
  {
    post_id: '2',
    user: {
      user_id: 'user3',
      username: 'CatLover',
      profile_picture_url: 'https://img.freepik.com/foto-gratis/retrato-hermoso-gato-blanco-negro_58409-14475.jpg'
    },
    description: 'Mi gato disfrutando de un día soleado en la ventana. Es increíble cómo encuentran los mejores lugares para relajarse. Los gatos son mascotas fascinantes que nos enseñan a disfrutar de los pequeños momentos de la vida. Este pequeño amigo siempre encuentra los mejores lugares para tomar el sol y me recuerda la importancia de tomarse un descanso de vez en cuando.',
    media_url: 'https://img.freepik.com/foto-gratis/gato-rojo-o-blanco-i-estudio-blanco_155003-13189.jpg',
    comments: [
      { 
        comment_id: '4', 
        user_id: 'user5',
        username: 'Usuario5',
        content: '¡Qué lindo gatito!',
        created_at: '2024-03-31T13:30:00Z'
      },
      { 
        comment_id: '5', 
        user_id: 'user6',
        username: 'Usuario6',
        content: 'Me encantan los gatos',
        created_at: '2024-03-31T13:31:00Z'
      }
    ],
    created_at: '2024-03-31T13:30:00Z',
    likes_count: 0,
    is_saved: false
  },
  {
    post_id: '3',
    user: {
      user_id: 'user4',
      username: 'FoodieExplorer',
      profile_picture_url: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg'
    },
    description: 'Preparando una deliciosa cena casera. Nada mejor que cocinar con ingredientes frescos y mucho amor. La cocina es una forma de expresión y creatividad que nos permite compartir momentos especiales con nuestros seres queridos. Esta receta ha sido transmitida en mi familia por generaciones y siempre trae buenos recuerdos. Los aromas y sabores de la cocina casera son incomparables.',
    media_url: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
    comments: [
      { 
        comment_id: '6', 
        user_id: 'user7',
        username: 'Usuario7',
        content: '¡Se ve delicioso!',
        created_at: '2024-03-31T14:15:00Z'
      },
      { 
        comment_id: '7', 
        user_id: 'user8',
        username: 'Usuario8',
        content: '¿Podrías compartir la receta?',
        created_at: '2024-03-31T14:16:00Z'
      }
    ],
    created_at: '2024-03-31T14:15:00Z',
    likes_count: 0,
    is_saved: false
  },
  {
    post_id: '4',
    user: {
      user_id: 'user5',
      username: 'TravelBug',
      profile_picture_url: 'https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg'
    },
    description: 'Explorando nuevos lugares y creando memorias inolvidables. Cada viaje es una nueva aventura que nos enseña algo nuevo sobre el mundo y sobre nosotros mismos. Este lugar en particular tiene una historia fascinante que se remonta a varios siglos atrás. La arquitectura, la cultura y la gente local han hecho de esta experiencia algo verdaderamente único y memorable. Definitivamente volveré a visitar este increíble destino.',
    media_url: 'https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg',
    comments: [
      { 
        comment_id: '9', 
        user_id: 'user10',
        username: 'Usuario10',
        content: '¡Qué lugar tan hermoso!',
        created_at: '2024-03-31T15:00:00Z'
      },
      { 
        comment_id: '10', 
        user_id: 'user11',
        username: 'Usuario11',
        content: '¿Dónde es esto?',
        created_at: '2024-03-31T15:01:00Z'
      }
    ],
    created_at: '2024-03-31T15:00:00Z',
    likes_count: 0,
    is_saved: false
  },
  {
    post_id: '5',
    user: {
      user_id: 'user6',
      username: 'MinecraftLover',
      profile_picture_url: 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg'
    },
    description: 'Acabo de terminar mi nueva construcción en Minecraft. Me tomó más de 100 horas crear este castillo medieval con todos sus detalles. Cada torre y habitación tiene su propia historia. Utilicé diferentes tipos de bloques para crear texturas únicas y el sistema de iluminación es completamente funcional. ¡Espero que les guste tanto como a mí!',
    media_url: 'https://i.ytimg.com/vi/abDEZOcQxMo/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCFvbbs7eUNmDwXPf4eD1ORTWZCog',
    comments: [
      { 
        comment_id: '11', 
        user_id: 'user12',
        username: 'Constructor99',
        content: '¡Increíble construcción! Me encantan los detalles de las torres.',
        created_at: '2024-03-31T16:00:00Z'
      },
      { 
        comment_id: '12', 
        user_id: 'user13',
        username: 'CrafterPro',
        content: '¿Cuántos bloques usaste en total? ¡Es impresionante!',
        created_at: '2024-03-31T16:05:00Z'
      }
    ],
    created_at: '2024-03-31T16:00:00Z',
    likes_count: 0,
    is_saved: false
  },
  {
    post_id: '6',
    user: {
      user_id: 'user7',
      username: 'MinecraftBuilder',
      profile_picture_url: 'https://images.pexels.com/photos/2007647/pexels-photo-2007647.jpeg'
    },
    description: '¡Nueva granja automática en Minecraft! Después de muchas pruebas, logré optimizar la producción de hierro al máximo. El diseño incluye un sistema de clasificación automática y almacenamiento eficiente. Los aldeanos están trabajando 24/7 y la producción es increíble. Si alguien quiere el tutorial, ¡déjenmelo saber en los comentarios!',
    media_url: 'https://pbs.twimg.com/media/E7vHaUJUYAA5fkg?format=jpg&name=large',
    comments: [
      { 
        comment_id: '13', 
        user_id: 'user14',
        username: 'RedstoneGuru',
        content: '¡Necesito ese tutorial! Se ve super eficiente.',
        created_at: '2024-03-31T17:00:00Z'
      },
      { 
        comment_id: '14', 
        user_id: 'user15',
        username: 'IronFarmer',
        content: '¿Cuánto hierro produces por hora?',
        created_at: '2024-03-31T17:02:00Z'
      }
    ],
    created_at: '2024-03-31T17:00:00Z',
    likes_count: 0,
    is_saved: false
  },
  {
    post_id: '7',
    user: {
      user_id: 'user8',
      username: 'BabyMikoFan',
      profile_picture_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVY2pwtZVxSiNyk0VS0DQpBPhzUehYc0HSUQ&s'
    },
    description: '¡Baby Miko sigue sorprendiendo! Su nuevo single "Kawaii Dance" está rompiendo récords en todas las plataformas. La mezcla de J-Pop con elementos electrónicos es simplemente perfecta. La coreografía es hipnotizante y su estilo único demuestra por qué es la nueva sensación del momento. ¡No puedo dejar de escucharla! 🎵✨',
    media_url: 'https://i.scdn.co/image/ab67616d00001e02f4ef46e5c28943a69eac0c02',
    comments: [
      { 
        comment_id: '15', 
        user_id: 'user16',
        username: 'JPopLover',
        content: '¡La coreografía es increíble! Baby Miko es la mejor.',
        created_at: '2024-03-31T18:00:00Z'
      },
      { 
        comment_id: '16', 
        user_id: 'user17',
        username: 'DanceQueen',
        content: 'Necesito aprender esos pasos de baile 💃',
        created_at: '2024-03-31T18:03:00Z'
      }
    ],
    created_at: '2024-03-31T18:00:00Z',
    likes_count: 0,
    is_saved: false
  },
  {
    post_id: '8',
    user: {
      user_id: 'user9',
      username: 'ChismesFrescos',
      profile_picture_url: 'https://i.pinimg.com/originals/a9/a0/85/a9a085921d1430d410bc5e02dba4d180.jpg'
    },
    description: '¡ÚLTIMA HORA! 🚨 Shakira lanza indirecta a Piqué en su nueva canción. La artista colombiana vuelve a la carga con otra letra explosiva que hace referencia a su ex y a su actual pareja. Los fans están enloquecidos con las referencias y los memes no se han hecho esperar. La reina del marketing lo ha vuelto a hacer. 🎵🔥 #Shakira #Piqué #NuevaCanción',
    media_url: 'https://parabellum.marketing/wp-content/uploads/2023/03/hackers-del-marketing-11.jpg',
    comments: [
      { 
        comment_id: '17', 
        user_id: 'user18',
        username: 'TeamShakira',
        content: '¡CLARA-mente otra obra maestra! 👑',
        created_at: '2024-03-31T19:00:00Z'
      },
      { 
        comment_id: '18', 
        user_id: 'user19',
        username: 'MusicFan',
        content: 'La letra es 🔥🔥🔥 Shakira no perdona',
        created_at: '2024-03-31T19:01:00Z'
      },
      { 
        comment_id: '19', 
        user_id: 'user20',
        username: 'MemeLord',
        content: 'Los memes están mejores que la canción 😂',
        created_at: '2024-03-31T19:05:00Z'
      }
    ],
    created_at: '2024-03-31T19:00:00Z',
    likes_count: 0,
    is_saved: false
  }
];

const MOCK_SUGGESTED_USERS = [
  {
    user_id: 'user10',
    username: 'Usuario10',
    first_name: 'Juan',
    last_name: 'Pérez',
    profile_picture_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
    common_friends_count: 3
  },
  {
    user_id: 'user11',
    username: 'Usuario11',
    first_name: 'María',
    last_name: 'García',
    profile_picture_url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
    common_friends_count: 5
  },
  {
    user_id: 'user12',
    username: 'Usuario12',
    first_name: 'Carlos',
    last_name: 'López',
    profile_picture_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
    common_friends_count: 2
  }
];

export default function InicioPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Aquí iría la llamada a la API para buscar usuarios
    console.log('Buscando usuarios:', query);
  };

  const handleFollow = (userId: string) => {
    // Aquí iría la llamada a la API para seguir al usuario
    console.log('Siguiendo al usuario:', userId);
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Barra lateral usando el componente Navbar */}
      <Navbar />

      {/* Contenido central */}
      <div className="w-2/3 ml-[16.666667%] border-r border-gray-800">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Feed Principal</h2>

          {/* Lista de posts */}
          {MOCK_POSTS.map((post) => (
            <Post
              key={post.post_id}
              post_id={post.post_id}
              user={post.user}
              description={post.description}
              media_url={post.media_url}
              comments={post.comments}
              created_at={post.created_at}
              likes_count={post.likes_count}
              is_saved={post.is_saved}
            />
          ))}
        </div>
      </div>

      {/* Barra lateral derecha */}
      <RightSidebar 
        suggestedUsers={MOCK_SUGGESTED_USERS}
        onSearch={handleSearch}
        onFollow={handleFollow}
      />
    </div>
  );
} 