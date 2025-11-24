import { forwardRef } from 'react';
import YouTubeEmbed, { type YouTubeEmbedRef } from './YouTubeEmbed';

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

const YouTubeBackground = forwardRef<YouTubePlayerRef, YouTubeBackgroundProps>(
  ({ videoId, playing, startTime = 0, onReady }, ref) => {
    // Convert videoId to URL for YouTubeEmbed
    const url = videoId ? `https://www.youtube.com/watch?v=${videoId}` : '';

    return (
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
        {/* <div className="glass absolute inset-0 z-10"></div> */}
        <YouTubeEmbed
          ref={ref as React.RefObject<YouTubeEmbedRef>}
          url={url}
          playing={playing}
          startTime={startTime}
          onReady={onReady}
          className="w-full h-full"
        />
      </div>
    );
  }
);

YouTubeBackground.displayName = 'YouTubeBackground';

export default YouTubeBackground; 