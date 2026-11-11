/* eslint-disable jsx-a11y/media-has-caption -- Los medios subidos no incluyen pistas de subtítulos. */
import SecureImage from "~/components/Shared/SecureImage";
import { useTimeFormat } from "~/hooks/post/useTimeFormat";

interface PostMediaProps {
  mediaUrl: string;
  mediaType?: 'image' | 'video' | null;
  createdAt?: string;
  onImageClick: () => void;
  mobile?: boolean;
}

/**
 * Componente para mostrar la imagen/video del post
 */
export default function PostMedia({
  mediaUrl,
  mediaType,
  createdAt,
  onImageClick,
  mobile = false,
}: PostMediaProps) {
  const { formatRelativeTime } = useTimeFormat();
  const isVideo = mediaType === 'video';

  return (
    <div
      className={`rounded-lg overflow-hidden bg-soft w-full relative flex items-center justify-center ${mobile ? 'h-60' : 'h-full'}`}
    >
      {isVideo ? (
        <video src={mediaUrl} controls playsInline preload="metadata" className="w-full h-full object-contain" aria-label="Vídeo del post" />
      ) : (
        <SecureImage
          src={mediaUrl}
          alt="Contenido del post"
          className="w-full h-full object-cover cursor-pointer"
          onClick={onImageClick}
        />
      )}
      {/* Timestamp overlay */}
      {!mobile && createdAt && (
        <div className="absolute bottom-2 left-2 bg-page bg-opacity-50 px-3 py-1.5 rounded text-sm text-copy pointer-events-none">
          {formatRelativeTime(createdAt)}
        </div>
      )}
    </div>
  );
}
