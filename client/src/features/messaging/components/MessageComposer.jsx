import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Spinner } from '../../../shared/components/index.js';

export function MessageComposer({ content, sendError, sending, onChange, onSend }) {
  const composerRef = useRef(null);
  const [isMultiline, setIsMultiline] = useState(false);

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;
    composer.style.height = 'auto';
    const styles = window.getComputedStyle(composer);
    const lineHeight = Number.parseFloat(styles.lineHeight) || 22.4;
    const verticalPadding = Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom);
    const verticalBorders = Number.parseFloat(styles.borderTopWidth) + Number.parseFloat(styles.borderBottomWidth);
    const maxHeight = lineHeight * 8 + verticalPadding + verticalBorders;
    composer.style.height = `${Math.min(composer.scrollHeight, maxHeight)}px`;
    composer.style.overflowY = composer.scrollHeight > maxHeight ? 'auto' : 'hidden';
    setIsMultiline(composer.scrollHeight > lineHeight * 2 + verticalPadding + verticalBorders);
  }, [content]);

  function handleKeyDown(event) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    onSend(event);
  }

  return (
    <>
      {sendError && <Alert tone="danger">{sendError}</Alert>}
      <form className="border-t border-slate-200 pt-3" onSubmit={onSend}>
        <div className={`relative flex min-h-12 items-stretch border border-slate-300 bg-white focus-within:border-blue-600 ${isMultiline ? 'rounded-2xl' : 'rounded-full'}`}>
        <textarea
          ref={composerRef}
          className={`min-h-12 max-h-48 min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent py-3 pl-4 pr-2 text-slate-800 placeholder:text-slate-400 focus:!outline-none focus:!ring-0 focus:!shadow-none focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!shadow-none ${content.trim() ? 'mr-12' : ''} ${isMultiline ? 'rounded-l-2xl' : 'rounded-l-full'}`}
          rows={1}
          aria-label="Write a message"
          maxLength={5000}
          placeholder="Type a message…"
          value={content}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        {content.trim() && <Button type="submit" aria-label="Send message" disabled={sending} style={{ width: 36, height: 36, minWidth: 36, minHeight: 36, padding: 0, borderRadius: '50%', aspectRatio: '1 / 1' }} className={`!absolute !right-1.5 !box-border !shrink-0 !border-0 !leading-none ${isMultiline ? '!bottom-1.5' : '!top-1/2 !-translate-y-1/2'}`}>
          {sending ? <Spinner /> : <img src="/send-hor-svgrepo-com.svg" alt="" aria-hidden="true" className="block h-5 w-5 shrink-0" />}
        </Button>}
        </div>
      </form>
    </>
  );
}
