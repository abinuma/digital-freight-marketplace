import {
  Alert,
  Badge,
  Button,
  Card,
  Skeleton,
} from "../../../shared/components/index.js";
import { dateLabel, money } from "../../shipments/shipmentFormatters.js";
import { PreviewableImage } from "../../../shared/components/PreviewableImage.jsx";

const tones = { PENDING: "warning", ACCEPTED: "success", DECLINED: "danger" };

export function ShipperBidsPanel({
  bids,
  bidsQuery,
  profiles,
  shipment,
  onAccept,
  onDecline,
}) {
  return (
          <Card className="grid gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="m-0 text-base font-semibold text-slate-900">
                  Transporter bids
                </h2>
                <p className="mb-0 mt-1 text-sm text-slate-500">
                  Offers received for this shipment.
                </p>
              </div>
              <span className="grid h-8 min-w-8 place-items-center rounded-full bg-slate-100 px-2 text-sm font-bold text-blue-700">
                {bidsQuery.data?.length ?? "—"}
              </span>
            </div>
            {bidsQuery.isPending ? (
              <div className="grid gap-3">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
              </div>
            ) : bidsQuery.isError ? (
              <Alert tone="danger">{bidsQuery.error.message}</Alert>
            ) : !bids.length ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <span className="text-2xl text-slate-400" aria-hidden="true">
                  ◇
                </span>
                <h3 className="m-0 text-base font-semibold text-slate-800">
                  No bids yet
                </h3>
                <p className="m-0 text-sm text-slate-500">
                  Transporter offers will appear here.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {bids.map((bid) => {
                  const profile = profiles.get(bid.transporterId);
                  const name = profile?.name || "Transporter";
                  return (
                    <article
                      className="grid gap-3 rounded-lg border border-slate-200 p-4"
                      key={bid.id}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100 text-sm font-bold text-blue-700">
                            {profile?.profilePhoto ? (
                              <PreviewableImage
                                className="h-full w-full object-cover"
                                src={profile.profilePhoto}
                                alt=""
                              />
                            ) : (
                              name.slice(0, 1).toUpperCase()
                            )}
                          </span>
                          <div className="grid min-w-0 gap-0.5">
                            <strong className="truncate text-sm text-slate-800">
                              {name}
                            </strong>
                            {profile?.averageRating > 0 && (
                              <small className="text-xs text-slate-500">
                                <span className="text-amber-500" aria-hidden="true">★</span> {Number(profile.averageRating).toFixed(1)} ({profile.reviewCount || 0} {(profile.reviewCount || 0) === 1 ? 'review' : 'reviews'})
                              </small>
                            )}
                          </div>
                        </div>
                        <Badge tone={tones[bid.status]}>{bid.status}</Badge>
                      </div>
                      <strong className="text-lg font-bold text-slate-900">
                        {money(bid.price)}
                      </strong>
                      <div className="grid gap-1 border-t border-slate-100 pt-3 text-sm">
                        <span className="text-xs text-slate-500">
                          Pickup offer
                        </span>
                        <strong className="text-slate-800">
                          {dateLabel(bid.pickupDate)}
                        </strong>
                      </div>
                      {bid.message && (
                        <p className="m-0 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {bid.message}
                        </p>
                      )}
                      {bid.declineReason && (
                        <p className="m-0 text-sm text-slate-500">
                          Reason: {bid.declineReason}
                        </p>
                      )}
                      {bid.status === "PENDING" &&
                        shipment.status === "PUBLISHED" && (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() => onAccept(bid)}
                            >
                              Accept bid
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => onDecline(bid)}
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                    </article>
                  );
                })}
              </div>
            )}
          </Card>
  );
}
