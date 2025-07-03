// Picture-in-Picture API type definitions
declare global {
  interface DocumentPictureInPictureOptions {
    width?: number;
    height?: number;
    disallowReturnToOpener?: boolean;
    preferInitialWindowPlacement?: boolean;
  }
  
  interface DocumentPictureInPicture {
    requestWindow: (options?: DocumentPictureInPictureOptions) => Promise<Window>;
  }

  // eslint-disable-next-line no-var
  var documentPictureInPicture: DocumentPictureInPicture;
}

export {}; 