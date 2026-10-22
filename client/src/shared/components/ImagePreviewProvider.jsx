import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePreviewContext } from './ImagePreviewContext.js';

export function ImagePreviewProvider({ children }) {
  const [preview, setPreview] = useState(null);
  const closeButtonRef = useRef(null);

  const openImage = useCallback((src, alt, trigger) => {
    setPreview({ src, alt, trigger });
  }, []);

  const closeImage = useCallback(() => setPreview(null), []);

  useEffect(() => {
    if (!preview) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') closeImage();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      preview.trigger?.focus?.({ preventScroll: true });
    };
  }, [preview, closeImage]);

  return (
    <ImagePreviewContext.Provider value={openImage}>
      {children}
      {preview && (
        <div
          className="fixed inset-0 z-[2000] grid place-items-center bg-slate-950/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={preview.alt || 'Image preview'}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeImage();
          }}
        >
          <button
            ref={closeButtonRef}
            type="button"
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-white/10 text-3xl leading-none text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            onClick={closeImage}
            aria-label="Close image preview"
          >
            <img src="/xmark-solid-full.svg" alt="" aria-hidden="true" className="h-5 w-5 brightness-0 invert" />
          </button>
          <img
            className="max-h-[calc(100vh-2rem)] max-w-full select-none object-contain"
            src={preview.src}
            alt={preview.alt}
            draggable="false"
          />
        </div>
      )}
    </ImagePreviewContext.Provider>
  );
}
