import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Alert, Button, Card, Input, Spinner } from '../../shared/components/index.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { getVehicle, updateProfile, updateVehicle, uploadProfilePhoto } from './profile.api.js';

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(100),
  phone: z.string().trim().min(7, 'Enter a valid phone number').max(20),
  location: z.string().trim().max(255).optional(),
});

const vehicleSchema = z.object({
  type: z.string().trim().min(1, 'Enter your truck type').max(50),
  capacityTons: z.coerce.number().positive('Enter a capacity greater than zero').max(99_999_999.99),
  plateNumber: z.string().trim().min(1, 'Enter your plate number').max(20),
});

const allowedPhotoTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxPhotoSize = 5 * 1024 * 1024;

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState({ name: user.name || '', phone: user.phone || '', location: user.location || '' });
  const [vehicle, setVehicle] = useState({ type: '', capacityTons: '', plateNumber: '' });
  const [hasVehicle, setHasVehicle] = useState(false);
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(user.role === 'TRANSPORTER');
  const [vehicleLoadError, setVehicleLoadError] = useState('');
  const [status, setStatus] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [vehicleErrors, setVehicleErrors] = useState({});
  const [profileBusy, setProfileBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [vehicleBusy, setVehicleBusy] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  useEffect(() => {
    if (user.role !== 'TRANSPORTER') return undefined;
    let isCurrent = true;
    getVehicle(user.id).then((result) => {
      if (!isCurrent) return;
      setVehicle({ type: result.type, capacityTons: String(result.capacityTons), plateNumber: result.plateNumber });
      setHasVehicle(true);
    }).catch((error) => {
      if (!isCurrent || error.status === 404) return;
      setVehicleLoadError(error.message);
    }).finally(() => {
      if (isCurrent) setIsLoadingVehicle(false);
    });
    return () => { isCurrent = false; };
  }, [user.id, user.role]);

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  function changeProfile(event) {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  function changeVehicle(event) {
    const { name, value } = event.target;
    setVehicle((current) => ({ ...current, [name]: value }));
    setVehicleErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setStatus(null);
    const parsed = profileSchema.safeParse({ ...profile, location: profile.location || undefined });
    if (!parsed.success) {
      setFieldErrors(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message])));
      return;
    }

    setFieldErrors({});
    setProfileBusy(true);
    try {
      const updates = { ...parsed.data, location: parsed.data.location || null };
      await updateProfile(user.id, updates);
      await refreshUser();
      setStatus({ tone: 'success', text: 'Your profile has been updated.' });
    } catch (error) {
      setStatus({ tone: 'danger', text: error.message });
    } finally {
      setProfileBusy(false);
    }
  }

  function choosePhoto(event) {
    setStatus(null);
    const file = event.target.files?.[0] || null;
    if (!file) {
      setPhotoPreview('');
      setPhotoFile(null);
      return;
    }
    if (!allowedPhotoTypes.has(file.type)) {
      setStatus({ tone: 'danger', text: 'Choose a JPEG, PNG, or WebP image.' });
      event.target.value = '';
      return;
    }
    if (file.size > maxPhotoSize) {
      setStatus({ tone: 'danger', text: 'Profile photos must be 5 MB or smaller.' });
      event.target.value = '';
      return;
    }
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoFile(file);
  }

  async function savePhoto(event) {
    event.preventDefault();
    if (!photoFile) return;
    setStatus(null);
    setPhotoBusy(true);
    try {
      await uploadProfilePhoto(user.id, photoFile);
      await refreshUser();
      setPhotoPreview('');
      setPhotoFile(null);
      setStatus({ tone: 'success', text: 'Your profile photo has been updated.' });
    } catch (error) {
      setStatus({ tone: 'danger', text: error.message });
    } finally {
      setPhotoBusy(false);
    }
  }

  async function saveVehicle(event) {
    event.preventDefault();
    setStatus(null);
    const parsed = vehicleSchema.safeParse(vehicle);
    if (!parsed.success) {
      setVehicleErrors(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message])));
      return;
    }

    setVehicleErrors({});
    setVehicleBusy(true);
    try {
      await updateVehicle(user.id, parsed.data);
      setHasVehicle(true);
      setStatus({ tone: 'success', text: 'Your vehicle details have been updated.' });
    } catch (error) {
      setStatus({ tone: 'danger', text: error.message });
    } finally {
      setVehicleBusy(false);
    }
  }

  const initials = (user.name || 'EF').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const avatar = photoPreview || user.profilePhoto;

  return (
    <main className="profile-screen">
      <header className="profile-screen__header">
        <div><p className="eyebrow">Account settings</p><h1>Your Profile</h1><p>Manage your contact information and account details.</p></div>
      </header>
      {status && <Alert tone={status.tone} className="profile-status">{status.text}</Alert>}
      <div className="profile-grid">
        <Card className="profile-card profile-card--photo">
          <h2>Profile Photo</h2>
          <div className="profile-avatar">{avatar ? <img src={avatar} alt={`${user.name} profile`} /> : <span>{initials}</span>}</div>
          <p className="profile-card__hint">JPEG, PNG, or WebP, up to 5 MB.</p>
          <form onSubmit={savePhoto} className="profile-photo-form">
            <label className="profile-file-label" htmlFor="profile-photo">Choose Photo</label>
            <input id="profile-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} />
            {photoFile && <p className="profile-file-name">{photoFile.name}</p>}
            <Button type="submit" disabled={!photoFile || photoBusy}>{photoBusy ? 'Uploading…' : 'Upload Photo'}</Button>
          </form>
        </Card>

        <Card className="profile-card">
          <h2>Personal Information</h2>
          <form className="profile-settings-form" onSubmit={saveProfile} noValidate>
            <div className="profile-field"><label htmlFor="profile-name">Full Name</label><Input id="profile-name" name="name" autoComplete="name" value={profile.name} onChange={changeProfile} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? 'profile-name-error' : undefined} />{fieldErrors.name && <span className="auth-field__error" id="profile-name-error">{fieldErrors.name}</span>}</div>
            <div className="profile-field"><label htmlFor="profile-email">Email Address</label><Input id="profile-email" type="email" value={user.email} disabled /><span className="profile-card__hint">Email address cannot be changed here.</span></div>
            <div className="profile-field"><label htmlFor="profile-phone">Phone Number</label><Input id="profile-phone" name="phone" type="tel" autoComplete="tel" value={profile.phone} onChange={changeProfile} aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? 'profile-phone-error' : undefined} />{fieldErrors.phone && <span className="auth-field__error" id="profile-phone-error">{fieldErrors.phone}</span>}</div>
            <div className="profile-field"><label htmlFor="profile-location">Location</label><Input id="profile-location" name="location" autoComplete="address-level2" placeholder="City, region" value={profile.location} onChange={changeProfile} aria-invalid={Boolean(fieldErrors.location)} aria-describedby={fieldErrors.location ? 'profile-location-error' : undefined} />{fieldErrors.location && <span className="auth-field__error" id="profile-location-error">{fieldErrors.location}</span>}</div>
            <Button type="submit" disabled={profileBusy}>{profileBusy ? 'Saving…' : 'Save Changes'}</Button>
          </form>
        </Card>

        {user.role === 'TRANSPORTER' && (
          <Card className="profile-card profile-card--vehicle">
            <h2>Vehicle Details</h2>
            <p className="profile-card__hint">{hasVehicle ? 'Keep your vehicle information up to date.' : 'Add your vehicle to start finding loads.'}</p>
            {isLoadingVehicle ? <div className="profile-loading"><Spinner label="Loading vehicle details" /></div> : (
              <form className="profile-settings-form" onSubmit={saveVehicle} noValidate>
                {vehicleLoadError && <Alert tone="danger">{vehicleLoadError}</Alert>}
                <div className="profile-field"><label htmlFor="vehicle-type">Truck Type</label><Input id="vehicle-type" name="type" placeholder="Flatbed Truck" value={vehicle.type} onChange={changeVehicle} aria-invalid={Boolean(vehicleErrors.type)} aria-describedby={vehicleErrors.type ? 'vehicle-type-error' : undefined} />{vehicleErrors.type && <span className="auth-field__error" id="vehicle-type-error">{vehicleErrors.type}</span>}</div>
                <div className="profile-field"><label htmlFor="vehicle-capacity">Capacity (Tons)</label><Input id="vehicle-capacity" name="capacityTons" type="number" min="0.1" step="0.1" placeholder="10" value={vehicle.capacityTons} onChange={changeVehicle} aria-invalid={Boolean(vehicleErrors.capacityTons)} aria-describedby={vehicleErrors.capacityTons ? 'vehicle-capacity-error' : undefined} />{vehicleErrors.capacityTons && <span className="auth-field__error" id="vehicle-capacity-error">{vehicleErrors.capacityTons}</span>}</div>
                <div className="profile-field"><label htmlFor="vehicle-plate">Plate Number</label><Input id="vehicle-plate" name="plateNumber" placeholder="ET-23456" value={vehicle.plateNumber} onChange={changeVehicle} aria-invalid={Boolean(vehicleErrors.plateNumber)} aria-describedby={vehicleErrors.plateNumber ? 'vehicle-plate-error' : undefined} />{vehicleErrors.plateNumber && <span className="auth-field__error" id="vehicle-plate-error">{vehicleErrors.plateNumber}</span>}</div>
                <Button type="submit" disabled={vehicleBusy}>{vehicleBusy ? 'Saving…' : 'Save Vehicle'}</Button>
              </form>
            )}
          </Card>
        )}
      </div>
    </main>
  );
}
