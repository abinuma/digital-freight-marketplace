export function Pagination({ page, pageCount, onPageChange, className = '' }) {
  if (pageCount <= 1) return null;
  const safePage = Math.min(Math.max(page, 1), pageCount);
  return (
    <nav className={`ui-pagination flex items-center justify-center gap-3 max-sm:gap-2 ${className}`.trim()} aria-label="Pagination">
      <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => onPageChange(safePage - 1)} disabled={safePage === 1} aria-label="Previous page">
        <img src="/angle-left-solid-full.svg" alt="" aria-hidden="true" className="h-4 w-4" />
      </button>
      <span className={`text-slate-500 text-base max-md:text-sm ui-pagination__label`}>Page {safePage} of {pageCount}</span>
      <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => onPageChange(safePage + 1)} disabled={safePage === pageCount} aria-label="Next page">
        <img src="/angle-right-solid-full.svg" alt="" aria-hidden="true" className="h-4 w-4" />
      </button>
    </nav>
  );
}
