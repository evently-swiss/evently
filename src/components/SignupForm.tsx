'use client';

import { useActionState, useMemo, useState } from 'react';
import { AlertCircle, Loader2, Minus, Plus } from 'lucide-react';
import { signupGuest } from '@/app/s/[slug]/actions';
import { SignupLink } from '@prisma/client';
import { ActionState } from '@/lib/definitions';

function getMessageVariant(message: string): 'warning' | 'destructive' | 'neutral' {
  const lower = message.toLowerCase();

  if (lower.includes('full') || lower.includes('closed') || lower.includes('failed')) {
    return 'destructive';
  }

  if (lower.includes('already')) {
    return 'warning';
  }

  return 'neutral';
}

export default function SignupForm({ link }: { link: SignupLink }) {
  const signupWithSlug = signupGuest.bind(null, link.slug);
  const [state, dispatch, isPending] = useActionState<ActionState, FormData>(signupWithSlug, null);
  const [plusOnes, setPlusOnes] = useState(0);

  const maxPlusOnes = Math.max(0, link.maxPlusOnesPerSignup);
  const canDecrease = plusOnes > 0;
  const canIncrease = plusOnes < maxPlusOnes;

  const inputClasses =
    'mt-1 block w-full rounded-lg border border-[--color-border] bg-[--color-surface-2] px-4 py-3 text-[--color-text-primary] placeholder:text-[--color-text-muted] transition-colors focus:outline-none focus:border-[--color-accent] focus:ring-1 focus:ring-[--color-accent]/30 disabled:opacity-60';
  const labelClasses = 'text-sm font-medium text-[--color-text-secondary]';

  const messageVariant = useMemo(() => {
    if (!state?.message) {
      return null;
    }

    return getMessageVariant(state.message);
  }, [state?.message]);

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
            aria-required="true"
            disabled={isPending}
            className={inputClasses}
            placeholder="John"
          />
          {state?.errors?.firstName && (
            <p className="mt-1 text-sm text-[--color-destructive]" role="alert" aria-live="polite">
              <AlertCircle className="mr-1 inline h-3.5 w-3.5" />
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
            aria-required="true"
            disabled={isPending}
            className={inputClasses}
            placeholder="Doe"
          />
          {state?.errors?.lastName && (
            <p className="mt-1 text-sm text-[--color-destructive]" role="alert" aria-live="polite">
              <AlertCircle className="mr-1 inline h-3.5 w-3.5" />
              {state.errors.lastName[0]}
            </p>
          )}
        </div>
      </div>

      {link.emailMode !== 'HIDDEN' && (
        <div>
          <label htmlFor="email" className={labelClasses}>
            Email {link.emailMode === 'REQUIRED' ? '*' : '(optional)'}
          </label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            name="email"
            id="email"
            required={link.emailMode === 'REQUIRED'}
            aria-required={link.emailMode === 'REQUIRED'}
            disabled={isPending}
            className={inputClasses}
            placeholder="john@example.com"
          />
          {state?.errors?.email && (
            <p className="mt-1 text-sm text-[--color-destructive]" role="alert" aria-live="polite">
              <AlertCircle className="mr-1 inline h-3.5 w-3.5" />
              {state.errors.email[0]}
            </p>
          )}
        </div>
      )}

      {link.phoneMode !== 'HIDDEN' && (
        <div>
          <label htmlFor="phone" className={labelClasses}>
            Phone {link.phoneMode === 'REQUIRED' ? '*' : '(optional)'}
          </label>
          <div className="mt-1 flex overflow-hidden rounded-lg border border-[--color-border] bg-[--color-surface-2]">
            <span
              className="inline-flex items-center border-r border-[--color-border] px-3 text-sm text-[--color-text-secondary]"
              aria-label="Country code: Switzerland +41"
            >
              +41
            </span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              name="phone"
              id="phone"
              required={link.phoneMode === 'REQUIRED'}
              aria-required={link.phoneMode === 'REQUIRED'}
              disabled={isPending}
              className="w-full border-0 bg-transparent px-4 py-3 text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:ring-1 focus:ring-[--color-accent]/30"
              placeholder="79 123 45 67"
            />
          </div>
          {state?.errors?.phone && (
            <p className="mt-1 text-sm text-[--color-destructive]" role="alert" aria-live="polite">
              <AlertCircle className="mr-1 inline h-3.5 w-3.5" />
              {state.errors.phone[0]}
            </p>
          )}
        </div>
      )}

      {maxPlusOnes > 0 && (
        <div>
          <label htmlFor="plusOnes" className={labelClasses}>
            Bringing guests?
          </label>
          <p className="mt-0.5 text-xs text-[--color-text-muted]">Including yourself</p>
          <input type="hidden" id="plusOnes" name="plusOnes" value={plusOnes} />
          <div className="mt-2 flex items-center gap-3" aria-label="Number of guests">
            <button
              type="button"
              onClick={() => setPlusOnes((current) => Math.max(0, current - 1))}
              disabled={!canDecrease || isPending}
              aria-label="decrease"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[--color-border] text-[--color-text-secondary] transition-colors hover:border-[--color-border-strong] hover:text-[--color-text-primary] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-xl font-semibold text-[--color-text-primary]">{plusOnes}</span>
            <button
              type="button"
              onClick={() => setPlusOnes((current) => Math.min(maxPlusOnes, current + 1))}
              disabled={!canIncrease || isPending}
              aria-label="increase"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[--color-border] text-[--color-text-secondary] transition-colors hover:border-[--color-border-strong] hover:text-[--color-text-primary] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {link.allowNotes && (
        <div>
          <label htmlFor="note" className={labelClasses}>
            Note (optional)
          </label>
          <textarea
            name="note"
            id="note"
            rows={2}
            disabled={isPending}
            className={`${inputClasses} resize-none`}
            placeholder="Any special requests or notes..."
          />
        </div>
      )}

      {state?.message && messageVariant && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            messageVariant === 'warning'
              ? 'border-[--color-warning]/30 bg-[--color-warning]/10 text-[--color-warning]'
              : messageVariant === 'destructive'
                ? 'border-[--color-destructive]/30 bg-[--color-destructive]/10 text-[--color-destructive]'
                : 'border-[--color-border] bg-[--color-surface-2] text-[--color-text-primary]'
          }`}
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
        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Request access ->'}
      </button>

      <p className="text-center text-xs text-[--color-text-muted]">
        Already signed up? Check your invite status below.
      </p>
    </form>
  );
}
