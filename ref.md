# 参考

## usePinP()の実装
```ts
const usePiP = ({
  width = 300,
  height = 300,
}) => {
  const [pipWindow, setPiPWindow] = useState<Window | null>(null);
  const isSupported = 'documentPictureInPicture' in window;
  const openPiP = async () => {
    const pw = await window.documentPictureInPicture?.requestWindow({
      width: width,
      height: height,
      disallowReturnToOpener: false,
      preferInitialWindowPlacement: false,
    });
    if (!pw) return;
    setPiPWindow(pw);
    // ユーザーが PiP ウィンドウを閉じたときにstateを更新する
    pw.addEventListener('pagehide', () => {
      setPiPWindow(null);
    });

    // 親ページのスタイルをコピーする
    Array.from(document.styleSheets).forEach((styleSheet) => {
      try {
        const cssRules = Array.from(styleSheet.cssRules)
          .map((rule) => rule.cssText)
          .join('');
        const style = document.createElement('style');

        style.textContent = cssRules;
        pw?.document.head.appendChild(style);
      } catch (_) {
        const link = document.createElement('link');
        if (styleSheet.href == null) {
          return;
        }

        link.rel = 'stylesheet';
        link.type = styleSheet.type;
        link.media = styleSheet.media.toString();
        link.href = styleSheet.href;
        pw.document.head.appendChild(link);
      }
    });
  }
  const closePiP = () => {
    pipWindow?.close();
    setPiPWindow(null);
  }

  return { pipWindow, openPiP, closePiP, isSupported };
}

```
