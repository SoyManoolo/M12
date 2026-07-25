const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

function constraintsFor(userAgent: string): MediaStreamConstraints {
  const mobile = mobileUserAgent.test(userAgent);
  return {
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: mobile ? { ideal: 24, min: 15 } : { ideal: 30, max: 30 },
    },
    audio: true,
  };
}

function createPlaceholderVideoTrack(): MediaStreamTrack | undefined {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const context = canvas.getContext('2d');
  if (context) {
    const draw = () => {
      context.fillStyle = '#000000';
      context.fillRect(0, 0, canvas.width, canvas.height);
      requestAnimationFrame(draw);
    };
    draw();
  }
  return canvas.captureStream(15).getVideoTracks()[0];
}

/** Obtiene cámara/micrófono y mantiene una pista de vídeo para la negociación. */
export async function acquireLocalMedia(): Promise<MediaStream> {
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraintsFor(navigator.userAgent));
  } catch (videoError) {
    console.warn('WebRTC: no se pudo obtener vídeo; se intentará solo audio.', videoError);
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (audioError) {
      console.error('WebRTC: no se pudo obtener ningún medio.', audioError);
      throw new Error('No se encontró ningún dispositivo de entrada. Comprueba permisos y micrófono.');
    }
  }

  if (stream.getVideoTracks().length === 0) {
    const placeholderTrack = createPlaceholderVideoTrack();
    if (placeholderTrack) stream.addTrack(placeholderTrack);
  }
  return stream;
}

export function enableTracks(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => {
    track.enabled = true;
  });
}
