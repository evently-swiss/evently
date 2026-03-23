'use client';

import { useActionState } from 'react';
import { Loader2 } from 'lucide-react';
import { ActionState } from '@/lib/definitions';
import { createLoungeReservation } from './actions';

const inputClasses =
  'mt-1 block w-full rounded-lg border border-[--color-border] bg-[--color-surface-2] px-4 py-3 text-[--color-text-primary] placeholder:text-[--color-text-muted] transition-colors focus:outline-none focus:border-[--color-accent] focus:ring-1 focus:ring-[--color-accent]/30 disabled:opacity-60';
const labelClasses = 'text-sm font-medium text-[--color-text-secondary]';

export default function LoungeReservationForm({
  eventSlug,
  loungeNumberOptions,
}: {
  eventSlug: string;
  loungeNumberOptions: number[];
}) {
  const createWithSlug = createLoungeReservation.bind(null, eventSlug);
  const [state, dispatch, isPending] = useActionState<ActionState, FormData>(createWithSlug, null);

  return (
    <form action={dispatch} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
        <div>
          <label htmlFor="firstName" className={labelClasses}>
            First name *
          </label>
          <input
            type="text"
            name="firstName"
            id="firstName"
            required
            disabled={isPending}
            className={inputClasses}
            placeholder="Jane"
          />
          {state?.errors?.firstName && (
            <p className="mt-1 text-sm text-[--color-destructive]" role="alert">
              {state.errors.firstName[0]}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className={labelClasses}>
            Last name *
          </label>
          <input
            type="text"
            name="lastName"
            id="lastName"
            required
            disabled={isPending}
            className={inputClasses}
            placeholder="Doe"
          />
          {state?.errors?.lastName && (
            <p className="mt-1 text-sm text-[--color-destructive]" role="alert">
              {state.errors.lastName[0]}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="phone" className={labelClasses}>
          Phone *
        </label>
        <div className="mt-1 flex overflow-hidden rounded-lg border border-[--color-border] bg-[--color-surface-2]">
          <span className="inline-flex items-center border-r border-[--color-border] px-3 text-sm text-[--color-text-secondary]">
            +41
          </span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            name="phone"
            id="phone"
            required
            disabled={isPending}
            className="w-full border-0 bg-transparent px-4 py-3 text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:ring-1 focus:ring-[--color-accent]/30"
            placeholder="79 123 45 67"
          />
        </div>
        {state?.errors?.phone && (
          <p className="mt-1 text-sm text-[--color-destructive]" role="alert">
            {state.errors.phone[0]}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
        <div>
          <label htmlFor="arrivalTime" className={labelClasses}>
            Arrival time *
          </label>
          <input
            type="time"
            name="arrivalTime"
            id="arrivalTime"
            required
            disabled={isPending}
            className={inputClasses}
          />
          {state?.errors?.arrivalTime && (
            <p className="mt-1 text-sm text-[--color-destructive]" role="alert">
              {state.errors.arrivalTime[0]}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="numberOfGuests" className={labelClasses}>
            Number of guests *
          </label>
          <input
            type="number"
            min={1}
            max={30}
            step={1}
            name="numberOfGuests"
            id="numberOfGuests"
            required
            disabled={isPending}
            className={inputClasses}
            defaultValue={1}
          />
          {state?.errors?.numberOfGuests && (
            <p className="mt-1 text-sm text-[--color-destructive]" role="alert">
              {state.errors.numberOfGuests[0]}
            </p>
          )}
        </div>
      </div>

      <div>
        <fieldset>
          <legend className={labelClasses}>Lounge number * (select one or more)</legend>
          <div className="mt-2 grid grid-cols-3 gap-2 min-[420px]:grid-cols-4">
            {loungeNumberOptions.map((number) => (
              <label
                key={number}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-[--color-border] bg-[--color-surface-2] px-3 py-2 text-sm text-[--color-text-primary]"
              >
                <input
                  type="checkbox"
                  name="loungeNumbers"
                  value={number}
                  disabled={isPending}
                  className="h-4 w-4"
                />
                <span>{number}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {state?.errors?.loungeNumbers && (
          <p className="mt-1 text-sm text-[--color-destructive]" role="alert">
            {state.errors.loungeNumbers[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="comments" className={labelClasses}>
          Comments (optional)
        </label>
        <textarea
          name="comments"
          id="comments"
          rows={3}
          maxLength={500}
          disabled={isPending}
          className={`${inputClasses} resize-none`}
          placeholder="Any requests or notes for the venue"
        />
        {state?.errors?.comments && (
          <p className="mt-1 text-sm text-[--color-destructive]" role="alert">
            {state.errors.comments[0]}
          </p>
        )}
      </div>

      {state?.message && (
        <div
          className="rounded-xl border border-[--color-destructive]/30 bg-[--color-destructive]/10 p-4 text-sm text-[--color-destructive]"
          role="alert"
          aria-live="polite"
        >
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[--color-accent] px-5 text-base font-semibold text-black transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Submit lounge request'}
      </button>
    </form>
  );
}
