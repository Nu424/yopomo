import React, { useRef, useEffect } from 'react';

declare global {
  interface Window {
    YT: {
      Player: any;
      ready: (callback: () => void) => void;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubeBackgroundProps {
  videoId: string | null;
  playing: boolean;
  onReady?: () => void;
}

const YouTubeBackground: React.FC<YouTubeBackgroundProps> = ({ videoId, playing, onReady }) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const apiLoaded = useRef<boolean>(false);

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
          playerRef.current.loadVideoById(videoId);
          if (!playing) {
            playerRef.current.pauseVideo();
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
            playlist: videoId,
            modestbranding: 1,
            iv_load_policy: 3
          },
          events: {
            onReady: () => {
              if (onReady) onReady();
              if (playing) {
                playerRef.current.playVideo();
              } else {
                playerRef.current.pauseVideo();
              }
            }
          }
        });
      }
    }

    return () => {
      // Cleanup when unmounting
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, onReady]);

  // Control video playback based on playing prop
  useEffect(() => {
    if (!playerRef.current) return;
    
    if (playing) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [playing]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
      <div className="glass absolute inset-0 z-10"></div>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default YouTubeBackground; 