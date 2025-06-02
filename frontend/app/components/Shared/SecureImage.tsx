import { useState, useEffect, MouseEvent } from 'react';
import { environment } from '../../config/environment';

interface SecureImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: (e: MouseEvent<HTMLImageElement>) => void;
}

export default function SecureImage({ src, alt, className, onClick }: SecureImageProps) {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const fetchImage = async () => {
      try {
        // Construir la URL completa si es una ruta relativa
        let fullUrl = src;
        if (src.startsWith('/')) {
          fullUrl = `${environment.apiUrl}${src}`;
        }

        const response = await fetch(fullUrl, {
          headers: {
            'Ngrok-Skip-Browser-Warning': 'true'
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          setImageUrl(objectUrl);
        } else {
          console.error('Error al cargar la imagen:', response.statusText);
        }
      } catch (error) {
        console.error('Error al cargar la imagen:', error);
      }
    };

    if (src) {
      fetchImage();
    }

    // Limpiar el objeto URL cuando el componente se desmonte
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [src]);

  if (!imageUrl) {
    return (
      <div className={`${className} bg-gray-800 animate-pulse`} />
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onClick={onClick}
    />
  );
} 