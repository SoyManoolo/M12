// app/components/Chats/ClientEmojiPicker.tsx

import { lazy, Suspense, useEffect, useState } from "react";
import type { EmojiClickData } from 'emoji-picker-react'; // Importamos solo el tipo

// Importación lazy del wrapper (solo se carga en el cliente)
const EmojiPickerWrapper = lazy(() => import("./EmojiPickerWrapper").then(module => ({ default: module.EmojiPickerWrapper })));

// Define las props que necesita el componente
interface ClientEmojiPickerProps {
  onEmojiClick: (emojiData: EmojiClickData) => void;
  width: number;
  height: number;
}

export default function ClientEmojiPicker(props: ClientEmojiPickerProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="p-4 text-center text-gray-400">Cargando emojis...</div>;
  }

  return (
    <Suspense fallback={<div className="p-4 text-center text-gray-400">Cargando emojis...</div>}>
      <EmojiPickerWrapper {...props} />
    </Suspense>
  );
}