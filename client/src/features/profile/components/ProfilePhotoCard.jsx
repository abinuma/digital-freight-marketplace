import { PreviewableImage } from "../../../shared/components/PreviewableImage.jsx";

export function ProfilePhotoCard({
  avatar,
  userName,
  photoFile,
  onChoosePhoto,
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
      <div className="flex flex-col items-center w-full mt-4">
        <input
          className="sr-only"
          id="profile-photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onChoosePhoto}
        />

        <label
          htmlFor="profile-photo"
          className="inline-flex items-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 cursor-pointer shadow-xs transition-colors"
        >
          Choose Photo
        </label>

        {photoFile && (
          <p className="mt-2 text-xs text-slate-500 max-w-[200px] truncate">
            {photoFile.name}
          </p>
        )}
      </div>
    </div>
  );
}
