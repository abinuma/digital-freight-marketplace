import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Toast } from '../../shared/components/index.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { getVehicle, updateProfile, updateVehicle, uploadProfilePhoto } from './profile.api.js';
import { PersonalInformationCard } from './components/PersonalInformationCard.jsx';
import { ProfilePhotoCard } from './components/ProfilePhotoCard.jsx';
import { VehicleDetailsCard } from './components/VehicleDetailsCard.jsx';

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
  const navigate = useNavigate();
  const location = useLocation();
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
    getVehicle(user.id)
      .then((result) => {
        if (!isCurrent) return;
        setVehicle({ type: result.type, capacityTons: String(result.capacityTons), plateNumber: result.plateNumber });
        setHasVehicle(true);
      })
      .catch((error) => {
        if (!isCurrent || error.status === 404) return;
        setVehicleLoadError(error.message);
      })
      .finally(() => {
        if (isCurrent) setIsLoadingVehicle(false);
      });
    return () => { isCurrent = false; };
  }, [user.id, user.role]);

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  useEffect(() => {
    if (status?.tone !== 'success') return undefined;
    const timeout = window.setTimeout(() => setStatus(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [status]);

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
  const backPath = location.key === 'default'
    ? user.role === 'SHIPPER' ? '/shipper' : user.role === 'TRANSPORTER' ? '/transporter' : '/admin'
    : -1;

  return (
    <main className="mx-auto w-full max-w-5xl py-8 max-md:py-5">
      <header className="mb-6">
        <Button type="button" variant="secondary" size="sm" onClick={() => navigate(backPath)}>← Back</Button>
        <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-widest text-blue-700">Account settings</p>
        <h1 className="m-0 text-2xl font-bold text-slate-900">Your Profile</h1>
        <p className="mb-0 mt-2 text-sm text-slate-500">Manage your contact information and account details.</p>
      </header>
      {status?.tone === 'danger' && <Alert tone="danger" className="mb-4">{status.text}</Alert>}
      {status?.tone === 'success' && <Toast tone="success" className="top-4 left-1/2 max-w-full">{status.text}</Toast>}

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
        <ProfilePhotoCard avatar={avatar} userName={user.name} initials={initials} photoFile={photoFile} photoBusy={photoBusy} onChoosePhoto={choosePhoto} onSavePhoto={savePhoto} />
        <PersonalInformationCard profile={profile} email={user.email} errors={fieldErrors} busy={profileBusy} onChange={changeProfile} onSave={saveProfile} />
        {user.role === 'TRANSPORTER' && (
          <VehicleDetailsCard
            vehicle={vehicle}
            errors={vehicleErrors}
            hasVehicle={hasVehicle}
            isLoading={isLoadingVehicle}
            loadError={vehicleLoadError}
            busy={vehicleBusy}
            onChange={changeVehicle}
            onSave={saveVehicle}
          />
        )}
      </div>
    </main>
  );
}
