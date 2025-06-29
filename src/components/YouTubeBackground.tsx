import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

interface YTPlayer {
  loadVideoById: (options: { videoId: string; startSeconds?: number } | string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  destroy: () => void;
}

interface YTPlayerEvent {
  data: number;
}

declare global {
  interface Window {
    YT: {
      Player: new (element: HTMLElement, options: {
        videoId: string;
        playerVars: Record<string, number | string>;
        events: {
          onReady?: () => void;
          onStateChange?: (event: YTPlayerEvent) => void;
        };
      }) => YTPlayer;
      ready: (callback: () => void) => void;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface YouTubePlayerRef {
  getCurrentTime: () => number;
  seekTo: (seconds: number) => void;
}

interface YouTubeBackgroundProps {
  videoId: string | null;
  playing: boolean;
  startTime?: number;
  onReady?: () => void;
}

const YouTubeBackground = forwardRef<YouTubePlayerRef, YouTubeBackgroundProps>(({ videoId, playing, startTime = 0, onReady }, ref) => {
  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const apiLoaded = useRef<boolean>(false);

  // Expose player methods to parent component
  useImperativeHandle(ref, () => ({
    getCurrentTime: () => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        return playerRef.current.getCurrentTime();
      }
      return 0;
    },
    seekTo: (seconds: number) => {
      if (playerRef.current && playerRef.current.seekTo) {
        playerRef.current.seekTo(seconds, true);
      }
    }
  }));

  useEffect(() => {
    // Load the YouTube API script if not already loaded
    if (!apiLoaded.current) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = () => {
        apiLoaded.current = true;
        if (videoId) {
          initPlayer();
        }
      };
    } else if (videoId) {
      initPlayer();
    }

    function initPlayer() {
      if (!containerRef.current) return;
      
      if (playerRef.current) {
        // Player exists, load new video
        if (videoId) {
          playerRef.current.loadVideoById?.({
            videoId: videoId,
            startSeconds: startTime
          });
          if (!playing) {
            playerRef.current.pauseVideo?.();
          }
        }
      } else {
        // Create new player
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: videoId || '',
          playerVars: {
            autoplay: playing ? 1 : 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            loop: 1,
            playlist: videoId || '',
            modestbranding: 1,
            iv_load_policy: 3,
            start: startTime
          },
          events: {
            onReady: () => {
              if (onReady) onReady();
              if (startTime > 0 && playerRef.current) {
                playerRef.current.seekTo?.(startTime, true);
              }
              if (playing && playerRef.current) {
                playerRef.current.playVideo?.();
              } else if (playerRef.current) {
                playerRef.current.pauseVideo?.();
              }
            },
            onStateChange: (event: YTPlayerEvent) => {
              // Handle video end (state 0) to ensure looping
              if (event.data === 0) {
                playerRef.current?.seekTo?.(0, true);
                if (playing) {
                  playerRef.current?.playVideo?.();
                }
              }
            }
          }
        });
      }
    }

    return () => {
      // Cleanup when unmounting
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy?.();
        playerRef.current = null;
      }
    };
  }, [videoId, onReady, startTime, playing]);

  // Control video playback based on playing prop
  useEffect(() => {
    if (!playerRef.current) return;
    
    if (playing) {
      playerRef.current.playVideo?.();
    } else {
      playerRef.current.pauseVideo?.();
    }
  }, [playing]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
      <div className="glass absolute inset-0 z-10"></div>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
});

YouTubeBackground.displayName = 'YouTubeBackground';

export default YouTubeBackground; 