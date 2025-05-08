import { useState, useEffect } from 'react';
import Navbar from '~/components/Inicio/Navbar';
import { useAuth } from '~/hooks/useAuth';
import { redirect } from "@remix-run/node";

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setDescription('');
    setSelectedImage(null);
    setSelectedFile(null);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async () => {
    if (!token) {
      setError('No hay token de autenticación');
      return;
    }

    if (!description && !selectedFile) {
      setError('Debes agregar una descripción o una imagen');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('description', description);
      if (selectedFile) {
        formData.append('media', selectedFile);
      }

      console.log('Enviando publicación al backend...');
      const response = await fetch('http://localhost:3000/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data: CreatePostResponse = await response.json();
      console.log('Respuesta del backend:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear la publicación');
      }

      setSuccess('¡Publicación creada exitosamente!');
      console.log('Publicación creada:', data.newPost);
      
      // Limpiar el formulario después de 2 segundos
      setTimeout(() => {
        resetForm();
      }, 2000);

    } catch (err) {
      console.error('Error al crear la publicación:', err);
      setError(err instanceof Error ? err.message : 'Error al crear la publicación');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-black">
      {/* Navbar */}
      <div className="w-64">
        <Navbar />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="w-[900px] bg-gray-900 rounded-lg shadow-lg p-8 border border-gray-800">
          <h1 className="text-2xl font-bold mb-8 text-white text-center">Crear Nueva Publicación</h1>
          
          <div className="flex gap-8">
            {/* Área de imagen */}
            <div className="flex-1">
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center min-h-[350px] flex items-center justify-center bg-gray-800">
                {selectedImage ? (
                  <div className="relative">
                    <img
                      src={selectedImage}
                      alt="Vista previa"
                      className="max-w-full max-h-[350px] object-contain rounded-lg"
                    />
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setSelectedFile(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <svg
                      className="mx-auto h-16 w-16 text-gray-500"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex flex-col items-center space-y-4">
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors text-lg font-medium"
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
                      <p className="mt-2 text-sm text-gray-400">PNG, JPG, GIF hasta 10MB</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Área de descripción */}
            <div className="flex-1">
              <textarea
                className="w-full h-[350px] p-6 bg-gray-800 border border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-lg"
                placeholder="Escribe una descripción para tu publicación..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500 text-red-500 rounded-lg text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500 text-green-500 rounded-lg text-center">
              {success}
            </div>
          )}

          {/* Botón de publicar */}
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || (!description && !selectedFile)}
              className={`px-12 py-3 rounded-md text-lg font-medium transition-colors ${
                isSubmitting || (!description && !selectedFile)
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isSubmitting ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 