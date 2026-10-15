import { Button, Card, Input } from "../../../shared/components/index.js";
import { ProfileField } from "./ProfileField.jsx";
import { CityLocationPicker } from "./CityLocationPicker.jsx";

export function PersonalInformationCard({
  profile,
  email,
  errors,
  busy,
  onChange,
  onLocationChange,
  onSave,
}) {
  return (
    <Card className="grid gap-4 p-5 md:col-span-2">
      <h2 className="m-0 text-base font-bold text-slate-900">
        Personal Information
      </h2>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSave} noValidate>
        <ProfileField id="profile-name" label="Full Name" error={errors.name}>
          <Input
            id="profile-name"
            name="name"
            autoComplete="name"
            value={profile.name}
            onChange={onChange}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "profile-name-error" : undefined}
          />
        </ProfileField>
        <ProfileField
          id="profile-email"
          label="Email Address"
          helperText="Email address cannot be changed here."
        >
          <Input id="profile-email" type="email" value={email} disabled />
        </ProfileField>
        <ProfileField
          id="profile-phone"
          label="Phone Number"
          error={errors.phone}
        >
          <Input
            id="profile-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={profile.phone}
            onChange={onChange}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "profile-phone-error" : undefined}
          />
        </ProfileField>
        <CityLocationPicker
          city={profile.city}
          zone={profile.zone}
          region={profile.region}
          error={errors.city || errors.location}
          onChange={onLocationChange}
        />
        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
