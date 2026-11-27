import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import type { SiteSettings } from '../types/rental.ts';

interface NavbarProps {
  settings?: SiteSettings | null;
  onBookClick: () => void;
}

const NAV_LINKS = [
  { label: 'Fleet', href: '#fleet' },
  { label: 'Tariffs', href: '#tariffs' },
  { label: 'Hubs', href: '#hubs' },
  { label: 'Lookup', href: '#inquiries' },
];

export function Navbar({ settings, onBookClick }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0B]/95 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#top"
          className="font-display text-lg sm:text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-sm"
        >
          {settings?.logoUrl && (
            <img
              src={settings.logoUrl}
              alt="24 Self Drive logo"
              referrerPolicy="no-referrer"
              className="h-7 w-auto object-contain"
            />
          )}
          <span>
            24 <span className="text-orange-500">Self Drive</span>
          </span>
        </a>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-neutral-300 hover:text-white underline-offset-8 hover:underline decoration-orange-500 transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-sm"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: 1 Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onBookClick}
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0B]"
          >
            Book a Car
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 text-neutral-200 hover:text-white border border-neutral-800 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#0A0A0B] border-t border-neutral-800 px-4 py-4 space-y-2">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 px-3 text-sm font-medium text-neutral-200 hover:text-white hover:bg-neutral-900 rounded-lg"
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onBookClick();
            }}
            className="w-full mt-2 py-3 px-4 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors cursor-pointer"
          >
            Book a Car
          </button>
        </div>
      )}
    </header>
  );
}
