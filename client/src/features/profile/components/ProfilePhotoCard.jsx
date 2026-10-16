import { PreviewableImage } from "../../../shared/components/PreviewableImage.jsx";

export function ProfilePhotoCard({
  avatar,
  userName,
  photoFile,
  photoBusy,
  onChoosePhoto,
  onSavePhoto,
}) {
  return (
    <div className="flex flex-col items-center text-center w-full py-2">
      <div className="relative">
        <div className="h-32 w-32 rounded-full overflow-hidden bg-blue-500 shadow-inner flex items-center justify-center text-white border-4 border-white shadow-sm">
          {avatar ? (
            <PreviewableImage
              className="h-full w-full object-cover"
              src={avatar}
              alt={`${userName || 'User'} profile`}
            />
          ) : (
            <img
              src="/user-solid-full.svg"
              alt="Default avatar"
              className="h-20 w-20 text-white invert brightness-0 opacity-95"
            />
          )}
        </div>
        <label
          htmlFor="profile-photo"
          className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
          title="Choose photo"
        >
          <img
            src="/camera-solid-full.svg"
            alt="Camera"
            className="h-4 w-4"
            style={{
              filter:
                'invert(27%) sepia(85%) saturate(2250%) hue-rotate(213deg) brightness(96%) contrast(96%)',
            }}
          />
        </label>
      </div>

      <h3 className="m-0 mt-4 text-sm font-bold text-slate-900">Profile Photo</h3>
      <p className="m-0 mt-1 text-xs text-slate-400">JPEG, PNG, or WebP, up to 5 MB.</p>

      <form onSubmit={onSavePhoto} className="flex flex-col items-center w-full mt-4">
        <input
          className="sr-only"
          id="profile-photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onChoosePhoto}
        />

        <div className="flex items-center gap-2.5">
          <label
            htmlFor="profile-photo"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 cursor-pointer shadow-xs transition-colors"
          >
            <svg
              className="w-3.5 h-3.5 stroke-current"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2.5"
            >
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Choose Photo
          </label>

          <button
            type="submit"
            disabled={!photoFile || photoBusy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-3.5 h-3.5 stroke-blue-600"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2.5"
            >
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {photoBusy ? 'Uploading…' : 'Upload Photo'}
          </button>
        </div>

        {photoFile && (
          <p className="mt-2 text-xs text-slate-500 max-w-[200px] truncate">
            {photoFile.name}
          </p>
        )}
      </form>
    </div>
  );
}
