import { Link } from 'react-router-dom';

const steps = [
  {
    title: 'Describe the load',
    description: 'Pickup and delivery points, cargo type, weight, dimensions and vehicle needs.',
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
  { icon: '◇', title: 'Offers made simple', description: 'Carriers submit and update offers. Shippers see price and terms in one comparison view.' },
  { icon: '⌖', title: 'Live shipment status', description: 'Milestones from pickup to delivery, location updates and instant notifications.' },
  { icon: '▱', title: 'Built-in messaging', description: 'Agree on arrangements right beside the shipment details, with no lost email threads.' },
  { icon: '▤', title: 'Payments and invoices', description: 'Bookings, payments, invoices and full transaction history in a single record.' },
  { icon: '☆', title: 'Ratings and reviews', description: 'Rate completed shipments so good carriers and reliable shippers stand out.' },
  { icon: '◎', title: 'Help when you need it', description: 'Reach support from any shipment or invoice, on desktop or mobile.' },
];

function CheckMark() {
  return <span aria-hidden="true" className="text-cyan-400">✓</span>;
}

function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-[#0b2034] text-white">
        <header className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4 max-md:flex-wrap max-md:px-5">
          <Link to="/" className="inline-flex items-center gap-1.5 text-lg font-extrabold tracking-tight text-white no-underline">
            <img src="/logoFETAN.svg" alt="" aria-hidden="true" className="h-5 w-5 object-contain" />
            FETAN
          </Link>
          <nav aria-label="Main navigation" className="flex items-center gap-7 text-xs font-medium text-slate-300 max-md:order-3 max-md:w-full max-md:justify-center max-sm:flex-wrap max-sm:gap-x-5 max-sm:gap-y-2">
            <a className="text-inherit no-underline hover:text-white" href="#how-it-works">How it works</a>
            <a className="text-inherit no-underline hover:text-white" href="#features">Features</a>
            <a className="text-inherit no-underline hover:text-white" href="#shippers-carriers">Shippers &amp; carriers</a>
            <a className="text-inherit no-underline hover:text-white" href="#support">Support</a>
          </nav>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <Link to="/login" className="text-slate-200 no-underline hover:text-white">Log in</Link>
            <Link to="/register" className="rounded-lg bg-blue-600 px-4 py-2.5 text-white no-underline transition hover:bg-blue-500">Create account</Link>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-12 md:grid-cols-2 md:gap-10 md:pb-20 md:pt-16 max-md:px-5 max-sm:pt-10">
          <div>
            <p className="mb-3 text-[11px] font-extrabold tracking-[0.18em] text-blue-400">DIGITAL FREIGHT MARKETPLACE</p>
            <h1 className="m-0 max-w-xl text-5xl font-extrabold leading-[1.03] tracking-[-0.045em] text-white max-lg:text-4xl max-sm:text-4xl">
              Move any load with the right carrier at a price you can <span className="text-blue-400">compare.</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-slate-300">
              Post a shipment, review carrier offers side by side, and follow every mile from pickup to proof of delivery. Carriers find loads that fit their routes and capacity.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/register" className="inline-flex min-h-10 items-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white no-underline transition hover:bg-blue-500">Post a shipment</Link>
              <Link to="/register" className="inline-flex min-h-10 items-center rounded-lg border border-slate-500 px-4 py-2 text-xs font-bold text-white no-underline transition hover:border-blue-400 hover:bg-blue-400/10">Find loads as a carrier</Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-medium text-slate-300">
              <span className="inline-flex items-center gap-1.5"><CheckMark /> Business accounts</span>
              <span className="inline-flex items-center gap-1.5"><CheckMark /> Live status updates</span>
              <span className="inline-flex items-center gap-1.5"><CheckMark /> Proof of delivery</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-2xl shadow-black/20 max-sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="block text-[10px] font-semibold text-slate-500">Sample shipment · FF-10482</span>
                <strong className="mt-0.5 block text-sm font-bold">Addis Ababa → Djibouti</strong>
              </div>
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[9px] font-bold text-teal-700">In transit</span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-3/5 rounded-full bg-teal-500" /></div>
            <div className="mt-1 flex justify-between text-[9px] font-medium text-slate-500"><span>Picked up</span><span>In transit</span><span>Delivered</span></div>
            <div className="mt-4 border-t border-slate-100 pt-3">
              <span className="text-[10px] font-semibold text-slate-500">Carrier offers</span>
              <div className="mt-2 rounded-lg border border-teal-400 bg-teal-50/60 p-2.5">
                <div className="flex items-center justify-between gap-3 text-[11px] font-bold"><span>Carrier A · 20 t truck</span><span className="text-slate-700">[PRICE]</span></div>
                <p className="m-0 text-[9px] text-slate-500">Pickup Mon · 4.8 rating</p>
              </div>
              <div className="mt-1.5 rounded-lg border border-slate-200 p-2.5">
                <div className="flex items-center justify-between gap-3 text-[11px] font-bold"><span>Carrier B · 12 t truck</span><span className="text-slate-700">[PRICE]</span></div>
                <p className="m-0 text-[9px] text-slate-500">Pickup Tue · 4.6 rating</p>
              </div>
            </div>
          </div>
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
                <span aria-hidden="true" className="text-lg font-bold leading-none text-teal-600">{feature.icon}</span>
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
            <p className="mb-0 mt-3 text-xs leading-[1.6] text-slate-300">Publish, edit or cancel a freight request, review every offer, and select a carrier. Manage bookings and invoices without leaving the page.</p>
            <Link to="/register" className="mt-5 inline-flex min-h-9 items-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white no-underline hover:bg-blue-500">Post a shipment</Link>
          </article>
          <article className="rounded-2xl bg-teal-50 p-7">
            <p className="m-0 text-[10px] font-extrabold tracking-[0.16em] text-teal-700">FOR CARRIERS</p>
            <h2 className="mb-0 mt-2 text-xl font-extrabold leading-tight text-[#0b2034]">Fill your capacity on the routes you run</h2>
            <p className="mb-0 mt-3 text-xs leading-[1.6] text-slate-600">List your vehicles and services, find matching freight, submit offers, update milestones and upload proof of delivery from your phone.</p>
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
            <a href="#how-it-works" className="text-inherit no-underline hover:text-white">Track a shipment</a>
          </div>
          <div className="grid content-start gap-2 text-[10px]">
            <a href="#support" className="text-inherit no-underline hover:text-white">Help center</a>
            <a href="#support" className="text-inherit no-underline hover:text-white">Contact support</a>
            <a href="#features" className="text-inherit no-underline hover:text-white">Invoices and billing</a>
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
