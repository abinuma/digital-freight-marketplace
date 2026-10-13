import { useEffect, useMemo } from "react";

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

export function ShipmentPhotoUploader({
  existingImages = [],
  files,
  onFilesChange,
  onError,
}) {
  const stagedFiles = useMemo(
    () => files.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(
    () => () =>
      stagedFiles.forEach(({ preview }) => URL.revokeObjectURL(preview)),
    [stagedFiles],
  );

  function addFiles(event) {
    const selected = Array.from(event.target.files || []);
    if (
      selected.some(
        (file) =>
          !allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024,
      )
    ) {
      onError("Images must be JPEG, PNG, or WebP files up to 5 MB each.");
      event.target.value = "";
      return;
    }
    if (existingImages.length + files.length + selected.length > 5) {
      onError("A shipment can include up to five images.");
      event.target.value = "";
      return;
    }
    onError("");
    onFilesChange([...files, ...selected]);
    event.target.value = "";
  }

  return (
    <div className="grid gap-2 text-sm font-medium text-slate-700">
      <div>
        <span>Shipment photos</span>
        <p className="mb-0 mt-1 text-xs font-normal text-slate-500">
          Optional · JPEG, PNG or WebP · 5 MB each · up to 5 photos
        </p>
      </div>
      <label className="grid min-h-28 cursor-pointer place-items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center hover:border-blue-400 hover:bg-blue-50">
        <span className="text-2xl text-blue-700" aria-hidden="true">
          ＋
        </span>
        <span className="font-semibold text-slate-700">Choose photos</span>
        <span className="text-xs text-slate-500">
          {existingImages.length + files.length} of 5 selected
        </span>
        <input
          className="w-full max-w-sm text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-700 file:px-3 file:py-2 file:font-semibold file:text-white"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={addFiles}
          disabled={existingImages.length + files.length >= 5}
        />
      </label>
      {(existingImages.length > 0 || stagedFiles.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {existingImages.map((image) => (
            <img
              className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
              key={image.id}
              src={image.url}
              alt="Existing shipment"
            />
          ))}
          {stagedFiles.map(({ file, preview }, index) => (
            <div className="relative" key={`${file.name}-${index}`}>
              <img
                className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                src={preview}
                alt={file.name}
              />
              <button
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-slate-900 text-white transition-colors hover:bg-red-700"
                type="button"
                onClick={() =>
                  onFilesChange(files.filter((_, fileIndex) => fileIndex !== index))
                }
                aria-label={`Remove ${file.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
