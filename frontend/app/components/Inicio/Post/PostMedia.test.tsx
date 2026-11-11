import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PostMedia from './PostMedia';

vi.mock('~/components/Shared/SecureImage', () => ({
  default: ({ src, alt, onClick }: { src: string; alt: string; onClick: () => void }) => (
    <img src={src} alt={alt} onClick={onClick} />
  ),
}));

describe.each([false, true])('PostMedia mobile=%s', (mobile) => {
  it('muestra vídeos con controles sin abrir el visor de imágenes', () => {
    const onImageClick = vi.fn();
    const { container } = render(
      <PostMedia mediaUrl="/media/videos/clip.mp4" mediaType="video" onImageClick={onImageClick} mobile={mobile} />
    );

    const video = screen.getByLabelText('Vídeo del post');
    expect(video.tagName).toBe('VIDEO');
    expect(video.getAttribute('controls')).not.toBeNull();
    expect(video.getAttribute('playsinline')).not.toBeNull();
    expect(video.getAttribute('src')).toBe('/media/videos/clip.mp4');
    fireEvent.click(video);
    expect(onImageClick).not.toHaveBeenCalled();
    expect(container.querySelector('img')).toBeNull();
  });

  it('mantiene las imágenes y permite abrirlas', () => {
    const onImageClick = vi.fn();
    render(<PostMedia mediaUrl="/media/images/photo.png" mediaType="image" onImageClick={onImageClick} mobile={mobile} />);

    fireEvent.click(screen.getByAltText('Contenido del post'));
    expect(onImageClick).toHaveBeenCalledOnce();
    expect(screen.queryByLabelText('Vídeo del post')).toBeNull();
  });
});
