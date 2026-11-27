import { useCallback, useEffect, useState } from 'react';
import { CarBookingModal } from './components/CarBookingModal.tsx';
import { FleetSection } from './components/FleetSection.tsx';
import { Footer } from './components/Footer.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { InquiryAndLookupSection } from './components/InquiryAndLookupSection.tsx';
import { Navbar } from './components/Navbar.tsx';
import { ProcessAndHubsSection } from './components/ProcessAndHubsSection.tsx';
import { WhatsAppFloatButton } from './components/WhatsAppFloatButton.tsx';
import { AdminApp } from './components/admin/AdminApp.tsx';
import { SeoPage } from './components/SeoPage.tsx';
import { HERO_IMAGE_URL, PICKUP_HUBS } from './data/fleet.ts';
import { getPageSeoOverride, getSeoPage, LIVE_SITE_ORIGIN } from './data/seo.ts';
import type {
  CarCategory,
  CarWithAvailability,
  SiteSettings,
  TransmissionType,
} from './types/rental.ts';
import { getDefaultDates } from './utils/whatsapp.ts';

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((nextPath: string) => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
      setPathname(nextPath);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  const defaults = getDefaultDates();
  const [pickupHubId, setPickupHubId] = useState(PICKUP_HUBS[0].id);
  const [pickupDate, setPickupDate] = useState(defaults.pickupDate);
  const [returnDate, setReturnDate] = useState(defaults.returnDate);
  const [category, setCategory] = useState<CarCategory | 'All'>('All');
  const [transmission, setTransmission] = useState<TransmissionType | 'All'>('All');

  const [cars, setCars] = useState<CarWithAvailability[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCar, setSelectedCar] = useState<CarWithAvailability | null>(null);

  const isAdminRoute = pathname.startsWith('/admin');
  const seoPage = getSeoPage(pathname, cars);

  useEffect(() => {
    if (isAdminRoute || !seoPage) return;
    const overrides = getPageSeoOverride(settings, seoPage.key);
    const title = overrides.title?.trim() || seoPage.title;
    const description = overrides.description?.trim() || seoPage.description;
    const canonical =
      overrides.canonicalUrl?.trim() || `${LIVE_SITE_ORIGIN}${seoPage.path}`;
    const robots = overrides.robots || 'index,follow';
    document.title = title;

    function setMeta(name: string, content: string, property = false) {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let tag = document.head.querySelector<HTMLMetaElement>(selector);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(property ? 'property' : 'name', name);
        document.head.appendChild(tag);
      }
      tag.content = content;
    }

    setMeta('description', description);
    setMeta('robots', robots);
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:url', canonical, true);
    setMeta('og:site_name', '24 Self Drive', true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    const ogImage = overrides.ogImage || seoPage.car?.imageUrl || HERO_IMAGE_URL;
    const absoluteOgImage = new URL(ogImage, LIVE_SITE_ORIGIN).toString();
    setMeta('og:image', absoluteOgImage, true);
    setMeta('twitter:image', absoluteOgImage);

    let canonicalTag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.rel = 'canonical';
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.href = canonical;
  }, [isAdminRoute, seoPage, settings]);

  const fetchFleet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        category,
        transmission,
        pickupDate,
        returnDate,
      });
      const res = await fetch(`/api/fleet?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Server returned an error loading fleet availability.');
      }
      const data = (await res.json()) as {
        cars: CarWithAvailability[];
        settings?: SiteSettings;
      };
      setCars(data.cars);
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach fleet server.');
    } finally {
      setLoading(false);
    }
  }, [category, transmission, pickupDate, returnDate]);

  useEffect(() => {
    if (!isAdminRoute) {
      void fetchFleet();
    }
  }, [isAdminRoute, fetchFleet]);

  if (isAdminRoute) {
    return <AdminApp onNavigatePublic={() => navigate('/')} />;
  }
  if (seoPage && pathname !== '/') {
    return <SeoPage page={seoPage} cars={cars} settings={settings} />;
  }

  function handleHeroSearch(params: {
    hubId: string;
    pickupDate: string;
    returnDate: string;
    category: CarCategory | 'All';
  }) {
    setPickupHubId(params.hubId);
    setPickupDate(params.pickupDate);
    setReturnDate(params.returnDate);
    setCategory(params.category);

    const el = document.getElementById('fleet');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function handleNavbarBookClick() {
    const firstAvailable = cars.find((c) => c.available) ?? cars[0] ?? null;
    if (firstAvailable) {
      setSelectedCar(firstAvailable);
    } else {
      document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-950">
      <Navbar settings={settings} onBookClick={handleNavbarBookClick} />

      <main className="flex-1">
        <HeroSection
          pickupDate={pickupDate}
          returnDate={returnDate}
          selectedHubId={pickupHubId}
          selectedCategory={category}
          onSearchAvailability={handleHeroSearch}
        />

        <FleetSection
          cars={cars}
          loading={loading}
          error={error}
          category={category}
          transmission={transmission}
          pickupDate={pickupDate}
          returnDate={returnDate}
          whatsappNumber={settings?.whatsappNumber}
          onCategoryChange={setCategory}
          onTransmissionChange={setTransmission}
          onRetry={fetchFleet}
          onSelectCar={setSelectedCar}
        />

        <ProcessAndHubsSection />

        <InquiryAndLookupSection />
      </main>

      <Footer settings={settings} onNavigateAdmin={() => navigate('/admin')} />

      <WhatsAppFloatButton whatsappNumber={settings?.whatsappNumber} />

      <CarBookingModal
        car={selectedCar}
        initialHubId={pickupHubId}
        initialPickupDate={pickupDate}
        initialReturnDate={returnDate}
        onClose={() => setSelectedCar(null)}
        onBookingConfirmed={() => {
          void fetchFleet();
        }}
      />
    </div>
  );
}
