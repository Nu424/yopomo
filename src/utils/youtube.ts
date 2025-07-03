import { useState, useEffect } from 'react';

/**
 * YouTube動画URLからvideo IDを抽出する
 */
export const extractYouTubeVideoId = (url: string): string | null => {
  const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  return match ? match[1] : null;
};

/**
 * YouTube Embed URLを生成する
 */
export const generateYouTubeEmbedUrl = (videoId: string, options?: {
  autoplay?: boolean;
  loop?: boolean;
  controls?: boolean;
  mute?: boolean;
  enablejsapi?: boolean;
  startSeconds?: number;
}): string => {
  const params = new URLSearchParams();
  
  if (options?.autoplay) params.set('autoplay', '1');
  if (options?.loop) {
    params.set('loop', '1');
    params.set('playlist', videoId);
  }
  if (options?.controls === false) params.set('controls', '0');
  if (options?.mute) params.set('mute', '1');
  if (options?.enablejsapi) params.set('enablejsapi', '1');
  if (options?.startSeconds) params.set('start', options.startSeconds.toString());
  
  // Additional parameters for better embed experience
  params.set('modestbranding', '1');
  params.set('iv_load_policy', '3');
  params.set('rel', '0');
  params.set('disablekb', '1');
  params.set('fs', '0');
  
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

/**
 * YouTube URL処理用のReactフック（既存のuseYouTubeEmbedと互換性を保つ）
 */
export const useYouTubeEmbed = (url: string) => {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    setError(false);
    const extractedVideoId = extractYouTubeVideoId(url);
    setVideoId(extractedVideoId);
  }, [url]);

  const src = videoId
    ? generateYouTubeEmbedUrl(videoId, { enablejsapi: true, loop: true })
    : '';

  return { videoId, src, error };
}; 