import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Alert, Button, Card, Input, Spinner, Textarea } from '../../../shared/components/index.js';
import { getShipment, saveShipment, transitionShipment, uploadShipmentImages } from '../shipper.api.js';
import { LocationPicker } from '../components/LocationPicker.jsx';

const formSchema = z.object({
  goodsDescription: z.string().trim().min(10, 'Describe the goods in at least 10 characters').max(1000),
  goodsType: z.string().trim().min(1, 'Choose a goods category').max(50),
  weightKg: z.coerce.number().positive('Weight must be greater than zero').max(99_999_999.99),
  pickupLocation: z.string().trim().min(1, 'Enter a pickup location').max(255),
  deliveryLocation: z.string().trim().min(1, 'Enter a delivery location').max(255),
  pickupDate: z.iso.date('Choose a pickup date').refine((date) => date >= new Date().toISOString().slice(0, 10), 'Pickup date must be today or later'),
  specialRequirements: z.string().max(2000),
});
const empty = { goodsDescription: '', goodsType: '', weightKg: '', pickupLocation: '', pickupLat: null, pickupLng: null, deliveryLocation: '', deliveryLat: null, deliveryLng: null, pickupDate: '', specialRequirements: '' };
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

function fieldError(errors, name) { return errors[name] ? <small className="shipper-field__error">{errors[name]}</small> : null; }

function todayDate() { return new Date().toISOString().slice(0, 10); }

export function ShipmentFormPage() {
  const { id: routeId } = useParams();
  const shipmentQuery = useQuery({ queryKey: ['shipper', 'shipment', routeId], queryFn: () => getShipment(routeId), enabled: Boolean(routeId) });

  if (routeId && shipmentQuery.isPending) return <div className="shipper-page"><div className="shipper-loading-list"><Spinner /></div></div>;
  if (routeId && shipmentQuery.isError) return <div className="shipper-page"><Alert tone="danger" title="Shipment could not be loaded">{shipmentQuery.error.message}</Alert></div>;
  return <ShipmentForm key={routeId || 'new-shipment'} routeId={routeId} initialShipment={shipmentQuery.data || null} />;
}

