import type { Metadata } from "next";
import Link from "next/link";
import { Check, Sparkles, Star } from "lucide-react";

type Plan = {
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  checkoutUrl?: string;
  checkoutLabel: string;
  accent: "indigo" | "cyan";
};

type AddOn = {
  name: string;
  price: string;
  description: string;
  features: string[];
  checkoutUrl?: string;
  checkoutLabel: string;
};

const operatorPlans: Plan[] = [
  {
    name: "Operator Monthly",
    price: "CHF 69",
    cadence: "/month",
    description: "Flexible month-to-month billing for active venues and promoters.",
    features: [
      "Unlimited events",
      "Guest list + door check-in workflows",
      "Promoter seat management",
      "Email support",
    ],
    checkoutUrl: process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_OPERATOR_MONTHLY_URL,
    checkoutLabel: "Start Monthly",
    accent: "indigo",
  },
  {
    name: "Operator Yearly",
    price: "CHF 690",
    cadence: "/year",
    description: "Best value for teams running events year-round.",
    features: [
      "Everything in Monthly",
      "2 months free vs monthly billing",
      "Priority support",
      "Early access to new features",
    ],
    checkoutUrl: process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_OPERATOR_YEARLY_URL,
    checkoutLabel: "Start Yearly",
    accent: "cyan",
  },
];

const featuredAddOns: AddOn[] = [
  {
    name: "Featured Event (Single)",
    price: "CHF 29",
    description:
      "Boost one event placement in the public discovery feed for higher visibility.",
    features: [
      "Priority placement window",
      "Featured badge in discovery",
      "Performance-ready listing card",
    ],
    checkoutUrl: process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_FEATURED_SINGLE_URL,
    checkoutLabel: "Feature One Event",
  },
  {
    name: "Featured Event Pack (5)",
    price: "CHF 129",
    description: "Prepay and save when you run a regular event calendar.",
    features: [
      "Five featured event credits",
      "Lower per-event price",
      "Use credits anytime",
    ],
    checkoutUrl: process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_FEATURED_PACK_URL,
    checkoutLabel: "Buy 5-Credit Pack",
  },
];
import { auth } from '@/lib/auth';

async function startCheckout() {
  'use server';
  const { redirect } = await import('next/navigation');
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    redirect('/login');
  }

  const priceId = process.env.STRIPE_OPERATOR_PRICE_ID;
  if (!priceId) throw new Error('Stripe price not configured');

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const { getStripe } = await import('@/lib/stripe');

  const checkoutSession = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    customer_email: session!.user!.email!,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId: session!.user!.id! },
    success_url: `${appUrl}/admin`,
    cancel_url: `${appUrl}/pricing`,
  });

  if (checkoutSession.url) redirect(checkoutSession.url);
}

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Evently pricing for operator subscriptions and featured event add-ons.",
};

function PlanButton({ href, label }: { href?: string; label: string }) {
  if (!href) {
    return (
      <span className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/50">
        Checkout URL Not Configured
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:translate-y-[-1px] hover:bg-white/90"
    >
      {label}
    </Link>
  );
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#05070f] text-white">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-56 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-8rem] h-[24rem] w-[24rem] rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/80">
            <Sparkles className="h-3.5 w-3.5" />
            Evently Pricing
          </p>
          <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
            Run your venue operations and boost your events.
          </h1>
          <p className="mt-4 text-pretty text-base text-white/70 sm:text-lg">
            Choose your operator subscription, then add featured-event credits
            whenever you want extra discovery reach.
          </p>
        </div>

        <div className="mb-14 grid gap-6 lg:grid-cols-2">
          {operatorPlans.map((plan) => (
            <article
              key={plan.name}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b1222]/80 p-6 backdrop-blur"
            >
              <div
                className={`pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full blur-2xl ${
                  plan.accent === "indigo" ? "bg-indigo-500/35" : "bg-cyan-500/35"
                }`}
              />
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <p className="mt-1 text-sm text-white/70">{plan.description}</p>
              <div className="mt-6 flex items-end gap-2">
                <p className="text-4xl font-black tracking-tight">{plan.price}</p>
                <p className="pb-1 text-sm text-white/70">{plan.cadence}</p>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-white/85">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <PlanButton href={plan.checkoutUrl} label={plan.checkoutLabel} />
              </div>
            </article>
          ))}
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0a101f]/80 p-6 backdrop-blur sm:p-8">
          <div className="mb-6 flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-300" />
            <h2 className="text-2xl font-bold">Featured Event Add-On</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {featuredAddOns.map((addon) => (
              <article
                key={addon.name}
                className="rounded-2xl border border-white/10 bg-black/25 p-5"
              >
                <h3 className="text-lg font-semibold">{addon.name}</h3>
                <p className="mt-1 text-sm text-white/70">{addon.description}</p>
                <p className="mt-4 text-3xl font-black tracking-tight">{addon.price}</p>

                <ul className="mt-4 space-y-2 text-sm text-white/85">
                  {addon.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <PlanButton href={addon.checkoutUrl} label={addon.checkoutLabel} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
