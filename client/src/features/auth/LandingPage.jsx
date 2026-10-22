import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const steps = [
  {
    title: 'Describe the load',
    description: 'Provide pickup and delivery points, cargo type, and weight.',
  },
  {
    title: 'Review offers',
    description: 'Compare prices, terms and carrier ratings, then choose the best fit.',
  },
  {
    title: 'Track progress',
    description: 'Follow milestones and location updates, with notifications on key changes.',
  },
  {
    title: 'Confirm and pay',
    description: 'Receive proof of delivery, settle the invoice and rate the shipment.',
  },
];

const features = [
  { icon: '/handshake-regular-full.svg', title: 'Offers made simple', description: 'Carriers submit and update offers. Shippers see price and terms in one comparison view.' },
  { icon: '/bell-solid-full.svg', title: 'Shipment Updates', description: 'Stay informed with notifications about shipment progress, status changes, and important delivery milestones.' },
  { icon: '/message-regular-full (1).svg', title: 'Built-in messaging', description: 'Agree on arrangements right beside the shipment details, with no lost email threads.' },
  { icon: '/package-check-svgrepo-com.svg', title: 'Shipment Management', description: 'Manage your shipments from publication to completion, with key details and status updates in one place.' },
  { icon: '/star-solid-full.svg', title: 'Ratings and reviews', description: 'Rate completed shipments so good carriers and reliable shippers stand out.' },
  { icon: '/headset-solid-full.svg', title: 'Help when you need it', description: 'Reach support from any shipment or invoice, on desktop or mobile.' },
];

function CheckMark() {
  return <span aria-hidden="true" className="text-cyan-400">✓</span>;
}

