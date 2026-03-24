import Link from 'next/link';
import { ArrowRight, Calendar, Users, Building2, CheckCircle, Star } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5]">

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-[#2a2a2a] bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <span className="text-xl font-bold tracking-tight text-white">Evently</span>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-[#a3a3a3] hover:text-white transition-colors px-3 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-[#c084fc] text-black hover:bg-[#d8b4fe] transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-28 pb-20 sm:pt-40 sm:pb-32 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-[#c084fc]/10 blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-[#c084fc]/5 blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#c084fc]/30 bg-[#c084fc]/10 text-[#c084fc] text-xs font-medium mb-6 sm:mb-8">
            <Star className="w-3 h-3" />
            The unified nightlife platform
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-5 sm:mb-6">
            Where Nightlife<br />
            <span className="text-[#c084fc]">Happens.</span>
          </h1>

          <p className="max-w-xl mx-auto text-base sm:text-xl text-[#a3a3a3] mb-8 sm:mb-10 leading-relaxed">
            Discover events for free. Manage your venue like a pro.
            <br className="hidden sm:block" />
            One platform — for guests, promoters, and clubs.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 rounded-full text-base font-semibold bg-[#c084fc] text-black hover:bg-[#d8b4fe] transition-all hover:-translate-y-0.5 shadow-[0_0_24px_rgba(192,132,252,0.35)]"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 rounded-full text-base font-medium border border-[#3f3f3f] text-[#a3a3a3] hover:text-white hover:border-[#525252] transition-all hover:-translate-y-0.5"
            >
              View Operator Plans
            </Link>
          </div>
        </div>
      </section>

      {/* Module Features */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c084fc] mb-3">
              Platform Modules
            </p>
            <h2 className="text-2xl sm:text-4xl font-bold text-white">
              Everything nightlife needs
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

            {/* Event Discovery */}
            <div className="group relative p-6 sm:p-8 rounded-2xl border border-[#2a2a2a] bg-[#141414] hover:border-[#c084fc]/30 transition-all">
              <div className="absolute inset-0 rounded-2xl bg-[#c084fc]/0 group-hover:bg-[#c084fc]/[0.03] transition-colors pointer-events-none" />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-[#c084fc]/10 flex items-center justify-center mb-5">
                  <Calendar className="w-5 h-5 text-[#c084fc]" />
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-[#c084fc]/10 text-[#c084fc] mb-3">
                  Always Free
                </span>
                <h3 className="text-lg font-bold text-white mb-2">Event Discovery</h3>
                <p className="text-sm text-[#a3a3a3] leading-relaxed">
                  Browse clubs, events, and nights out near you. Aggregated from partner venues and live sources — always free for guests.
                </p>
              </div>
            </div>

            {/* Guestlist System */}
            <div className="group relative p-6 sm:p-8 rounded-2xl border border-[#2a2a2a] bg-[#141414] hover:border-[#c084fc]/30 transition-all">
              <div className="absolute inset-0 rounded-2xl bg-[#c084fc]/0 group-hover:bg-[#c084fc]/[0.03] transition-colors pointer-events-none" />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-[#c084fc]/10 flex items-center justify-center mb-5">
                  <Users className="w-5 h-5 text-[#c084fc]" />
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-[#1e1e1e] text-[#a3a3a3] mb-3">
                  Operator
                </span>
                <h3 className="text-lg font-bold text-white mb-2">Guestlist System</h3>
                <p className="text-sm text-[#a3a3a3] leading-relaxed">
                  Mobile-first signup forms, promoter tools, per-event branding, and instant door check-in. Built for dark rooms and fast queues.
                </p>
              </div>
            </div>

            {/* Venue Tools */}
            <div className="group relative p-6 sm:p-8 rounded-2xl border border-[#2a2a2a] bg-[#141414] hover:border-[#c084fc]/30 transition-all sm:col-span-2 lg:col-span-1">
              <div className="absolute inset-0 rounded-2xl bg-[#c084fc]/0 group-hover:bg-[#c084fc]/[0.03] transition-colors pointer-events-none" />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-[#c084fc]/10 flex items-center justify-center mb-5">
                  <Building2 className="w-5 h-5 text-[#c084fc]" />
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-[#1e1e1e] text-[#a3a3a3] mb-3">
                  Operator
                </span>
                <h3 className="text-lg font-bold text-white mb-2">Venue Tools</h3>
                <p className="text-sm text-[#a3a3a3] leading-relaxed">
                  Lounge and VIP table reservations, real-time capacity tracking, and a full management dashboard for club operators.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c084fc] mb-3">
              Pricing
            </p>
            <h2 className="text-2xl sm:text-4xl font-bold text-white">
              Simple tiers, no surprises
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">

            {/* Free tier */}
            <div className="p-6 sm:p-8 rounded-2xl border border-[#2a2a2a] bg-[#141414]">
              <p className="text-2xl font-bold text-white mb-1">Free</p>
              <p className="text-sm text-[#a3a3a3] mb-6">For guests and event-goers</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Browse all events',
                  'Sign up for guestlists',
                  'Save favourite venues',
                  'Get door confirmations',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm text-[#f5f5f5]">
                    <CheckCircle className="w-4 h-4 text-[#c084fc] shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block w-full text-center px-5 py-3 rounded-full border border-[#3f3f3f] text-sm font-medium text-[#a3a3a3] hover:text-white hover:border-[#525252] transition-colors"
              >
                Create Free Account
              </Link>
            </div>

            {/* Operator tier */}
            <div className="relative p-6 sm:p-8 rounded-2xl border border-[#c084fc]/40 bg-[#141414] overflow-hidden">
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#c084fc]/10 blur-2xl pointer-events-none" />
              <p className="text-2xl font-bold text-white mb-1">Operator</p>
              <p className="text-sm text-[#a3a3a3] mb-6">For clubs, venues, and promoters</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Full guestlist management',
                  'Promoter & door staff accounts',
                  'VIP table reservations',
                  'Per-event branding',
                  'Analytics & exports',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm text-[#f5f5f5]">
                    <CheckCircle className="w-4 h-4 text-[#c084fc] shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className="block w-full text-center px-5 py-3 rounded-full bg-[#c084fc] text-black text-sm font-semibold hover:bg-[#d8b4fe] transition-colors"
              >
                View Pricing
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e1e1e]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-lg font-bold tracking-tight text-white">Evently</span>
          <p className="text-sm text-[#525252]">
            &copy; {new Date().getFullYear()} Evently. All rights reserved.
          </p>
          <div className="flex gap-5 text-sm text-[#a3a3a3]">
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
