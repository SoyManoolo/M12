import { useState } from "react";
import { sanitizeUserText } from "~/utils/sanitize";

interface PostDescriptionProps {
  description: string;
  maxLength?: number;
}

/**
 * Componente para mostrar la descripción del post con opción de expandir
 */
export default function PostDescription({
  description,
  maxLength = 120,
}: PostDescriptionProps) {
  const [showFull, setShowFull] = useState(false);
  const safeDescription = sanitizeUserText(description);

  const needsTruncation = safeDescription.length > maxLength;
  const displayText = showFull || !needsTruncation 
    ? safeDescription
    : safeDescription.slice(0, maxLength);

  return (
    <div className="text-gray-300 text-sm sm:text-base">
      <p>{displayText}</p>
      {needsTruncation && (
        <button
          onClick={() => setShowFull(!showFull)}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium block mt-2"
        >
          {showFull ? "Ver menos" : "Leer más..."}
        </button>
      )}
    </div>
  );
}