function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const updateScrollState = () => setIsScrolled(window.scrollY > 12);
    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollState);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-[#0b2034] text-white">
        <header className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${isScrolled ? 'shadow-md' : 'shadow-none'}`}>
          <div className={`relative mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 max-md:px-5 ${isScrolled ? 'py-2.5' : 'py-4'} transition-[padding] duration-300`}>
          <Link to="/" className="inline-flex items-center gap-1.5 text-lg font-extrabold tracking-tight text-slate-900 no-underline">
            <img src="/logoFETAN.svg" alt="" aria-hidden="true" className="h-9 w-9 rounded-lg object-contain" />
            FETAN
          </Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-7 text-xs font-medium text-slate-600 lg:flex">
            <a className="text-inherit no-underline hover:text-blue-700" href="#how-it-works">How it works</a>
            <a className="text-inherit no-underline hover:text-blue-700" href="#features">Features</a>
            <a className="text-inherit no-underline hover:text-blue-700" href="#shippers-carriers">Shippers &amp; carriers</a>
            <a className="text-inherit no-underline hover:text-blue-700" href="#support">Support</a>
          </nav>
          <div className="hidden items-center gap-3 text-xs font-semibold lg:flex">
            <Link to="/login" className="text-slate-700 no-underline hover:text-blue-700">Log in</Link>
            <Link to="/register" className="rounded-lg bg-blue-600 px-4 py-2.5 text-white no-underline transition hover:bg-blue-500">Create account</Link>
          </div>
          <button
            type="button"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
            aria-controls="landing-mobile-navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 lg:hidden"
          >
            {isMenuOpen ? (
              <img src="/xmark-solid-full.svg" alt="" aria-hidden="true" className="h-5 w-5" />
            ) : (
              <img src="/menu.svg" alt="" aria-hidden="true" className="h-6 w-6 object-contain" />
            )}
          </button>
          </div>
          {isMenuOpen && (
            <div id="landing-mobile-navigation" className="absolute right-0 top-full z-50 w-[min(22rem,82vw)] border-t border-slate-100 bg-white px-5 py-4 shadow-lg lg:hidden">
              <nav aria-label="Main navigation" className="grid gap-1 text-sm font-medium text-slate-700">
                <a onClick={() => setIsMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-inherit no-underline hover:bg-slate-50 hover:text-blue-700" href="#how-it-works">How it works</a>
                <a onClick={() => setIsMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-inherit no-underline hover:bg-slate-50 hover:text-blue-700" href="#features">Features</a>
                <a onClick={() => setIsMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-inherit no-underline hover:bg-slate-50 hover:text-blue-700" href="#shippers-carriers">Shippers &amp; carriers</a>
                <a onClick={() => setIsMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-inherit no-underline hover:bg-slate-50 hover:text-blue-700" href="#support">Support</a>
              </nav>
              <div className="mt-3 flex gap-3 border-t border-slate-100 pt-3 text-sm font-semibold">
                <Link onClick={() => setIsMenuOpen(false)} to="/login" className="rounded-lg px-3 py-2.5 text-slate-700 no-underline hover:bg-slate-50">Log in</Link>
                <Link onClick={() => setIsMenuOpen(false)} to="/register" className="rounded-lg bg-blue-600 px-4 py-2.5 text-white no-underline hover:bg-blue-500">Create account</Link>
              </div>
            </div>
          )}
        </header>

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-12 md:grid-cols-2 md:gap-10 md:pb-20 md:pt-16 max-md:px-5 max-sm:pt-10">
          <div>
            <p className="mb-3 text-[11px] font-extrabold tracking-[0.18em] text-blue-400">DIGITAL FREIGHT MARKETPLACE</p>
            <h1 className="m-0 max-w-xl text-5xl font-extrabold leading-[1.03] tracking-[-0.045em] text-white max-lg:text-4xl max-sm:text-4xl">
              Move any load with the right carrier at a price you can <span className="text-blue-400">compare.</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-slate-300">
              Post a shipment, compare carrier offers side by side, and coordinate through built-in messaging. Carriers can find loads that fit their routes and capacity.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/register" className="inline-flex min-h-10 items-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white no-underline transition hover:bg-blue-500">Post a shipment</Link>
              <Link to="/register" className="inline-flex min-h-10 items-center rounded-lg border border-slate-500 px-4 py-2 text-xs font-bold text-white no-underline transition hover:border-blue-400 hover:bg-blue-400/10">Find loads as a carrier</Link>
            </div>
          </div>

          <article className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl shadow-black/20 max-sm:p-4">
            <div className="flex items-start justify-between gap-4 max-sm:flex-col">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">ACTIVE</span>
                  <span className="text-slate-500">Departure: <strong className="font-semibold text-slate-600">Dec 21, 2026, 3:00 AM</strong></span>
                </div>
                <h2 className="mb-0 mt-2 text-xl font-bold text-slate-900 max-sm:text-lg">
                  Moyale <img src="/arrow-right-long-solid-full.svg" alt="to" aria-hidden="true" className="mx-1 inline h-4 w-5 align-middle" /> Addis Ababa
                </h2>
              </div>
              <div className="text-right max-sm:text-left">
                <span className="text-xs uppercase tracking-wide text-slate-500">Full load price</span>
                <p className="m-0 text-xl font-bold text-slate-900">ETB 100,000.00</p>
              </div>
            </div>

            <div className="mt-3 flex justify-end max-sm:justify-start">
              <span className="inline-flex min-h-10 items-center rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white">Review</span>
            </div>

            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="grid gap-1.5">
                <div className="flex justify-between text-sm font-semibold text-slate-700">
                  <span>Load Capacity</span>
                  <span>2,800 kg</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full w-3/4 rounded-full bg-blue-600" />
                </div>
                <span className="text-sm text-slate-500">25% capacity remaining</span>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="mb-2 mt-0 text-sm font-semibold uppercase tracking-wider text-slate-700">Assigned Loads (2)</h3>
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm">
                  <div className="min-w-0">
                    <strong className="text-slate-900">Assigned shipment</strong>
                    <div className="text-xs text-slate-500">Arbaminch <img src="/arrow-right-long-solid-full.svg" alt="to" aria-hidden="true" className="mx-1 inline h-3 w-4 align-middle" /> Hawassa</div>
                  </div>
                  <span className="text-xs font-semibold text-blue-900">Half load</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm">
                  <div className="min-w-0">
                    <strong className="text-slate-900">Assigned shipment</strong>
                    <div className="text-xs text-slate-500">Hawassa <img src="/arrow-right-long-solid-full.svg" alt="to" aria-hidden="true" className="mx-1 inline h-3 w-4 align-middle" /> Addis Ababa</div>
                  </div>
                  <span className="text-xs font-semibold text-blue-900">Quarter load</span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section id="how-it-works" className="bg-slate-100 px-6 py-16 max-md:px-5">
        <div className="mx-auto max-w-6xl">
          <h2 className="m-0 max-w-lg text-3xl font-extrabold leading-tight tracking-tight text-[#0b2034] max-sm:text-2xl">From request to delivery in four clear steps</h2>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <article key={step.title} className="min-h-40 rounded-xl border border-slate-200 bg-white p-5">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#0b2034] text-[10px] font-bold text-white">{index + 1}</span>
                <h3 className="mb-1 mt-3 text-sm font-bold text-[#0b2034]">{step.title}</h3>
                <p className="m-0 text-xs leading-[1.55] text-slate-500">{step.description}</p>
              </article>
            ))}
          </div>

          <h2 id="features" className="mb-0 mt-14 max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-[#0b2034] max-sm:mt-12 max-sm:text-2xl">Everything a shipment needs, in one place</h2>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="min-h-32 rounded-xl border border-slate-200 bg-white p-5">
                <img src={feature.icon} alt="" aria-hidden="true" className="h-6 w-6 object-contain" />
                <h3 className="mb-1 mt-2 text-sm font-bold text-[#0b2034]">{feature.title}</h3>
                <p className="m-0 text-xs leading-[1.55] text-slate-500">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="shippers-carriers" className="bg-white px-6 py-16 max-md:px-5">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
          <article className="rounded-2xl bg-[#0b2034] p-7 text-white">
            <p className="m-0 text-[10px] font-extrabold tracking-[0.16em] text-blue-400">FOR SHIPPERS</p>
            <h2 className="mb-0 mt-2 text-xl font-extrabold leading-tight">Publish once, choose with confidence</h2>
            <p className="mb-0 mt-3 text-xs leading-[1.6] text-slate-300">Publish, edit or cancel a freight request, review every offer, and select a carrier. Manage bookings without leaving the page.</p>
            <Link to="/register" className="mt-5 inline-flex min-h-9 items-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white no-underline hover:bg-blue-500">Post a shipment</Link>
          </article>
          <article className="rounded-2xl bg-teal-50 p-7">
            <p className="m-0 text-[10px] font-extrabold tracking-[0.16em] text-teal-700">FOR CARRIERS</p>
            <h2 className="mb-0 mt-2 text-xl font-extrabold leading-tight text-[#0b2034]">Fill your capacity on the routes you run</h2>
            <p className="mb-0 mt-3 text-xs leading-[1.6] text-slate-600">List your vehicles and services, find matching freight, submit offers, and keep shippers informed with shipment milestone updates.</p>
            <Link to="/register" className="mt-5 inline-flex min-h-9 items-center rounded-lg bg-[#0b2034] px-4 py-2 text-xs font-bold text-white no-underline hover:bg-slate-800">Register as a carrier</Link>
          </article>
        </div>
      </section>

      <section className="bg-[#0b2034] px-6 py-16 text-center text-white max-md:px-5">
        <h2 className="m-0 text-3xl font-extrabold tracking-tight max-sm:text-2xl">Ready to move your next load?</h2>
        <p className="mx-auto mb-0 mt-3 max-w-md text-xs leading-5 text-slate-300">Create your business account in minutes and manage every shipment securely.</p>
        <Link to="/register" className="mt-5 inline-flex min-h-9 items-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white no-underline transition hover:bg-blue-500">Create account</Link>
      </section>

      <footer id="support" className="bg-[#071727] px-6 py-8 text-slate-300 max-md:px-5">
        <div className="mx-auto grid max-w-6xl gap-7 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="text-sm font-extrabold text-white no-underline">FETAN</Link>
            <p className="mb-0 mt-2 text-[10px]">Connecting shippers and carriers.</p>
          </div>
          <div className="grid content-start gap-2 text-[10px]">
            <Link to="/register" className="text-inherit no-underline hover:text-white">Post a shipment</Link>
            <Link to="/register" className="text-inherit no-underline hover:text-white">Find loads</Link>
          </div>
          <div className="grid content-start gap-2 text-[10px]">
            <a href="#support" className="text-inherit no-underline hover:text-white">Help center</a>
            <a href="#support" className="text-inherit no-underline hover:text-white">Contact support</a>
          </div>
          <div className="grid content-start gap-2 text-[10px]">
            <a href="#support" className="text-inherit no-underline hover:text-white">Terms</a>
            <a href="#support" className="text-inherit no-underline hover:text-white">Privacy</a>
          </div>
        </div>
        <p className="mx-auto mb-0 mt-7 max-w-6xl text-[10px]">© FETAN. All rights reserved.</p>
      </footer>
    </main>
  );
}

export default LandingPage;
