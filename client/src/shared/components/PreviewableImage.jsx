import { useContext } from 'react';
import { ImagePreviewContext } from './ImagePreviewContext.js';

export function PreviewableImage({
  src,
  alt = '',
  className = '',
  nestedInteractive = false,
  ...imageProps
}) {
  const openImage = useContext(ImagePreviewContext);
  const isPreviewable = Boolean(openImage && src);

  function showPreview(event) {
    if (!isPreviewable) return;
    if (nestedInteractive) event.stopPropagation();
    const trigger = nestedInteractive
      ? event.currentTarget.closest('button, a, [tabindex]') || event.currentTarget
      : event.currentTarget;
    openImage(src, alt, trigger);
  }

  function handleKeyDown(event) {
    if (!isPreviewable || nestedInteractive) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      showPreview(event);
    }
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className}${isPreviewable ? ' cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2' : ''}`}
      onClick={isPreviewable ? showPreview : undefined}
      onKeyDown={isPreviewable ? handleKeyDown : undefined}
      role={isPreviewable && !nestedInteractive ? 'button' : undefined}
      tabIndex={isPreviewable && !nestedInteractive ? 0 : undefined}
      aria-label={isPreviewable && !nestedInteractive ? `Open ${alt || 'image'} in full screen` : undefined}
      {...imageProps}
    />
  );
}
