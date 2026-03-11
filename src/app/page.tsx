import Link from 'next/link';
import { ArrowRight, CheckCircle, Shield, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                GuestList
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login" // In a real app, maybe a signup page or contact sales
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:shadow-[0_0_30px_rgba(79,70,229,0.7)]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-[1000px] h-[1000px] rounded-full bg-indigo-600/20 blur-3xl opacity-50 animate-pulse"></div>
          <div className="absolute -bottom-1/2 -left-1/2 w-[800px] h-[800px] rounded-full bg-cyan-600/20 blur-3xl opacity-50"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8">
            <span className="block text-white">The Modern Standard for</span>
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
              Event Guest Management
            </span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-400 mb-10">
            Streamline your guest lists, empower promoters, and speed up door entry with a mobile-first platform designed for nightlife and exclusive events.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 transition-all shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:shadow-[0_0_30px_rgba(79,70,229,0.7)] hover:-translate-y-1"
            >
              Launch App
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center px-8 py-4 border border-gray-700 text-lg font-medium rounded-full text-gray-300 hover:bg-gray-800 md:py-4 md:text-lg md:px-10 transition-all hover:-translate-y-1"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-black relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base font-semibold text-indigo-400 tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
              Everything you need to run the door
            </p>
          </div>

          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="relative p-8 bg-gray-900/50 rounded-2xl border border-gray-800 hover:border-indigo-500/50 transition-all hover:bg-gray-900 group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-600/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mb-6 shadow-lg shadow-indigo-500/30">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Role-Based Access</h3>
              <p className="text-gray-400">
                Granular permissions for Admins, Promoters, and Door Staff. Keep your data secure and operations smooth.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="relative p-8 bg-gray-900/50 rounded-2xl border border-gray-800 hover:border-cyan-500/50 transition-all hover:bg-gray-900 group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-cyan-600/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-cyan-500 text-white mb-6 shadow-lg shadow-cyan-500/30">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Lightning Fast Entry</h3>
              <p className="text-gray-400">
                Mobile-optimized check-in interface designed for dark environments. Search and check in guests in seconds.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="relative p-8 bg-gray-900/50 rounded-2xl border border-gray-800 hover:border-purple-500/50 transition-all hover:bg-gray-900 group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-600/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white mb-6 shadow-lg shadow-purple-500/30">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Smart Quotas</h3>
              <p className="text-gray-400">
                Set limits on total guests and +1s. Automatically close lists when capacity is reached.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              GuestList
            </div>
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} GuestList App. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
