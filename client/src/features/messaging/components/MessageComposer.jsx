import { useEffect, useRef } from 'react';
import { Alert, Button, Spinner } from '../../../shared/components/index.js';

export function MessageComposer({ content, sendError, sending, onChange, onSend }) {
  const composerRef = useRef(null);

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
  }, [content]);

  function handleKeyDown(event) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    onSend(event);
  }

  return (
    <>
      {sendError && <Alert tone="danger">{sendError}</Alert>}
      <form className="flex items-end gap-2 border-t border-slate-200 pt-3" onSubmit={onSend}>
        <textarea
          ref={composerRef}
          className="min-h-12 max-h-48 min-w-0 flex-1 resize-none overflow-y-auto rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          rows={1}
          aria-label="Write a message"
          maxLength={5000}
          placeholder="Type a message…"
          value={content}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button type="submit" aria-label="Send message" disabled={sending || !content.trim()}>
          {sending ? <Spinner /> : '➤'}
        </Button>
      </form>
    </>
  );
}
