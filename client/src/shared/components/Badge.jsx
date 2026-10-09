const tones = new Set(['neutral', 'brand', 'success', 'warning', 'danger']);

export function Badge({ tone = 'neutral', className = '', ...props }) {
  const safeTone = tones.has(tone) ? tone : 'neutral';
  return <span className={`ui-badge ui-badge--${safeTone} ${className}`.trim()} {...props} />;
}
