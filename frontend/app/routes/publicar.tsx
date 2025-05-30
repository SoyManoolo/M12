import { useState, useEffect } from 'react';
import Navbar from '~/components/Inicio/Navbar';
import { useAuth } from '~/hooks/useAuth';
import { redirect } from "@remix-run/node";
import Notification from '~/components/Shared/Notification';
import { useNavigate } from '@remix-run/react';
import { FaCamera, FaTimes, FaSpinner, FaImage, FaArrowLeft } from 'react-icons/fa';

interface CreatePostResponse {
  success: boolean;
  status: number;
  message: string;
  newPost: {
    post_id: string;
    user_id: string;
    description: string;
    media_url: string | null;
    created_at: string;
    updated_at: string;
    likes_count: number;
    is_saved: boolean;
  };
}

export const loader = async ({ request }: { request: Request }) => {
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader?.split(";").find((c: string) => c.trim().startsWith("token="))?.split("=")[1];
  if (!token) return redirect("/login");
  return null;
};

export default function Publicar() {
  const { token } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB
        setNotification({
          message: 'La imagen no puede ser mayor a 10MB',
          type: 'error'
        });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) {
        setNotification({
          message: 'La imagen no puede ser mayor a 10MB',
          type: 'error'
        });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setNotification({
        message: 'Por favor, selecciona una imagen válida',
        type: 'error'
      });
    }
  };

  const resetForm = () => {
    setDescription('');
    setSelectedImage(null);
    setSelectedFile(null);
    setNotification(null);
  };

  const handleSubmit = async () => {
    if (!token) {
      setNotification({
        message: 'No hay token de autenticación',
        type: 'error'
      });
      return;
    }

    if (!description.trim()) {
      setNotification({
        message: 'La descripción no puede estar vacía.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    try {
      const formData = new FormData();
      formData.append('description', description);
      if (selectedFile) {
        formData.append('media', selectedFile);
      }

      const response = await fetch('http://localhost:3000/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data: CreatePostResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear la publicación');
      }

      setNotification({
        message: '¡Publicación creada exitosamente!',
        type: 'success'
      });
      
      setTimeout(() => {
        resetForm();
        navigate('/inicio');
      }, 1000);

    } catch (err) {
      setNotification({
        message: err instanceof Error ? err.message : 'Error al crear la publicación',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-black">
        <Navbar />

      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="w-[900px] bg-gray-900 rounded-xl shadow-xl p-8 border border-gray-800">
          {/* Encabezado */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/inicio')}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <FaArrowLeft />
              <span>Volver</span>
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Crear Nueva Publicación
            </h1>
            <div className="w-24"></div> {/* Espaciador para centrar el título */}
          </div>
          
          <div className="flex gap-8">
            {/* Área de imagen */}
            <div className="flex-1">
              <div 
                className={`border-2 border-dashed rounded-xl p-6 text-center min-h-[350px] flex items-center justify-center transition-all duration-300 ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {selectedImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={selectedImage}
                      alt="Vista previa"
                      className="w-full h-full object-contain rounded-lg"
                    />
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setSelectedFile(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500/90 text-white p-2 rounded-full hover:bg-red-600 transition-all duration-300 transform hover:scale-110"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center">
                      <FaImage className="text-4xl text-blue-500" />
                    </div>
                    <div className="flex flex-col items-center space-y-4">
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-300 text-base font-medium shadow-lg transform hover:scale-105"
                      >
                        Seleccionar imagen
                      </label>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                      <p className="text-sm text-gray-400">
                        Arrastra una imagen o haz clic para seleccionar
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF hasta 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Área de descripción */}
            <div className="flex-1 flex flex-col">
            <div className="flex-1">
              <textarea
                  className="w-full h-[350px] p-6 bg-gray-800 border border-gray-700 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-lg transition-all duration-300"
                  placeholder="¿Qué quieres compartir con tus amigos?..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
              
              {/* Contador de caracteres */}
              <div className="mt-2 text-right">
                <span className={`text-sm ${description.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>
                  {description.length}/500
                </span>
          </div>

          {/* Botón de publicar */}
              <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
                  disabled={isSubmitting || !description.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium shadow-lg transform hover:scale-105 disabled:transform-none disabled:hover:scale-100 flex items-center space-x-2"
            >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Publicando...</span>
                    </>
                  ) : (
                    <>
                      <FaCamera />
                      <span>Publicar</span>
                    </>
                  )}
            </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notificación */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
} 