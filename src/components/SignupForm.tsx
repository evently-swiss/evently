'use client';

import { useActionState } from 'react';
import { signupGuest } from '@/app/s/[slug]/actions';
import { SignupLink, Event } from '@prisma/client';
import { Select } from '@/components/ui/Select';

import { ActionState } from '@/lib/definitions';

export default function SignupForm({ link, event }: { link: SignupLink, event: Event }) {
    const signupWithSlug = signupGuest.bind(null, link.slug);
    const [state, dispatch, isPending] = useActionState<ActionState, FormData>(signupWithSlug, null);

    const accentColor = event.accentColor || '#4f46e5'; // Default indigo-600

    const inputClasses = "mt-1 block w-full rounded-lg border border-white/10 bg-white/5 text-white placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:bg-white/10 sm:text-sm p-3 transition-all duration-200 backdrop-blur-sm";
    const labelClasses = "block text-xs font-medium text-gray-300 uppercase tracking-wider mb-1";

    return (
        <form action={dispatch} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="firstName" className={labelClasses}>First Name</label>
                    <input type="text" name="firstName" id="firstName" required className={inputClasses} placeholder="John" />
                    {state?.errors?.firstName && <p className="text-red-400 text-xs mt-1">{state.errors.firstName}</p>}
                </div>
                <div>
                    <label htmlFor="lastName" className={labelClasses}>Last Name</label>
                    <input type="text" name="lastName" id="lastName" required className={inputClasses} placeholder="Doe" />
                    {state?.errors?.lastName && <p className="text-red-400 text-xs mt-1">{state.errors.lastName}</p>}
                </div>
            </div>

            {link.emailMode !== 'HIDDEN' && (
                <div>
                    <label htmlFor="email" className={labelClasses}>
                        Email {link.emailMode === 'OPTIONAL' && <span className="text-gray-500 normal-case tracking-normal">(Optional)</span>}
                    </label>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        required={link.emailMode === 'REQUIRED'}
                        className={inputClasses}
                        placeholder="john@example.com"
                    />
                    {state?.errors?.email && <p className="text-red-400 text-xs mt-1">{state.errors.email}</p>}
                </div>
            )}

            {link.phoneMode !== 'HIDDEN' && (
                <div>
                    <label htmlFor="phone" className={labelClasses}>
                        Phone {link.phoneMode === 'OPTIONAL' && <span className="text-gray-500 normal-case tracking-normal">(Optional)</span>}
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        id="phone"
                        required={link.phoneMode === 'REQUIRED'}
                        className={inputClasses}
                        placeholder="+41 79 123 45 67"
                    />
                    {state?.errors?.phone && <p className="text-red-400 text-xs mt-1">{state.errors.phone}</p>}
                </div>
            )}

            {link.maxPlusOnesPerSignup > 0 && (
                <div>
                    <label htmlFor="plusOnes" className={labelClasses}>
                        Additional Guests (+{link.maxPlusOnesPerSignup} max)
                    </label>
                    <select
                        name="plusOnes"
                        id="plusOnes"
                        className={inputClasses}
                    >
                        {[...Array(link.maxPlusOnesPerSignup + 1)].map((_, i) => (
                            <option key={i} value={i} className="bg-gray-900 text-white">+{i}</option>
                        ))}
                    </select>
                </div>
            )}

            {link.allowNotes && (
                <div>
                    <label htmlFor="note" className={labelClasses}>Note (Optional)</label>
                    <textarea name="note" id="note" rows={2} className={inputClasses} placeholder="Any special requests?"></textarea>
                </div>
            )}

            {(link.emailMode !== 'HIDDEN' || link.phoneMode !== 'HIDDEN') && (
                <p className="text-xs text-gray-500 text-center mt-6 mb-2">
                    By signing up, you agree to receive event confirmations and marketing messages.
                </p>
            )}

            <button
                type="submit"
                disabled={isPending}
                style={{ backgroundColor: accentColor }}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 mt-8 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
                {isPending ? 'Signing up...' : 'Get on the List'}
            </button>

            {state?.message && (
                <div className={`p-3 rounded-md text-sm text-center ${state.success ? 'bg-green-900/50 text-green-200 border border-green-800' : 'bg-red-900/50 text-red-200 border border-red-800'}`}>
                    {state.message}
                </div>
            )}
        </form>
    );
}
