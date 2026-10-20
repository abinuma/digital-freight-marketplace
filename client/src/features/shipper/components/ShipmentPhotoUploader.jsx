import { useEffect, useMemo, useState } from "react";
import { PreviewableImage } from "../../../shared/components/PreviewableImage.jsx";

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

export function ShipmentPhotoUploader({
  existingImages = [],
  files,
  onFilesChange,
  onError,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputId = "shipment-cargo-photo";
  const isPhotoPresent = existingImages.length + files.length >= 1;
  const stagedFiles = useMemo(
    () => files.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(
    () => () =>
      stagedFiles.forEach(({ preview }) => URL.revokeObjectURL(preview)),
    [stagedFiles],
  );

  function addFiles(selectedFiles, input) {
    const selected = Array.from(selectedFiles || []);
    if (!selected.length) return;
    if (
      selected.some(
        (file) =>
          !allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024,
      )
    ) {
      onError("Images must be JPEG, PNG, or WebP files up to 5 MB each.");
      if (input) input.value = "";
      return;
    }
    if (selected.length > 1 || existingImages.length + files.length + selected.length > 1) {
      onError("A shipment can include one cargo photo.");
      if (input) input.value = "";
      return;
    }
    onError("");
    onFilesChange([...files, ...selected]);
    if (input) input.value = "";
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    if (isPhotoPresent) return;
    addFiles(event.dataTransfer.files);
  }

  return (
    <div className="grid gap-2 text-sm font-medium text-slate-700">
      <label
        htmlFor={inputId}
        className={`grid min-h-28 place-items-center gap-3 rounded-lg border-2 border-dashed p-4 text-center transition-colors ${isPhotoPresent ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400" : `cursor-pointer ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"}`}`}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!isPhotoPresent) setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (isPhotoPresent) setIsDragging(false);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setIsDragging(false);
        }}
        onDrop={handleDrop}
      >
        <span className={`font-semibold ${isPhotoPresent ? "text-slate-400" : "text-slate-700"}`}>Drop photo here</span>
        <input
          id={inputId}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => addFiles(event.target.files, event.target)}
          disabled={isPhotoPresent}
        />
        <span className={`rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors ${isPhotoPresent ? "bg-slate-400" : "bg-blue-700 hover:bg-blue-800"}`}>
          Choose photo
        </span>
      </label>
      {(existingImages.length > 0 || stagedFiles.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {existingImages.map((image) => (
            <PreviewableImage
              className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
              key={image.id}
              src={image.url}
              alt="Existing shipment"
            />
          ))}
          {stagedFiles.map(({ file, preview }, index) => (
            <div className="relative" key={`${file.name}-${index}`}>
              <PreviewableImage
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
