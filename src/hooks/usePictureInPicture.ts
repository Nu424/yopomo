import { useState, useCallback, useEffect } from 'react';

interface PictureInPictureOptions {
  width?: number;
  height?: number;
}

interface PictureInPictureState {
  isSupported: boolean;
  isOpen: boolean;
  error: string | null;
  pipWindow: Window | null;
  openPiP: (options?: PictureInPictureOptions) => Promise<void>;
  closePiP: () => void;
}

// CSS styles for PiP window
const injectPiPStyles = (doc: Document) => {
  const styleElement = doc.createElement('style');
  styleElement.textContent = `
    body {
      margin: 0;
      padding: 16px;
      background: #111827;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      overflow: hidden;
    }
    
    .pip-container {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: calc(100vh - 32px);
      background: rgba(31, 41, 55, 0.8);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 16px;
      overflow: hidden;
    }
    
    .pip-youtube-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }
    
    .pip-youtube-iframe {
      width: 120%;
      height: 120%;
      margin: -10%;
      border: none;
      pointer-events: none;
    }
    
    .pip-youtube-iframe > div {
      width: 100% !important;
      height: 100% !important;
    }
    
    .pip-youtube-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(2px);
    }
    
    .pip-timer-content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    
    .pip-timer-circle {
      color: currentColor;
    }

    .pip-timer-text {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .pip-mode-text {
      font-size: 14px;
      opacity: 0.8;
      text-align: center;
      margin-bottom: 16px;
    }

    .text-red-500 { color: #ef4444; }
    .text-green-500 { color: #10b981; }
    .text-gray-400 { color: #9ca3af; }
    
    .relative { position: relative; }
    .inline-flex { display: inline-flex; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .mb-2 { margin-bottom: 0.5rem; }
    .absolute { position: absolute; }
    .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
    .font-bold { font-weight: 700; }
    .transform { transform: translateX(var(--tw-translate-x)) translateY(var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y)); }
    .-rotate-90 { --tw-rotate: -90deg; }
    .transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
    .duration-1000 { transition-duration: 1000ms; }
  `;
  doc.head.appendChild(styleElement);
};

export const usePictureInPicture = (): PictureInPictureState => {
  const [pipWindow, setPiPWindow] = useState<Window | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if Document Picture-in-Picture is supported
  const isSupported = typeof documentPictureInPicture !== 'undefined';
  const isOpen = pipWindow !== null;

  const openPiP = useCallback(async (options: PictureInPictureOptions = {}) => {
    if (!isSupported) {
      setError('Picture-in-Picture is not supported in this browser');
      return;
    }

    if (isOpen) {
      setError('Picture-in-Picture window is already open');
      return;
    }

    try {
      setError(null);

      // Request PiP window with default options
      const newWindow = await documentPictureInPicture.requestWindow({
        width: options.width || 280,
        height: options.height || 200,
        disallowReturnToOpener: false,
        preferInitialWindowPlacement: false,
      });

      setPiPWindow(newWindow);

      // Inject styles into PiP window
      injectPiPStyles(newWindow.document);

      // Handle window close
      newWindow.addEventListener('pagehide', () => {
        setPiPWindow(null);
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open Picture-in-Picture window');
    }
  }, [isSupported, isOpen]);

  const closePiP = useCallback(() => {
    if (pipWindow) {
      pipWindow.close();
      setPiPWindow(null);
    }
  }, [pipWindow]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pipWindow) {
        pipWindow.close();
      }
    };
  }, [pipWindow]);

  return {
    isSupported,
    isOpen,
    error,
    pipWindow,
    openPiP,
    closePiP,
  };
}; 