function ShipmentForm({ routeId, initialShipment }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [shipmentId, setShipmentId] = useState(routeId || null);
  const [values, setValues] = useState(() => initialShipment ? { ...empty, ...initialShipment, weightKg: String(initialShipment.weightKg), pickupDate: initialShipment.pickupDate?.slice(0, 10), specialRequirements: initialShipment.specialRequirements || '' } : empty);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const stagedFiles = useMemo(() => files.map((file) => ({ file, preview: URL.createObjectURL(file) })), [files]);
  useEffect(() => () => stagedFiles.forEach(({ preview }) => URL.revokeObjectURL(preview)), [stagedFiles]);

  function setField(name, value) { setValues((current) => ({ ...current, [name]: value })); }

  function addFiles(event) {
    const selected = Array.from(event.target.files || []);
    const previousCount = initialShipment?.images?.length || 0;
    if (selected.some((file) => !allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setSaveError('Images must be JPEG, PNG, or WebP files up to 5 MB each.');
      event.target.value = '';
      return;
    }
    if (previousCount + files.length + selected.length > 5) {
      setSaveError('A shipment can include up to five images.');
      event.target.value = '';
      return;
    }
    setSaveError('');
    setFiles((current) => [...current, ...selected]);
    event.target.value = '';
  }

  async function submit(event) {
    event.preventDefault();
    setSaveError('');
    const parsed = formSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message])));
      return;
    }
    setErrors({});
    const intent = event.nativeEvent.submitter?.value || 'draft';
    setIsSaving(true);
    try {
      const payload = { ...parsed.data, weightKg: Number(parsed.data.weightKg) };
      for (const field of ['pickupLat', 'pickupLng', 'deliveryLat', 'deliveryLng']) {
        if (values[field] == null && shipmentId) payload[field] = null;
        else if (values[field] == null) delete payload[field];
        else payload[field] = Number(values[field]);
      }
      if (!payload.specialRequirements.trim()) {
        if (shipmentId) payload.specialRequirements = null;
        else delete payload.specialRequirements;
      }
      const saved = await saveShipment({ id: shipmentId, values: payload });
      setShipmentId(saved.id);
      if (files.length) await uploadShipmentImages({ id: saved.id, files });
      if (intent === 'publish' && saved.status === 'DRAFT') await transitionShipment({ id: saved.id, action: 'publish' });
      await queryClient.invalidateQueries({ queryKey: ['shipper'] });
      navigate(`/shipper/shipments/${saved.id}`);
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  const currentImageCount = initialShipment?.images?.length || 0;
  const isEditable = !initialShipment || ['DRAFT', 'PUBLISHED'].includes(initialShipment.status);
  return (
    <div className="shipper-page shipper-form-page">
      <div className="shipper-page__heading"><div><p className="shipper-eyebrow">{routeId ? 'SHIPMENT DETAILS' : 'NEW POSTING'}</p><h1>{routeId ? 'Edit shipment' : 'Post a shipment'}</h1><p>Add the details transporters need to send you the right offer.</p></div></div>
      {!isEditable && <Alert tone="warning" title="This shipment can’t be edited">Shipments with accepted bids or a completed/cancelled status can no longer be changed.</Alert>}
      {saveError && <Alert tone="danger" title="Could not save shipment">{saveError}</Alert>}
      <form onSubmit={submit} noValidate>
        <Card className="shipper-form-card"><div className="shipper-form-section"><span className="shipper-step">01</span><div><h2>Shipment details</h2><p>Tell transporters what you’re moving.</p></div></div>
          <div className="shipper-form-grid"><label className="shipper-field shipper-field--full"><span>Goods description <i>*</i></span><Textarea required maxLength={1000} value={values.goodsDescription} onChange={(event) => setField('goodsDescription', event.target.value)} placeholder="Describe your cargo, packaging, and anything transporters should know" />{fieldError(errors, 'goodsDescription')}<small>10–1,000 characters</small></label>
            <label className="shipper-field"><span>Goods category <i>*</i></span><Input required maxLength={50} value={values.goodsType} onChange={(event) => setField('goodsType', event.target.value)} placeholder="e.g. agricultural, industrial, household" />{fieldError(errors, 'goodsType')}</label>
            <label className="shipper-field"><span>Weight (kg) <i>*</i></span><Input required type="number" min="0.01" step="0.01" value={values.weightKg} onChange={(event) => setField('weightKg', event.target.value)} placeholder="e.g. 1200" />{fieldError(errors, 'weightKg')}</label>
          </div>
        </Card>
        <Card className="shipper-form-card"><div className="shipper-form-section"><span className="shipper-step">02</span><div><h2>Route &amp; timing</h2><p>Set the pickup and destination locations.</p></div></div>
          <div className="shipper-form-grid"><label className="shipper-field"><span>Pickup location <i>*</i></span><Input required maxLength={255} value={values.pickupLocation} onChange={(event) => setField('pickupLocation', event.target.value)} placeholder="City, area, or address" />{fieldError(errors, 'pickupLocation')}</label><label className="shipper-field"><span>Delivery location <i>*</i></span><Input required maxLength={255} value={values.deliveryLocation} onChange={(event) => setField('deliveryLocation', event.target.value)} placeholder="City, area, or address" />{fieldError(errors, 'deliveryLocation')}</label>
            <LocationPicker label="Pickup pin" value={{ lat: values.pickupLat, lng: values.pickupLng }} onChange={({ lat, lng }) => { setField('pickupLat', lat); setField('pickupLng', lng); }} /><LocationPicker label="Delivery pin" value={{ lat: values.deliveryLat, lng: values.deliveryLng }} onChange={({ lat, lng }) => { setField('deliveryLat', lat); setField('deliveryLng', lng); }} />
            <label className="shipper-field"><span>Pickup date <i>*</i></span><Input required type="date" min={todayDate()} value={values.pickupDate} aria-invalid={Boolean(errors.pickupDate)} aria-describedby={errors.pickupDate ? 'pickup-date-error' : undefined} onChange={(event) => { const value = event.target.value; setField('pickupDate', value); setErrors((current) => ({ ...current, pickupDate: value && value < todayDate() ? 'Choose today or a future date.' : undefined })); }} />{errors.pickupDate && <small id="pickup-date-error" className="shipper-field__error" role="alert">{errors.pickupDate}</small>}</label>
          </div>
        </Card>
        <Card className="shipper-form-card"><div className="shipper-form-section"><span className="shipper-step">03</span><div><h2>Preferences</h2><p>Share handling instructions and cargo photos.</p></div></div>
          <div className="shipper-form-grid"><label className="shipper-field shipper-field--full"><span>Special requirements</span><Textarea maxLength={2000} value={values.specialRequirements} onChange={(event) => setField('specialRequirements', event.target.value)} placeholder="Fragile items, loading requirements, delivery notes…" /><small>Up to 2,000 characters</small></label>
            <div className="shipper-field shipper-field--full"><span>Shipment photos <small>Optional · JPEG, PNG or WebP · 5 MB each · up to 5 photos</small></span><label className="shipper-upload"><span>＋</span><strong>Choose photos</strong><small>{currentImageCount + files.length} of 5 selected</small><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addFiles} disabled={currentImageCount + files.length >= 5} /></label><div className="shipper-preview-grid">{initialShipment?.images?.map((image) => <img key={image.id} src={image.url} alt="Existing shipment" />)}{stagedFiles.map(({ file, preview }, index) => <figure key={`${file.name}-${index}`}><img src={preview} alt={file.name} /><button type="button" onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${file.name}`}>×</button></figure>)}</div></div>
          </div>
        </Card>
        <div className="shipper-form-actions"><Button variant="secondary" type="button" onClick={() => navigate(-1)} disabled={isSaving}>Cancel</Button><Button variant="secondary" type="submit" name="intent" value="draft" disabled={!isEditable || isSaving}>{isSaving ? <><Spinner /> Saving…</> : 'Save as draft'}</Button><Button type="submit" name="intent" value="publish" disabled={!isEditable || isSaving}>{isSaving ? <><Spinner /> Saving…</> : routeId && initialShipment?.status === 'PUBLISHED' ? 'Save changes' : 'Publish shipment'}</Button></div>
      </form>
    </div>
  );
}
