import { Button, Card } from "../../../shared/components/index.js";

export function ProfilePhotoCard({
  avatar,
  userName,
  initials,
  photoFile,
  photoBusy,
  onChoosePhoto,
  onSavePhoto,
}) {
  return (
    <Card className="grid justify-items-center gap-4 p-5 text-center md:col-span-1">
      <h2 className="m-0 text-base font-bold text-slate-900">Profile Photo</h2>
      <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-slate-100 text-2xl font-bold text-blue-700">
        {avatar ? (
          <img
            className="h-full w-full object-cover"
            src={avatar}
            alt={`${userName} profile`}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <p className="m-0 text-sm text-slate-500">
        JPEG, PNG, or WebP, up to 5 MB.
      </p>
      <form onSubmit={onSavePhoto} className="grid w-full gap-3">
        <label
          className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          htmlFor="profile-photo"
        >
          Choose Photo
        </label>
        <input
          className="sr-only"
          id="profile-photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onChoosePhoto}
        />
        {photoFile && (
          <p className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-slate-500">
            {photoFile.name}
          </p>
        )}
        <Button type="submit" disabled={!photoFile || photoBusy}>
          {photoBusy ? "Uploading…" : "Upload Photo"}
        </Button>
      </form>
    </Card>
  );
}
