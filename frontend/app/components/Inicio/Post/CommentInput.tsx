import { useState, useRef, useEffect } from "react";
import { FaSmile, FaComment } from "react-icons/fa";
import type { EmojiClickData } from "emoji-picker-react";
import ClientEmojiPicker from "~/components/Chats/ClientEmojiPicker";

interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>;
  isSubmitting: boolean;
  placeholder?: string;
}

/**
 * Componente para el input de comentarios con emoji picker
 */
export default function CommentInput({
  onSubmit,
  isSubmitting,
  placeholder = "Añadir un comentario...",
}: CommentInputProps) {
  const [content, setContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    try {
      await onSubmit(content);
      setContent("");
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Error al enviar comentario:", error);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setContent((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center bg-gray-800 rounded-lg p-2 sm:p-3">
        <input
          type="text"
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:outline-none text-sm sm:text-base"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSubmit();
            }
          }}
          disabled={isSubmitting}
        />
        <button
          className={`ml-2 sm:ml-3 ${
            isSubmitting
              ? "text-gray-600"
              : "text-gray-400 hover:text-white cursor-pointer"
          }`}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={isSubmitting}
          type="button"
        >
          <FaSmile className="text-xl sm:text-2xl" />
        </button>
        <button
          className={`ml-2 sm:ml-3 ${
            isSubmitting
              ? "text-gray-600"
              : "text-gray-400 hover:text-white cursor-pointer"
          }`}
          onClick={handleSubmit}
          disabled={isSubmitting}
          type="button"
        >
          <FaComment className="text-xl sm:text-2xl" />
        </button>
      </div>

      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-full right-0 mb-2 z-50">
          <ClientEmojiPicker
            onEmojiClick={onEmojiClick}
            width={300}
            height={350}
          />
        </div>
      )}
    </div>
  );
}
