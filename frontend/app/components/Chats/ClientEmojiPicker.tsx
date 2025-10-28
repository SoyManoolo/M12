// app/components/Chats/ClientEmojiPicker.tsx

import { ClientOnly } from "remix-utils/client-only";
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

// Define las props que necesita EmojiPicker
interface ClientEmojiPickerProps {
  onEmojiClick: (emojiData: EmojiClickData) => void;
  width: number;
  height: number;
  // Puedes agregar más props de EmojiPicker si las usas, como theme, etc.
}

// Este componente utiliza ClientOnly para asegurarse de que EmojiPicker
// solo se renderice en el lado del cliente (navegador), evitando el error SSR.
export default function ClientEmojiPicker(props: ClientEmojiPickerProps) {
  return (
    <ClientOnly fallback={<div>Cargando selector de emojis...</div>}>
      {() => (
        <EmojiPicker
          onEmojiClick={props.onEmojiClick}
          theme={Theme.DARK} // Asumo que usas Theme.DARK
          width={props.width}
          height={props.height}
          searchDisabled={false}
          skinTonesDisabled={true}
          previewConfig={{
            showPreview: false
          }}
        />
      )}
    </ClientOnly>
  );
}