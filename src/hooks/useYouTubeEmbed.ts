import { useState, useEffect } from 'react';

export const useYouTubeEmbed = (url: string) => {
  const [videoId, setVideoId] = useState<string| null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    setError(false);
    const m = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    if (m) setVideoId(m[1]);
    else setVideoId(null);
  }, [url]);

  const src = videoId
    ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1&loop=1&playlist=${videoId}`
    : '';

  return { videoId, src, error };
}; 