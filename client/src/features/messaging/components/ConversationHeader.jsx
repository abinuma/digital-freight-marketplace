import { initials } from '../messaging.formatters.js';
import { PreviewableImage } from '../../../shared/components/PreviewableImage.jsx';
import { useState } from 'react';
import { Modal } from '../../../shared/components/Modal.jsx';

export function ConversationHeader({
  conversation,
  profile,
  bidsCount = 0,
  onOpenBids,
  onBack,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const counterpart = conversation?.counterpart;
  const photo = profile?.profilePhoto || profile?.image || counterpart?.profilePhoto || counterpart?.image;
  const name = profile?.name || counterpart?.name || 'User';
  const city = profile?.city || profile?.location || counterpart?.city || counterpart?.location;
  const phone = profile?.phone || counterpart?.phone;

  return (
    <header className="flex min-h-14 items-center justify-between gap-2 border-b border-slate-200 py-2 sm:min-h-16">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="group inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-blue-200 bg-white px-2.5 text-xs font-semibold text-slate-900 transition-colors hover:border-blue-700 hover:bg-blue-700 hover:text-white md:hidden"
            aria-label="Back to conversations list"
          >
            <img src="/chevron-left-solid-full.svg" alt="" aria-hidden="true" className="h-3.5 w-3.5 group-hover:brightness-0 group-hover:invert" />
            Back
          </button>
        )}
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-0 bg-indigo-100 p-0 text-xs font-bold text-blue-700 hover:ring-2 hover:ring-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 sm:h-10 sm:w-10 sm:text-sm"
          aria-label={`View ${name}'s profile details`}
        >
          {photo ? <img className="h-full w-full object-cover" src={photo} alt="" /> : initials(name)}
        </button>
        <div className="grid min-w-0 gap-0.5">
          <strong className="truncate text-sm font-semibold text-slate-900 sm:text-base">
            {name}
          </strong>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenBids}
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 hover:text-blue-800 lg:hidden"
          aria-label={`View ${bidsCount} bids for this conversation`}
        >
          <span aria-hidden="true">🏷️</span>
          <span className="hidden xs:inline sm:inline">Bids</span>
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-blue-700 px-1 text-[11px] font-bold text-white">
            {bidsCount}
          </span>
        </button>
      </div>
      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="Contact details" className="max-w-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-2xl font-bold text-blue-700">
            {photo ? (
              <PreviewableImage className="h-full w-full object-cover" src={photo} alt={`${name} profile photo`} />
            ) : initials(name)}
          </span>
          <div className="grid gap-2">
            <strong className="text-lg text-slate-900">{name}</strong>
            <span className="text-sm text-slate-600">{city || 'City not provided'}</span>
            {phone ? (
              <a className="text-sm font-semibold text-blue-700 hover:underline" href={`tel:${phone}`}>{phone}</a>
            ) : (
              <span className="text-sm text-slate-500">Phone number not provided</span>
            )}
          </div>
        </div>
      </Modal>
    </header>
  );
}
