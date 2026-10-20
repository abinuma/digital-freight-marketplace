import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Card, Spinner, Textarea, useSuccessToast } from '../../../shared/components/index.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { createShipmentReview, listShipmentReviews } from '../review.api.js'

export function ShipmentReviews({ shipmentId, canReview }) {
  const { user } = useAuth()
  const showSuccess = useSuccessToast()
  const cache = useQueryClient()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const query = useQuery({ queryKey: ['shipment', shipmentId, 'reviews'], queryFn: () => listShipmentReviews(shipmentId) })
  const reviews = query.data?.reviews || []
  const ownReview = reviews.find((review) => review.reviewerId === user?.id)

  async function submit(event) {
    event.preventDefault()
    if (!rating) {
      setError('Choose a rating from 1 to 5 stars.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const review = await createShipmentReview({ shipmentId, rating, comment })
      setRating(0)
      setComment('')
      await Promise.all([
        cache.invalidateQueries({ queryKey: ['shipment', shipmentId, 'reviews'] }),
        cache.invalidateQueries({ queryKey: ['users'] }),
        cache.invalidateQueries({ queryKey: ['shipper', 'transporterProfile', review.revieweeId] }),
        cache.invalidateQueries({ queryKey: ['messages', 'counterpart-profile', review.revieweeId] }),
      ])
      showSuccess('Review submitted')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className={`     grid gap-5 p-5 shipper-detail-card content-start shipment-reviews`}>
      <div className={`flex items-center justify-between gap-4         max-md:items-start max-md:flex-col shipper-panel__heading`}><div><h2>Shipment reviews</h2><p>Feedback shared by the people who completed this delivery.</p></div></div>
      {query.isError && <Alert tone="danger" title="Reviews unavailable">{query.error.message}</Alert>}
      {reviews.map((review) => <article className={`grid gap-1.5 py-3 px-0 border-t      shipment-review`} key={review.id}><div className={`flex items-center justify-between gap-4 text-slate-500 text-sm    max-md:items-start max-md:flex-col max-md:gap-1 shipment-review__heading`}><strong>{review.reviewer?.name || 'Marketplace member'}</strong><span aria-label={`${review.rating} out of 5 stars`}><span className="text-amber-500">{'★'.repeat(review.rating)}</span><span className="text-slate-300">{'☆'.repeat(5 - review.rating)}</span></span></div>{review.comment && <p>{review.comment}</p>}</article>)}
      {!query.isPending && canReview && !ownReview && !query.isError && <form className={`grid gap-3 pt-4 border-t          shipment-review-form`} onSubmit={submit}>
        <h3>Leave feedback</h3>
        <fieldset className={`grid gap-1.5 m-0 p-0 border-0               shipment-review-rating`}><legend>Your rating <i>*</i></legend><div role="radiogroup" aria-label="Your rating">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`} className={`transition-transform hover:scale-110 hover:text-amber-500 ${value <= rating ? 'text-amber-500' : 'text-slate-300'}`} onClick={() => setRating(value)}>★</button>)}</div></fieldset>
        <label className={`grid content-start gap-1.5 text-slate-500 text-sm font-bold                    shipper-field`}><span>Comment <small>Optional</small></span><Textarea maxLength={2000} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Share how the delivery went" /></label>
        {error && <Alert tone="danger">{error}</Alert>}
        <Button type="submit" disabled={saving}>{saving ? <><Spinner /> Submitting…</> : 'Submit review'}</Button>
      </form>}
      {!query.isPending && canReview && ownReview && <p className="m-0 border-t border-slate-200 pt-3 text-sm font-medium text-emerald-700">You have already reviewed this shipment.</p>}
      {!query.isPending && !canReview && reviews.length === 0 && <p className={`m-0 text-slate-500 text-sm leading-normal whitespace-pre-wrap shipment-review-empty`}>Reviews will appear here after the shipment participants leave feedback.</p>}
    </Card>
  )
}
