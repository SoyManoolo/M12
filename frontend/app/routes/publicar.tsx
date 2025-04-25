import { useState, useEffect } from 'react';
import Navbar from '~/components/Inicio/Navbar';

export default function Publicar() {
  const [mounted, setMounted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
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
                  <img
                    src={selectedImage}
                    alt="Vista previa"
                    className="max-w-full max-h-[350px] object-contain rounded-lg"
                  />
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

          {/* Botón de publicar */}
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              className="bg-blue-600 text-white px-12 py-3 rounded-md hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              Publicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 