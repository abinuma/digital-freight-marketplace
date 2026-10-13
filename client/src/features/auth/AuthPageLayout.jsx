import { Link } from "react-router-dom";

export function AuthPageLayout({ title, subtitle, children, footer, icon }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <Link
        className="mb-7 inline-flex items-center gap-3 font-display text-2xl font-extrabold tracking-tight text-slate-900 no-underline transition-colors hover:text-blue-700"
        to="/"
        aria-label="EthioFreight home"
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-700 font-sans text-lg text-white">
          E
        </span>
        <span>EthioFreight</span>
      </Link>
      <section
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg max-sm:p-6"
        aria-labelledby="auth-page-title"
      >
        {icon && (
          <div
            className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-2xl text-blue-700"
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
        <header className="mb-6 text-center">
          <h1
            className="m-0 text-2xl font-bold tracking-tight text-slate-900"
            id="auth-page-title"
          >
            {title}
          </h1>
          <p className="mb-0 mt-2 text-sm text-slate-500">{subtitle}</p>
        </header>
        {children}
        {footer && (
          <footer className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
            {footer}
          </footer>
        )}
      </section>
      <p className="mb-0 mt-6 max-w-sm text-center text-sm text-slate-500">
        Connecting Ethiopia through efficient, transparent freight solutions.
      </p>
    </main>
  );
}
