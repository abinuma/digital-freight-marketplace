import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Alert, Badge, Button, Card, Input, Pagination, Skeleton } from '../../../shared/components/index.js';
import { listAvailableShipments } from '../transporter.api.js';
import { ShipmentMap } from '../components/ShipmentMap.jsx';

const initialFilters = { q: '', pickupLocation: '', deliveryLocation: '', goodsType: '', pickupDateFrom: '', pickupDateTo: '' };
const dateLabel = (date) => new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));

export function ShipmentDiscoveryPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [draft, setDraft] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [view, setView] = useState('list');
  const [filterError, setFilterError] = useState('');
  const query = useQuery({ queryKey: ['transporter', 'discover', filters, page], queryFn: () => listAvailableShipments({ ...filters, page, limit: 10 }) });
  const shipments = query.data?.shipments || [];

  function updateDraft(name, value) { setDraft((current) => ({ ...current, [name]: value })); }
  function applyFilters(event) {
    event.preventDefault();
    if (draft.pickupDateFrom && draft.pickupDateTo && draft.pickupDateFrom > draft.pickupDateTo) {
      setFilterError('The earliest pickup date must be before the latest date.');
      return;
    }
    setFilterError('');
    setFilters(Object.fromEntries(Object.entries(draft).filter(([, value]) => value)));
    setPage(1);
  }
  function clearFilters() { setDraft(initialFilters); setFilters(initialFilters); setFilterError(''); setPage(1); }

  return (
    <div className="shipper-page transporter-page">
      <div className="shipper-page__heading"><div><p className="shipper-eyebrow">MARKETPLACE</p><h1>Find shipments</h1><p>Browse published freight listings and make an offer.</p></div><Badge tone="brand">{query.data?.pagination?.total ?? '—'} available</Badge></div>
      <div className="transporter-discovery-grid">
        <Card className="transporter-filter-card"><div><h2>Filter shipments</h2><p>Find loads that work for you.</p></div>{filterError && <Alert tone="danger">{filterError}</Alert>}<form onSubmit={applyFilters}>
          <label className="shipper-field"><span>Search</span><Input value={draft.q} onChange={(event) => updateDraft('q', event.target.value)} placeholder="Cargo or requirements" /></label>
          <label className="shipper-field"><span>Pickup location</span><Input value={draft.pickupLocation} onChange={(event) => updateDraft('pickupLocation', event.target.value)} placeholder="City or area" /></label>
          <label className="shipper-field"><span>Delivery location</span><Input value={draft.deliveryLocation} onChange={(event) => updateDraft('deliveryLocation', event.target.value)} placeholder="City or area" /></label>
          <label className="shipper-field"><span>Goods type</span><Input value={draft.goodsType} onChange={(event) => updateDraft('goodsType', event.target.value)} placeholder="e.g. agricultural" /></label>
          <div className="transporter-date-filter"><label className="shipper-field"><span>Pickup from</span><Input type="date" value={draft.pickupDateFrom} onChange={(event) => updateDraft('pickupDateFrom', event.target.value)} /></label><label className="shipper-field"><span>Pickup to</span><Input type="date" value={draft.pickupDateTo} onChange={(event) => updateDraft('pickupDateTo', event.target.value)} /></label></div>
          <Button type="submit">Apply filters</Button><Button variant="ghost" type="button" onClick={clearFilters}>Clear filters</Button>
        </form></Card>
        <section className="transporter-results">
          <div className="transporter-results__top"><div><h2>Available loads</h2><p>{query.data?.pagination?.total ?? 0} matching shipments</p></div><div className="transporter-view-toggle" aria-label="Shipment results view"><Button size="sm" variant={view === 'list' ? 'primary' : 'secondary'} onClick={() => setView('list')}>List</Button><Button size="sm" variant={view === 'map' ? 'primary' : 'secondary'} onClick={() => setView('map')}>Map</Button></div></div>
          {query.isError && <Alert tone="danger" title="Could not load shipments">{query.error.message}</Alert>}
          {view === 'map' && !query.isPending && <Card className="transporter-map-card"><ShipmentMap shipments={shipments} />{!shipments.some((shipment) => shipment.pickupLat != null) && <p className="transporter-map-note">These listings don’t include map pins yet. Map pins are shown when shippers provide coordinates.</p>}</Card>}
          {query.isPending ? <div className="transporter-load-list"><Skeleton /><Skeleton /><Skeleton /></div> : shipments.length ? <div className="transporter-load-list">{shipments.map((shipment) => <Card className="transporter-load-card" key={shipment.id}><div className="transporter-load-card__top"><div><Badge tone="brand">{shipment.goodsType}</Badge><h3><Link to={`/transporter/shipments/${shipment.id}`}>{shipment.goodsDescription}</Link></h3></div><span className="transporter-weight">{shipment.weightKg} kg</span></div><div className="transporter-route"><span>●</span><strong>{shipment.pickupLocation}</strong><i /> <span className="transporter-route__end">●</span><strong>{shipment.deliveryLocation}</strong></div><div className="transporter-load-card__footer"><span>Pickup {dateLabel(shipment.pickupDate)}</span><span>{shipment.specialRequirements ? 'Requirements included' : 'Standard handling'}</span><Link to={`/transporter/shipments/${shipment.id}`}>View details <b>→</b></Link></div></Card>)}</div> : <Card className="shipper-empty"><span>⌕</span><h3>No matching shipments</h3><p>Try changing the locations, goods type, or pickup date filters.</p><Button variant="secondary" onClick={clearFilters}>Clear filters</Button></Card>}
          <Pagination page={query.data?.pagination?.page || page} pageCount={query.data?.pagination?.totalPages || 1} onPageChange={setPage} />
        </section>
      </div>
    </div>
  );
}
