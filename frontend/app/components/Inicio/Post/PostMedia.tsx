import SecureImage from "~/components/Shared/SecureImage";
import { useTimeFormat } from "~/hooks/post/useTimeFormat";

interface PostMediaProps {
  mediaUrl: string;
  createdAt: string;
  onImageClick: () => void;
}

/**
 * Componente para mostrar la imagen/video del post
 */
export default function PostMedia({
  mediaUrl,
  createdAt,
  onImageClick,
}: PostMediaProps) {
  const { formatRelativeTime } = useTimeFormat();

  return (
    <div
      className="rounded-lg overflow-hidden bg-gray-800 h-full w-full cursor-pointer relative flex items-center justify-center"
      onClick={onImageClick}
    >
      <SecureImage
        src={mediaUrl}
        alt="Contenido del post"
        className="w-full h-full object-cover"
      />
      {/* Timestamp overlay */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-3 py-1.5 rounded text-sm text-gray-300">
        {formatRelativeTime(createdAt)}
      </div>
    </div>
  );
}
