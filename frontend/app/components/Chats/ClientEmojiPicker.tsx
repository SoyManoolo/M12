// app/components/Chats/ClientEmojiPicker.tsx

import { ClientOnly } from "remix-utils/client-only";
import type { EmojiClickData } from 'emoji-picker-react'; // Importamos solo el tipo

// Define las props que necesita el componente
interface ClientEmojiPickerProps {
  onEmojiClick: (emojiData: EmojiClickData) => void;
  width: number;
  height: number;
}

export default function ClientEmojiPicker(props: ClientEmojiPickerProps) {
  return (
    <ClientOnly fallback={<div>Cargando selector de emojis...</div>}>
      {/*
        El import dinámico dentro de ClientOnly asegura que el código de 
        EmojiPickerWrapper (y por lo tanto de EmojiPicker) solo se cargue 
        en el cliente, eliminando la causa raíz del error SSR y, a menudo, 
        los problemas de TDZ en el bundle.
      */}
      {() => {
        // Importación dinámica (client-side only)
        const { EmojiPickerWrapper } = require("./EmojiPickerWrapper");
        return <EmojiPickerWrapper {...props} />;
      }}
    </ClientOnly>
  );
}