import { Check, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Car, SiteSettings } from '../../types/rental.ts';
import { getCarSlug, SEO_PAGES } from '../../data/seo.ts';
import { compressImageFile } from '../../utils/imageCompress.ts';

interface SettingsViewProps {
  settings: SiteSettings | null;
  cars: Car[];
  token: string;
  onSaveSettings: (payload: Partial<SiteSettings>) => Promise<void>;
}

export function SettingsView({ settings, cars, token, onSaveSettings }: SettingsViewProps) {
  const seoPageOptions = [
    ...SEO_PAGES.map((page) => ({ key: page.key, heading: page.heading })),
    ...cars.map((car) => ({
      key: `car:${getCarSlug(car)}`,
      heading: `${car.name} detail page`,
    })),
  ];
  const [businessName, setBusinessName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [email, setEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [featuredCarIds, setFeaturedCarIds] = useState<string[]>([]);
  const [pageSeo, setPageSeo] = useState<NonNullable<SiteSettings['pageSeo']>>({});
  const [selectedSeoPage, setSelectedSeoPage] = useState(SEO_PAGES[0].key);
  const [googleSiteVerification, setGoogleSiteVerification] = useState('');
  const [ga4MeasurementId, setGa4MeasurementId] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    setBusinessName(settings.businessName);
    setWhatsappNumber(settings.whatsappNumber);
    setContactNumber(settings.contactNumber);
    setBusinessAddress(settings.businessAddress);
    setEmail(settings.email);
    setLogoUrl(settings.logoUrl || '');
    setFeaturedCarIds(settings.featuredCarIds || []);
    setPageSeo(settings.pageSeo || {});
    setGoogleSiteVerification(settings.googleSiteVerification || '');
    setGa4MeasurementId(settings.ga4MeasurementId || '');
  }, [settings]);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setError(null);
    try {
      const compressed = await compressImageFile(file, 600, 0.9);
      const formData = new FormData();
      formData.append('images', compressed);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = (await res.json()) as { urls?: string[]; error?: string };
      if (!res.ok || !data.urls?.[0]) {
        setError(data.error ?? 'Logo upload failed.');
        return;
      }
      setLogoUrl(data.urls[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload logo.');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  }

  function toggleFeaturedCar(carId: string) {
    setFeaturedCarIds((prev) =>
      prev.includes(carId) ? prev.filter((id) => id !== carId) : [...prev, carId],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await onSaveSettings({
        businessName,
        whatsappNumber,
        contactNumber,
        businessAddress,
        email,
        logoUrl,
        featuredCarIds,
        pageSeo,
        googleSiteVerification,
        ga4MeasurementId,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">
          Website Content &amp; Settings
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Configure public business information, WhatsApp booking number, brand logo, and homepage featured cars.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[#111114] border border-neutral-800 rounded-xl p-6 space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="st-name" className="block text-xs font-medium text-neutral-300 mb-1">
              Business Name
            </label>
            <input
              id="st-name"
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label htmlFor="st-wa" className="block text-xs font-medium text-neutral-300 mb-1">
              WhatsApp Number (with country code, e.g. 919303259841)
            </label>
            <input
              id="st-wa"
              type="text"
              required
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm font-mono tabular-nums text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label htmlFor="st-phone" className="block text-xs font-medium text-neutral-300 mb-1">
              Contact Number
            </label>
            <input
              id="st-phone"
              type="text"
              required
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm font-mono tabular-nums text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label htmlFor="st-email" className="block text-xs font-medium text-neutral-300 mb-1">
              Booking Email
            </label>
            <input
              id="st-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="st-addr" className="block text-xs font-medium text-neutral-300 mb-1">
              Business Address
            </label>
            <input
              id="st-addr"
              type="text"
              required
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Website Logo */}
        <div className="pt-4 border-t border-neutral-800 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Page SEO settings</h2>
            <p className="mt-1 text-[11px] text-neutral-500">
              Overrides apply to one selected public page. Leave fields blank to use its unique defaults.
            </p>
          </div>
          <div>
            <label htmlFor="seo-page" className="block text-xs font-medium text-neutral-300 mb-1">
              Public page
            </label>
            <select
              id="seo-page"
              value={selectedSeoPage}
              onChange={(e) => setSelectedSeoPage(e.target.value)}
              className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white"
            >
              {seoPageOptions.map((page) => (
                <option key={page.key} value={page.key}>{page.heading}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="seo-title" className="block text-xs font-medium text-neutral-300 mb-1">
              Page SEO Title
            </label>
            <input
              id="seo-title"
              maxLength={70}
              value={pageSeo[selectedSeoPage]?.title || ''}
              onChange={(e) =>
                setPageSeo((current) => ({
                  ...current,
                  [selectedSeoPage]: { ...current[selectedSeoPage], title: e.target.value },
                }))
              }
              className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label htmlFor="seo-description" className="block text-xs font-medium text-neutral-300 mb-1">
              Meta Description
            </label>
            <textarea
              id="seo-description"
              rows={2}
              maxLength={200}
              value={pageSeo[selectedSeoPage]?.description || ''}
              onChange={(e) =>
                setPageSeo((current) => ({
                  ...current,
                  [selectedSeoPage]: { ...current[selectedSeoPage], description: e.target.value },
                }))
              }
              className="w-full p-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label htmlFor="seo-canonical" className="block text-xs font-medium text-neutral-300 mb-1">
              Canonical URL (optional absolute URL)
            </label>
            <input
              id="seo-canonical"
              type="url"
              value={pageSeo[selectedSeoPage]?.canonicalUrl || ''}
              onChange={(e) =>
                setPageSeo((current) => ({
                  ...current,
                  [selectedSeoPage]: { ...current[selectedSeoPage], canonicalUrl: e.target.value },
                }))
              }
              className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="seo-robots" className="block text-xs font-medium text-neutral-300 mb-1">
                Meta Robots
              </label>
              <select
                id="seo-robots"
                value={pageSeo[selectedSeoPage]?.robots || 'index,follow'}
                onChange={(e) =>
                  setPageSeo((current) => ({
                    ...current,
                    [selectedSeoPage]: {
                      ...current[selectedSeoPage],
                      robots: e.target.value as 'index,follow' | 'noindex,follow' | 'noindex,nofollow',
                    },
                  }))
                }
                className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white"
              >
                <option value="index,follow">index,follow</option>
                <option value="noindex,follow">noindex,follow</option>
                <option value="noindex,nofollow">noindex,nofollow</option>
              </select>
            </div>
            <div>
              <label htmlFor="seo-og-image" className="block text-xs font-medium text-neutral-300 mb-1">
                Open Graph Image URL
              </label>
              <input
                id="seo-og-image"
                type="url"
                value={pageSeo[selectedSeoPage]?.ogImage || ''}
                onChange={(e) =>
                  setPageSeo((current) => ({
                    ...current,
                    [selectedSeoPage]: { ...current[selectedSeoPage], ogImage: e.target.value },
                  }))
                }
                className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-800 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="google-verification" className="block text-xs font-medium text-neutral-300 mb-1">
              Google Search Console verification token
            </label>
            <input
              id="google-verification"
              value={googleSiteVerification}
              onChange={(e) => setGoogleSiteVerification(e.target.value)}
              placeholder="Token from Search Console HTML tag method"
              className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label htmlFor="ga4-id" className="block text-xs font-medium text-neutral-300 mb-1">
              Google Analytics 4 Measurement ID
            </label>
            <input
              id="ga4-id"
              value={ga4MeasurementId}
              onChange={(e) => setGa4MeasurementId(e.target.value.toUpperCase())}
              placeholder="G-XXXXXXXXXX"
              className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white"
            />
          </div>
        </div>

        {/* Website Logo */}
        <div className="pt-4 border-t border-neutral-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-neutral-300">Website Logo (Optional)</p>
              <p className="text-[11px] text-neutral-500">
                Upload an emblem/logo image or leave blank to display the clean text wordmark.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-orange-500" />
              <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploadingLogo}
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Logo URL (/api/images/... or https://...)"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="flex-1 h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
            />
            {logoUrl && (
              <button
                type="button"
                onClick={() => setLogoUrl('')}
                className="px-3 h-10 text-xs text-neutral-400 hover:text-white border border-neutral-800 rounded-lg cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          {logoUrl && (
            <div className="p-3 bg-[#09090B] border border-neutral-800 rounded-lg inline-block">
              <img
                src={logoUrl}
                alt="Website Logo Preview"
                referrerPolicy="no-referrer"
                className="h-9 w-auto object-contain"
              />
            </div>
          )}
        </div>

        {/* Homepage Featured Cars */}
        <div className="pt-4 border-t border-neutral-800 space-y-3">
          <div>
            <p className="text-xs font-medium text-neutral-300">Homepage Featured Cars</p>
            <p className="text-[11px] text-neutral-500">
              Select which active cars appear in the featured lineup on the public website.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {cars.map((car) => {
              const checked = featuredCarIds.includes(car.id);
              return (
                <label
                  key={car.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    checked
                      ? 'bg-orange-500/10 border-orange-500/50 text-white'
                      : 'bg-[#09090B] border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleFeaturedCar(car.id)}
                    className="accent-orange-500 w-4 h-4"
                  />
                  <img
                    src={car.imageUrl}
                    alt={car.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-8 rounded object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{car.name}</p>
                    <p className="text-[11px] text-neutral-400">
                      {car.category} · {car.status}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {error && (
          <p role="alert" className="p-3 text-xs font-medium text-red-400 bg-red-950/50 border border-red-900 rounded-lg">
            {error}
          </p>
        )}

        <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-lg cursor-pointer"
          >
            {saved && <Check className="w-4 h-4" />}
            <span>{saving ? 'Saving Settings...' : saved ? 'Settings Saved' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
