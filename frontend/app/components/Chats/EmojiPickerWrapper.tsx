// Este archivo contiene el código que DEBE EJECUTARSE SOLO EN EL CLIENTE.

import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useTheme } from '~/hooks/useTheme';

interface EmojiPickerWrapperProps {
  onEmojiClick: (emojiData: EmojiClickData) => void;
  width: number;
  height: number;
}

// Nota: No usamos 'export default' para esta función, solo la exportamos normalmente
// para evitar problemas de orden de inicialización con algunas herramientas de build.
export function EmojiPickerWrapper(props: EmojiPickerWrapperProps) {
  const { theme } = useTheme();
  return (
    <EmojiPicker
      onEmojiClick={props.onEmojiClick}
      theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
      width={props.width}
      height={props.height}
      searchDisabled={false}
      skinTonesDisabled={true}
      previewConfig={{
        showPreview: false
      }}
    />
  );
}
