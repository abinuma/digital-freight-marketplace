import { Link } from 'react-router-dom';

export function AuthPageLayout({ title, subtitle, children, footer, icon }) {
  return (
    <main className="auth-screen">
      <Link className="auth-wordmark" to="/" aria-label="EthioFreight home">Ethio<span>Freight</span></Link>
      <section className="auth-panel" aria-labelledby="auth-page-title">
        {icon && <div className="auth-page-icon" aria-hidden="true">{icon}</div>}
        <header className="auth-panel__heading">
          <h1 id="auth-page-title">{title}</h1>
          <p>{subtitle}</p>
        </header>
        {children}
        {footer && <footer className="auth-panel__footer">{footer}</footer>}
      </section>
      <p className="auth-screen__caption">Connecting Ethiopia through efficient, transparent freight solutions.</p>
    </main>
  );
}
