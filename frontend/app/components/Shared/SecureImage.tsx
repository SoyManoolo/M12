import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { environment } from '../../config/environment';

interface SecureImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: (e: MouseEvent<HTMLImageElement>) => void;
}

// Share fetched blobs between repeated avatars while keeping object URLs scoped
// to the mounted image so they can be revoked as soon as the image is replaced.
const imageRequests = new Map<string, Promise<Blob>>();

function getImageRequest(src: string): Promise<Blob> {
  const url = src.startsWith('/') ? `${environment.apiUrl}${src}` : src;
  let request = imageRequests.get(url);
  if (!request) {
    request = fetch(url, { headers: { 'Ngrok-Skip-Browser-Warning': 'true' } })
      .then(response => {
        if (!response.ok) throw new Error(`Image request failed (${response.status})`);
        return response.blob();
      })
      .catch(error => {
        imageRequests.delete(url);
        throw error;
      });
    imageRequests.set(url, request);
  }
  return request;
}

export default function SecureImage({ src, alt, className, onClick }: SecureImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '200px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    setImageUrl('');
    setFailed(false);
    if (src && isVisible) {
      getImageRequest(src).then(blob => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      }).catch(() => {
        if (active) setFailed(true);
      });
    }
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, isVisible]);

  return (
    <div ref={containerRef} className={`${className || ''} ${!imageUrl ? 'bg-gray-800' : ''}`}>
      {imageUrl ? (
        <img src={imageUrl} alt={alt} className="h-full w-full object-cover" onClick={onClick} loading="lazy" />
      ) : failed ? (
        <span className="sr-only">No se pudo cargar la imagen de {alt}</span>
      ) : (
        <span className="block h-full w-full animate-pulse" aria-hidden="true" />
      )}
    </div>
  );
}
