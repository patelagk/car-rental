import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { BUSINESS_CONTACT } from '../data/fleet.ts';
import type { SiteSettings } from '../types/rental.ts';
import { buildWhatsAppUrl } from '../utils/whatsapp.ts';

interface FooterProps {
  settings?: SiteSettings | null;
  onNavigateAdmin: () => void;
}

export function Footer({ settings, onNavigateAdmin }: FooterProps) {
  const year = new Date().getFullYear();
  const brandName = settings?.businessName || BUSINESS_CONTACT.brandName;
  const address = settings?.businessAddress || BUSINESS_CONTACT.address;
  const contactNumber = settings?.contactNumber || BUSINESS_CONTACT.phoneDisplay;
  const whatsappNumber = settings?.whatsappNumber || BUSINESS_CONTACT.phoneE164;
  const email = settings?.email?.trim() || BUSINESS_CONTACT.email;

  return (
    <footer className="bg-[#0A0A0B] text-neutral-300 py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-neutral-800">
          {/* Brand Summary */}
          <div className="md:col-span-5 space-y-3">
            <a href="#top" className="font-display text-xl font-bold tracking-tight text-white inline-block">
              {brandName}
            </a>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-md">
              Trusted self-drive car rental in Bhopal, Madhya Pradesh. Well-maintained MP-04 hatchbacks, executive sedans, and 7-seater SUVs for local commutes and outstation road trips.
            </p>
            <p className="text-xs text-neutral-500">{BUSINESS_CONTACT.hours}</p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Quick Navigation
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#fleet" className="hover:text-white transition-colors">
                  Available Self-Drive Fleet
                </a>
              </li>
              <li>
                <a href="#tariffs" className="hover:text-white transition-colors">
                  Tariffs &amp; Terms
                </a>
              </li>
              <li>
                <a href="#hubs" className="hover:text-white transition-colors">
                  Bhopal Pickup Hubs
                </a>
              </li>
              <li>
                <a href="#inquiries" className="hover:text-white transition-colors">
                  Outstation Quotes &amp; Lookup
                </a>
              </li>
              <li><a href="/cars" className="hover:text-white transition-colors">All Cars</a></li>
              <li><a href="/cars/hatchback" className="hover:text-white transition-colors">Hatchbacks</a></li>
              <li><a href="/cars/sedan" className="hover:text-white transition-colors">Sedans</a></li>
              <li><a href="/cars/suv" className="hover:text-white transition-colors">SUVs</a></li>
              <li><a href="/about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="/rental-policies" className="hover:text-white transition-colors">Rental Policies</a></li>
              <li><a href="/blog" className="hover:text-white transition-colors">Travel Guide</a></li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateAdmin}
                  className="text-neutral-400 hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Admin Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Office */}
          <div className="md:col-span-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Bhopal Dispatch Desk
            </h3>
            <ul className="space-y-2.5 text-sm text-neutral-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-orange-500 shrink-0" />
                <a href={`tel:${contactNumber.replace(/\s+/g, '')}`} className="font-mono hover:text-white">
                  {contactNumber}
                </a>
              </li>
              {email && (
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-orange-500 shrink-0" />
                  <a href={`mailto:${email}`} className="hover:text-white">
                    {email}
                  </a>
                </li>
              )}
              <li>
                <a
                  href={buildWhatsAppUrl(
                    `Hello ${brandName}, I have a self-drive car inquiry.`,
                    whatsappNumber,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© {year} {brandName}. All rights reserved.</p>
          <p>MP-04 Commercial Self-Drive Rentals · Bhopal, Madhya Pradesh</p>
        </div>
      </div>
    </footer>
  );
}
