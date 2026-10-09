export function Pagination({ page, pageCount, onPageChange, className = '' }) {
  if (pageCount <= 1) return null;
  const safePage = Math.min(Math.max(page, 1), pageCount);
  return (
    <nav className={`ui-pagination ${className}`.trim()} aria-label="Pagination">
      <button type="button" className="ui-button ui-button--secondary ui-button--sm" onClick={() => onPageChange(safePage - 1)} disabled={safePage === 1}>Previous</button>
      <span className="ui-pagination__label">Page {safePage} of {pageCount}</span>
      <button type="button" className="ui-button ui-button--secondary ui-button--sm" onClick={() => onPageChange(safePage + 1)} disabled={safePage === pageCount}>Next</button>
    </nav>
  );
}
