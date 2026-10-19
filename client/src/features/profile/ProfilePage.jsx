import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, useSuccessToast } from '../../shared/components/index.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { getVehicle, updateProfile, updateVehicle, uploadProfilePhoto, uploadVehiclePhoto } from './profile.api.js';
import { PersonalInformationCard } from './components/PersonalInformationCard.jsx';
import { ProfilePhotoCard } from './components/ProfilePhotoCard.jsx';
import { VehicleDetailsCard } from './components/VehicleDetailsCard.jsx';
import { TransporterPreferencesCard } from './components/TransporterPreferencesCard.jsx';
import { ethiopianPhoneSchema } from '../../shared/utils/ethiopianPhone.js';

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(100),
  phone: ethiopianPhoneSchema,
  location: z.string().trim().max(255).optional(),
  region: z.string().trim().max(100).optional(),
  zone: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
});

const vehicleSchema = z.object({
  type: z.string().trim().min(1, 'Select your vehicle type').max(50),
  capacityTons: z.coerce.number().positive('Enter a maximum load greater than zero').max(99_999_999.99),
  volumeM3: z.coerce.number().positive('Enter a volume greater than zero').max(99_999_999.99).nullable().optional(),
  plateNumber: z.string().trim().min(1, 'Enter your plate number').max(20),
});

const allowedPhotoTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxPhotoSize = 5 * 1024 * 1024;

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const showSuccess = useSuccessToast();
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const [profile, setProfile] = useState({
    name: user.name || '',
    phone: user.phone || '',
    location: user.location || '',
    region: user.region || '',
    zone: user.zone || '',
    city: user.city || '',
  });
  const [vehicle, setVehicle] = useState({ type: '', capacityTons: '', volumeM3: '', plateNumber: '', photo: '' });
  const [availableDays, setAvailableDays] = useState(user.availableDays || []);
  const [preferredLoadTypes, setPreferredLoadTypes] = useState(user.preferredLoadTypes || []);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(user.role === 'TRANSPORTER');
  const [vehicleLoadError, setVehicleLoadError] = useState('');
  const [status, setStatus] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [vehicleErrors, setVehicleErrors] = useState({});
  const [profileBusy, setProfileBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [vehicleBusy, setVehicleBusy] = useState(false);
  const [prefBusy, setPrefBusy] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [vehiclePhotoFile, setVehiclePhotoFile] = useState(null);
  const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState('');
  const [vehiclePhotoBusy, setVehiclePhotoBusy] = useState(false);

  useEffect(() => {
    if (user.role !== 'TRANSPORTER') return undefined;
    let isCurrent = true;
    getVehicle(user.id)
      .then((result) => {
        if (!isCurrent) return;
        setVehicle({
          type: result.type,
          capacityTons: String(result.capacityTons),
          volumeM3: result.volumeM3 != null ? String(result.volumeM3) : '',
          plateNumber: result.plateNumber,
          photo: result.photo || '',
        });
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvailableDays(user.availableDays || []);
    setPreferredLoadTypes(user.preferredLoadTypes || []);
  }, [user.availableDays, user.preferredLoadTypes]);

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  useEffect(() => () => {
    if (vehiclePhotoPreview) URL.revokeObjectURL(vehiclePhotoPreview);
  }, [vehiclePhotoPreview]);

  function changeProfile(event) {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  function changeLocation({ city, zone, region, location }) {
    setProfile((current) => ({
      ...current,
      city,
      zone,
      region,
      location,
    }));
    setFieldErrors((current) => ({
      ...current,
      city: undefined,
      location: undefined,
    }));
  }

  function changeVehicle(event) {
    const { name, value } = event.target;
    setVehicle((current) => ({ ...current, [name]: value }));
    setVehicleErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setStatus(null);
    const parsed = profileSchema.safeParse({
      name: profile.name,
      phone: profile.phone,
      location: profile.location || undefined,
      region: profile.region || undefined,
      zone: profile.zone || undefined,
      city: profile.city || undefined,
    });
    if (!parsed.success) {
      setFieldErrors(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message])));
      return;
    }
    setFieldErrors({});
    setProfileBusy(true);
    try {
      const updates = {
        name: parsed.data.name,
        phone: parsed.data.phone,
        location: parsed.data.location || null,
        region: parsed.data.region || null,
        zone: parsed.data.zone || null,
        city: parsed.data.city || null,
      };
      await updateProfile(user.id, updates);
      await refreshUser();
      showSuccess('Profile updated');
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
      showSuccess('Photo updated');
    } catch (error) {
      setStatus({ tone: 'danger', text: error.message });
    } finally {
      setPhotoBusy(false);
    }
  }

  function chooseVehiclePhoto(event) {
    setStatus(null);
    const file = event.target.files?.[0] || null;
    if (!file) {
      if (vehiclePhotoPreview) URL.revokeObjectURL(vehiclePhotoPreview);
      setVehiclePhotoPreview('');
      setVehiclePhotoFile(null);
      return;
    }
    if (!allowedPhotoTypes.has(file.type)) {
      setStatus({ tone: 'danger', text: 'Choose a JPEG, PNG, or WebP image for your vehicle.' });
      event.target.value = '';
      return;
    }
    if (file.size > maxPhotoSize) {
      setStatus({ tone: 'danger', text: 'Vehicle photos must be 5 MB or smaller.' });
      event.target.value = '';
      return;
    }
    if (vehiclePhotoPreview) URL.revokeObjectURL(vehiclePhotoPreview);
    setVehiclePhotoPreview(URL.createObjectURL(file));
    setVehiclePhotoFile(file);
  }

  function clearChosenVehiclePhoto() {
    if (vehiclePhotoPreview) URL.revokeObjectURL(vehiclePhotoPreview);
    setVehiclePhotoPreview('');
    setVehiclePhotoFile(null);
  }

  async function uploadSelectedVehiclePhoto(event) {
    if (event) event.preventDefault();
    if (!vehiclePhotoFile) return;
    setStatus(null);
    setVehiclePhotoBusy(true);
    try {
      const result = await uploadVehiclePhoto(user.id, vehiclePhotoFile);
      setVehicle((current) => ({
        ...current,
        photo: result.photo || current.photo,
      }));
      if (result.id) setHasVehicle(true);
      if (vehiclePhotoPreview) URL.revokeObjectURL(vehiclePhotoPreview);
      setVehiclePhotoPreview('');
      setVehiclePhotoFile(null);
      showSuccess('Vehicle photo updated');
    } catch (error) {
      setStatus({ tone: 'danger', text: error.message });
    } finally {
      setVehiclePhotoBusy(false);
    }
  }

  async function saveVehicle(event) {
    event.preventDefault();
    setStatus(null);
    const parsed = vehicleSchema.safeParse({
      ...vehicle,
      volumeM3: vehicle.volumeM3 ? vehicle.volumeM3 : null,
    });
    if (!parsed.success) {
      setVehicleErrors(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message])));
      return;
    }
    setVehicleErrors({});
    setVehicleBusy(true);
    try {
      let currentPhoto = vehicle.photo || null;
      if (vehiclePhotoFile) {
        const uploadResult = await uploadVehiclePhoto(user.id, vehiclePhotoFile);
        currentPhoto = uploadResult.photo || currentPhoto;
        if (vehiclePhotoPreview) URL.revokeObjectURL(vehiclePhotoPreview);
        setVehiclePhotoPreview('');
        setVehiclePhotoFile(null);
      }
      const updated = await updateVehicle(user.id, {
        ...parsed.data,
        photo: currentPhoto || undefined,
      });
      setVehicle((curr) => ({
        ...curr,
        type: updated.type,
        capacityTons: String(updated.capacityTons),
        volumeM3: updated.volumeM3 != null ? String(updated.volumeM3) : '',
        plateNumber: updated.plateNumber,
        photo: updated.photo || curr.photo,
      }));
      setHasVehicle(true);
      showSuccess('Details updated');
    } catch (error) {
      setStatus({ tone: 'danger', text: error.message });
    } finally {
      setVehicleBusy(false);
    }
  }


  async function savePreferences(event) {
    event.preventDefault();
    setStatus(null);
    setPrefBusy(true);
    try {
      await updateProfile(user.id, { availableDays, preferredLoadTypes });
      await refreshUser();
      showSuccess('Preferences updated');
    } catch (error) {
      setStatus({ tone: 'danger', text: error.message });
    } finally {
      setPrefBusy(false);
    }
  }

  const initials = (user.name || 'EF').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const avatar = photoPreview || user.profilePhoto;
  const backPath = routeLocation.key === 'default'
    ? user.role === 'SHIPPER' ? '/shipper' : user.role === 'TRANSPORTER' ? '/transporter' : '/admin'
    : -1;

  return (
    <main className="mx-auto w-full max-w-5xl py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Account settings
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your contact information and account details.
            </p>
          </div>

          {/* Right-aligned Highway Truck Banner */}
          <div className="hidden sm:flex items-center justify-center h-20 w-52 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 p-1.5 overflow-hidden shadow-xs shrink-0 relative">
            <div className="absolute top-2 right-4 w-7 h-7 rounded-full bg-amber-300/80 blur-[1px]" />
            <div className="absolute top-4 right-8 w-12 h-3 rounded-full bg-white/40 blur-[0.5px]" />
            <svg
              viewBox="0 0 160 60"
              className="w-full h-full object-cover"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 38 Q30 24 65 34 T130 28 T160 36 V60 H0 Z" fill="#3B82F6" opacity="0.6" />
              <path d="M10 40 Q50 30 90 38 T160 34 V60 H0 Z" fill="#2563EB" opacity="0.8" />
              <path d="M20 60 L70 36 H90 L140 60 Z" fill="#334155" />
              <line x1="80" y1="38" x2="80" y2="44" stroke="#FDE047" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="80" y1="46" x2="80" y2="56" stroke="#FDE047" strokeWidth="2.5" strokeDasharray="4 4" />
              <g transform="translate(68, 30) scale(0.32)">
                <rect x="0" y="5" width="55" height="30" rx="2" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
                <line x1="18" y1="5" x2="18" y2="35" stroke="#E2E8F0" strokeWidth="1.5" />
                <line x1="36" y1="5" x2="36" y2="35" stroke="#E2E8F0" strokeWidth="1.5" />
                <path d="M55 12 H70 C73 12 76 14 78 18 L82 25 C83 27 84 29 84 31 V37 H55 V12 Z" fill="#2563EB" />
                <path d="M58 15 H68 C70 15 71 16 72 19 L75 25 H58 V15 Z" fill="#93C5FD" />
                <rect x="4" y="37" width="78" height="3" fill="#1E293B" />
                <circle cx="16" cy="40" r="6" fill="#1E293B" />
                <circle cx="16" cy="40" r="2.5" fill="#94A3B8" />
                <circle cx="44" cy="40" r="6" fill="#1E293B" />
                <circle cx="44" cy="40" r="2.5" fill="#94A3B8" />
                <circle cx="72" cy="40" r="6" fill="#1E293B" />
                <circle cx="72" cy="40" r="2.5" fill="#94A3B8" />
              </g>
            </svg>
          </div>
        </div>
      </header>

      {status?.tone === 'danger' && <Alert tone="danger">{status.text}</Alert>}

      {/* Card 1: Your Profile */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 flex justify-center">
            <ProfilePhotoCard
              avatar={avatar}
              userName={user.name}
              initials={initials}
              photoFile={photoFile}
              photoBusy={photoBusy}
              onChoosePhoto={choosePhoto}
              onSavePhoto={savePhoto}
            />
          </div>
          <div className="lg:col-span-8">
            <PersonalInformationCard
              profile={profile}
              email={user.email}
              errors={fieldErrors}
              busy={profileBusy}
              onChange={changeProfile}
              onLocationChange={changeLocation}
              onSave={saveProfile}
            />
          </div>
        </div>
      </section>

      {/* Card 2 & 3: Transporter specific cards */}
      {user.role === 'TRANSPORTER' && (
        <>
          <VehicleDetailsCard
            vehicle={vehicle}
            errors={vehicleErrors}
            hasVehicle={hasVehicle}
            isLoading={isLoadingVehicle}
            loadError={vehicleLoadError}
            busy={vehicleBusy}
            onChange={changeVehicle}
            onSave={saveVehicle}
            photoFile={vehiclePhotoFile}
            photoPreview={vehiclePhotoPreview}
            photoBusy={vehiclePhotoBusy}
            onChoosePhoto={chooseVehiclePhoto}
            onUploadPhoto={uploadSelectedVehiclePhoto}
            onClearPhoto={clearChosenVehiclePhoto}
          />
          <TransporterPreferencesCard
            availableDays={availableDays}
            preferredLoadTypes={preferredLoadTypes}
            busy={prefBusy}
            onDaysChange={setAvailableDays}
            onLoadTypesChange={setPreferredLoadTypes}
            onSave={savePreferences}
          />
        </>
      )}

      <div className="flex justify-start pt-2">
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="group inline-flex min-h-10 items-center gap-2 rounded-full border border-blue-200 bg-white px-5 text-sm font-semibold text-slate-900 transition-colors hover:border-blue-700 hover:bg-blue-700 hover:text-white cursor-pointer"
        >
          <img src="/chevron-left-solid-full.svg" alt="" aria-hidden="true" className="h-4 w-4 group-hover:brightness-0 group-hover:invert" />
          Back
        </button>
      </div>
    </main>
  );
}
