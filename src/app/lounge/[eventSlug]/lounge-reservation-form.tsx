'use client';

import { useActionState, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ActionState } from '@/lib/definitions';
import { LoungeLayoutData, LoungeAvailabilityEntry } from '@/lib/lounge-layout';
import { createLoungeReservation } from './actions';

const inputClasses =
  'mt-1 block w-full rounded-lg border border-[--color-border] bg-[--color-surface-2] px-4 py-3 text-[--color-text-primary] placeholder:text-[--color-text-muted] transition-colors focus:outline-none focus:border-[--color-accent] focus:ring-1 focus:ring-[--color-accent]/30 disabled:opacity-60';
const labelClasses = 'text-sm font-medium text-[--color-text-secondary]';

// Status → fill colour for reserved boxes
const STATUS_FILL: Record<string, string> = {
  PENDING: '#78350f',
  CONFIRMED: '#1e3a5f',
  ARRIVED: '#14532d',
  CANCELLED: '#374151',
};

type FloorPlanProps = {
  layout: LoungeLayoutData;
  availability: LoungeAvailabilityEntry[];
  selected: Set<number>;
  onToggle: (number: number) => void;
  disabled: boolean;
};

function FloorPlan({ layout, availability, selected, onToggle, disabled }: FloorPlanProps) {
  const [tooltip, setTooltip] = useState<{ number: number; label: string; minConsumation: number | null } | null>(null);

  const availMap = new Map(availability.map((a) => [a.number, a.status]));

  return (
    <div className="relative w-full overflow-x-auto rounded-lg border border-[--color-border] bg-[--color-surface-2] p-2">
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="w-full"
        style={{ maxHeight: '420px' }}
      >
        {layout.boxes.map((box) => {
          const reservedStatus = availMap.get(box.number);
          const isReserved = !!reservedStatus;
          const isSelected = selected.has(box.number);
          const isRect = box.shape !== 'circle';

          let fill = '#1f2937'; // default muted
          if (isSelected) fill = 'var(--color-accent, #6366f1)';
          else if (isReserved) fill = STATUS_FILL[reservedStatus] ?? '#374151';

          const strokeColor = isSelected ? '#a5b4fc' : '#4b5563';
          const strokeWidth = isSelected ? 3 : 1.5;

          const handleClick = () => {
            if (disabled || isReserved) return;
            onToggle(box.number);
          };

          return (
            <g
              key={box.id}
              style={{ cursor: disabled || isReserved ? 'default' : 'pointer' }}
              onClick={handleClick}
              onMouseEnter={() => setTooltip({ number: box.number, label: box.label, minConsumation: box.minConsumation })}
              onMouseLeave={() => setTooltip(null)}
            >
              {isRect ? (
                <rect
                  x={box.x}
                  y={box.y}
                  width={box.width}
                  height={box.height}
                  rx={6}
                  fill={fill}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  opacity={isReserved && !isSelected ? 0.7 : 1}
                />
              ) : (
                <ellipse
                  cx={box.x + box.width / 2}
                  cy={box.y + box.height / 2}
                  rx={box.width / 2}
                  ry={box.height / 2}
                  fill={fill}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  opacity={isReserved && !isSelected ? 0.7 : 1}
                />
              )}
              <text
                x={box.x + box.width / 2}
                y={box.y + box.height / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={Math.min(box.width, box.height) * 0.28}
                fill={isReserved && !isSelected ? '#9ca3af' : '#f9fafb'}
                fontWeight="600"
                pointerEvents="none"
              >
                {box.label}
              </text>
            </g>
          );
        })}
      </svg>

      {tooltip && (
        <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-lg border border-[--color-border] bg-[--color-surface] px-3 py-2 text-xs text-[--color-text-primary] shadow-lg">
          <span className="font-semibold">{tooltip.label}</span>
          {tooltip.minConsumation != null && (
            <span className="ml-2 text-[--color-text-muted]">
              Min. CHF {tooltip.minConsumation.toFixed(2)}
            </span>
          )}
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-3 text-xs text-[--color-text-muted]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-[#1f2937]" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: 'var(--color-accent, #6366f1)' }} /> Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-[#1e3a5f]" /> Confirmed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-[#78350f]" /> Pending
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-[#14532d]" /> Arrived
        </span>
      </div>
    </div>
  );
}

export default function LoungeReservationForm({
  eventSlug,
  loungeNumberOptions,
  layout,
  availability,
}: {
  eventSlug: string;
  loungeNumberOptions: number[];
  layout: LoungeLayoutData | null;
  availability: LoungeAvailabilityEntry[];
}) {
  const createWithSlug = createLoungeReservation.bind(null, eventSlug);
  const [state, dispatch, isPending] = useActionState<ActionState, FormData>(createWithSlug, null);
  const [selectedLounges, setSelectedLounges] = useState<Set<number>>(new Set());

  const toggleLounge = (number: number) => {
    setSelectedLounges((prev) => {
      const next = new Set(prev);
      if (next.has(number)) next.delete(number);
      else next.add(number);
      return next;
    });
  };

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
        {layout && layout.boxes.length > 0 ? (
          <>
            <p className={labelClasses}>Lounge * (tap to select)</p>
            <div className="mt-2">
              <FloorPlan
                layout={layout}
                availability={availability}
                selected={selectedLounges}
                onToggle={toggleLounge}
                disabled={isPending}
              />
            </div>
            {/* Hidden inputs for selected lounges */}
            {Array.from(selectedLounges).map((n) => (
              <input key={n} type="hidden" name="loungeNumbers" value={n} />
            ))}
          </>
        ) : (
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
        )}
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
