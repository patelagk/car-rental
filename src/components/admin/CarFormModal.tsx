import { Plus, Star, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type {
  AvailabilityStatus,
  Car,
  CarCategory,
  FuelType,
  TransmissionType,
} from '../../types/rental.ts';
import { getCarSlug, slugify } from '../../data/seo.ts';
import { compressImageFile } from '../../utils/imageCompress.ts';

interface CarFormModalProps {
  open: boolean;
  editingCar: Car | null;
  token: string;
  onClose: () => void;
  onSaved: (car: Car, isNew: boolean) => void;
}

export function CarFormModal({ open, editingCar, token, onClose, onSaved }: CarFormModalProps) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [modelYear, setModelYear] = useState(2025);
  const [variant, setVariant] = useState('');
  const [category, setCategory] = useState<CarCategory>('Hatchback');
  const [transmission, setTransmission] = useState<TransmissionType>('Manual');
  const [fuelType, setFuelType] = useState<FuelType>('Petrol');
  const [seats, setSeats] = useState(5);
  const [acAvailable, setAcAvailable] = useState(true);
  const [dailyRateInr, setDailyRateInr] = useState(1499);
  const [weeklyRateInr, setWeeklyRateInr] = useState('');
  const [monthlyRateInr, setMonthlyRateInr] = useState('');
  const [securityDepositInr, setSecurityDepositInr] = useState(3000);
  const [extraHourRateInr, setExtraHourRateInr] = useState(200);
  const [extraKmRateInr, setExtraKmRateInr] = useState(10);
  const [freeKmPerDay, setFreeKmPerDay] = useState(300);
  const [description, setDescription] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [imageAltText, setImageAltText] = useState('');
  const [featuresText, setFeaturesText] = useState('FASTag Preloaded, Rear Parking Camera, Dual Airbags');
  const [images, setImages] = useState<string[]>([]);
  const [primaryImageUrl, setPrimaryImageUrl] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<AvailabilityStatus>('Available');

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editingCar) {
      setName(editingCar.name);
      setBrand(editingCar.brand);
      setModel(editingCar.model);
      setModelYear(editingCar.modelYear);
      setVariant(editingCar.variant);
      setCategory(editingCar.category);
      setTransmission(editingCar.transmission);
      setFuelType(editingCar.fuelType);
      setSeats(editingCar.seats);
      setAcAvailable(editingCar.acAvailable);
      setDailyRateInr(editingCar.dailyRateInr);
      setWeeklyRateInr(editingCar.weeklyRateInr ? String(editingCar.weeklyRateInr) : '');
      setMonthlyRateInr(editingCar.monthlyRateInr ? String(editingCar.monthlyRateInr) : '');
      setSecurityDepositInr(editingCar.securityDepositInr);
      setExtraHourRateInr(editingCar.extraHourRateInr);
      setExtraKmRateInr(editingCar.extraKmRateInr);
      setFreeKmPerDay(editingCar.freeKmPerDay);
      setDescription(editingCar.description);
      setSeoTitle(editingCar.seoTitle || '');
      setSeoDescription(editingCar.seoDescription || '');
      setImageAltText(editingCar.imageAltText || '');
      setFeaturesText(editingCar.highlights.join(', '));
      const initialImgs =
        editingCar.images && editingCar.images.length > 0
          ? editingCar.images
          : editingCar.imageUrl
            ? [editingCar.imageUrl]
            : [];
      setImages(initialImgs);
      setPrimaryImageUrl(editingCar.imageUrl || initialImgs[0] || '');
      setFeatured(editingCar.featured);
      setStatus(editingCar.status);
    } else {
      setName('');
      setBrand('');
      setModel('');
      setModelYear(2025);
      setVariant('');
      setCategory('Hatchback');
      setTransmission('Manual');
      setFuelType('Petrol');
      setSeats(5);
      setAcAvailable(true);
      setDailyRateInr(1499);
      setWeeklyRateInr('');
      setMonthlyRateInr('');
      setSecurityDepositInr(3000);
      setExtraHourRateInr(200);
      setExtraKmRateInr(10);
      setFreeKmPerDay(300);
      setDescription('');
      setSeoTitle('');
      setSeoDescription('');
      setImageAltText('');
      setFeaturesText('FASTag Preloaded, Rear Parking Camera, Dual Airbags');
      setImages([]);
      setPrimaryImageUrl('');
      setFeatured(false);
      setStatus('Available');
    }
  }, [open, editingCar]);

  if (!open) return null;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      const rawFiles = Array.from(fileList);
      for (const file of rawFiles) {
        const compressed = await compressImageFile(file);
        formData.append('images', compressed);
      }

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = (await res.json()) as { urls?: string[]; error?: string };
      if (!res.ok || !data.urls) {
        setError(data.error ?? 'Image upload failed.');
        return;
      }

      const nextImages = [...images, ...data.urls];
      setImages(nextImages);
      if (!primaryImageUrl && data.urls[0]) {
        setPrimaryImageUrl(data.urls[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process selected images.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function handleAddImageUrl() {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (trimmed.startsWith('data:')) {
      setError('Base64 image strings are not allowed. Upload an image file or use an HTTP/path URL.');
      return;
    }
    const next = [...images, trimmed];
    setImages(next);
    if (!primaryImageUrl) setPrimaryImageUrl(trimmed);
    setImageUrlInput('');
    setError(null);
  }

  function handleRemoveImage(url: string) {
    const remaining = images.filter((img) => img !== url);
    setImages(remaining);
    if (primaryImageUrl === url) {
      setPrimaryImageUrl(remaining[0] || '');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (images.length === 0) {
      setError('Please upload at least one car photo before saving.');
      return;
    }

    const chosenPrimary = primaryImageUrl && images.includes(primaryImageUrl) ? primaryImageUrl : images[0];
    const highlights = featuresText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: name.trim(),
      brand: brand.trim(),
      model: model.trim(),
      modelYear: Number(modelYear),
      variant: variant.trim() || `${model.trim()} ${transmission}`,
      category,
      transmission,
      fuelType,
      seats: Number(seats),
      acAvailable,
      dailyRateInr: Number(dailyRateInr),
      weeklyRateInr: weeklyRateInr ? Number(weeklyRateInr) : undefined,
      monthlyRateInr: monthlyRateInr ? Number(monthlyRateInr) : undefined,
      securityDepositInr: Number(securityDepositInr),
      extraHourRateInr: Number(extraHourRateInr),
      extraKmRateInr: Number(extraKmRateInr),
      freeKmPerDay: Number(freeKmPerDay),
      description: description.trim(),
      seoTitle: seoTitle.trim(),
      seoDescription: seoDescription.trim(),
      imageAltText: imageAltText.trim(),
      highlights,
      images,
      imageUrl: chosenPrimary,
      featured,
      status,
    };

    setSaving(true);
    try {
      const endpoint = editingCar ? `/api/admin/cars/${editingCar.id}` : '/api/admin/cars';
      const method = editingCar ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { car?: Car; error?: string };
      if (!res.ok || !data.car) {
        setError(data.error ?? 'Failed to save car.');
        return;
      }

      onSaved(data.car, !editingCar);
    } catch {
      setError('Network error while saving car.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="car-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="w-full max-w-4xl bg-[#111114] border border-neutral-800 rounded-xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#09090B] border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div>
            <p className="text-xs font-medium text-orange-400">
              {editingCar ? `Editing ${editingCar.name}` : 'New Fleet Vehicle'}
            </p>
            <h2 id="car-form-title" className="font-display text-lg font-bold text-white">
              {editingCar ? 'Edit Car Details' : 'Add New Car'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          {/* Basic Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <label htmlFor="cf-name" className="block text-xs font-medium text-neutral-300 mb-1">
                1. Car Name *
              </label>
              <input
                id="cf-name"
                type="text"
                required
                placeholder="e.g. Maruti Suzuki Swift VXi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="cf-brand" className="block text-xs font-medium text-neutral-300 mb-1">
                2. Brand *
              </label>
              <input
                id="cf-brand"
                type="text"
                required
                placeholder="e.g. Maruti Suzuki"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="cf-model" className="block text-xs font-medium text-neutral-300 mb-1">
                3. Model *
              </label>
              <input
                id="cf-model"
                type="text"
                required
                placeholder="e.g. Swift VXi"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="cf-year" className="block text-xs font-medium text-neutral-300 mb-1">
                4. Manufacturing Year *
              </label>
              <input
                id="cf-year"
                type="number"
                required
                min={2015}
                max={2027}
                value={modelYear}
                onChange={(e) => setModelYear(Number(e.target.value))}
                className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm font-mono tabular-nums text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="cf-category" className="block text-xs font-medium text-neutral-300 mb-1">
                5. Car Category *
              </label>
              <select
                id="cf-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as CarCategory)}
                className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
              >
                <option value="Hatchback">Hatchback</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Luxury">Luxury</option>
              </select>
            </div>

            <div>
              <label htmlFor="cf-tx" className="block text-xs font-medium text-neutral-300 mb-1">
                6. Transmission *
              </label>
              <select
                id="cf-tx"
                value={transmission}
                onChange={(e) => setTransmission(e.target.value as TransmissionType)}
                className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
              >
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
              </select>
            </div>

            <div>
              <label htmlFor="cf-fuel" className="block text-xs font-medium text-neutral-300 mb-1">
                7. Fuel Type *
              </label>
              <select
                id="cf-fuel"
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as FuelType)}
                className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="Electric">Electric</option>
              </select>
            </div>

            <div>
              <label htmlFor="cf-seats" className="block text-xs font-medium text-neutral-300 mb-1">
                8. Seating Capacity *
              </label>
              <input
                id="cf-seats"
                type="number"
                required
                min={2}
                max={12}
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm font-mono tabular-nums text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="cf-ac" className="block text-xs font-medium text-neutral-300 mb-1">
                9. AC *
              </label>
              <select
                id="cf-ac"
                value={acAvailable ? 'yes' : 'no'}
                onChange={(e) => setAcAvailable(e.target.value === 'yes')}
                className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
              >
                <option value="yes">Yes (AC Equipped)</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="pt-4 border-t border-neutral-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="cf-daily" className="block text-xs font-medium text-neutral-300 mb-1">
                10. Daily Rental Price (₹) *
              </label>
              <input
                id="cf-daily"
                type="number"
                required
                min={1}
                value={dailyRateInr}
                onChange={(e) => setDailyRateInr(Number(e.target.value))}
                className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm font-mono tabular-nums text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="cf-deposit" className="block text-xs font-medium text-neutral-300 mb-1">
                11. Security Deposit (₹) *
              </label>
              <input
                id="cf-deposit"
                type="number"
                required
                min={0}
                value={securityDepositInr}
                onChange={(e) => setSecurityDepositInr(Number(e.target.value))}
                className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm font-mono tabular-nums text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="cf-extra-hr" className="block text-xs font-medium text-neutral-300 mb-1">
                12. Extra Hour Charges (₹) *
              </label>
              <input
                id="cf-extra-hr"
                type="number"
                required
                min={0}
                value={extraHourRateInr}
                onChange={(e) => setExtraHourRateInr(Number(e.target.value))}
                className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm font-mono tabular-nums text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="cf-weekly" className="block text-xs font-medium text-neutral-400 mb-1">
                Weekly Price (₹, optional)
              </label>
              <input
                id="cf-weekly"
                type="number"
                min={0}
                placeholder="Optional"
                value={weeklyRateInr}
                onChange={(e) => setWeeklyRateInr(e.target.value)}
                className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm font-mono tabular-nums text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="cf-monthly" className="block text-xs font-medium text-neutral-400 mb-1">
                Monthly Price (₹, optional)
              </label>
              <input
                id="cf-monthly"
                type="number"
                min={0}
                placeholder="Optional"
                value={monthlyRateInr}
                onChange={(e) => setMonthlyRateInr(e.target.value)}
                className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm font-mono tabular-nums text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="cf-extra-km" className="block text-xs font-medium text-neutral-400 mb-1">
                Extra Km Rate (₹/km)
              </label>
              <input
                id="cf-extra-km"
                type="number"
                min={0}
                value={extraKmRateInr}
                onChange={(e) => setExtraKmRateInr(Number(e.target.value))}
                className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm font-mono tabular-nums text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Description & Features */}
          <div className="pt-4 border-t border-neutral-800 grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="cf-desc" className="block text-xs font-medium text-neutral-300 mb-1">
                13. Car Description
              </label>
              <textarea
                id="cf-desc"
                rows={2}
                placeholder="Describe comfort, boot capacity, and ideal Bhopal / MP routes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="cf-features" className="block text-xs font-medium text-neutral-300 mb-1">
                14. Car Features (comma-separated)
              </label>
              <input
                id="cf-features"
                type="text"
                placeholder="FASTag Preloaded, Apple CarPlay, Rear Camera, ABS"
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Search appearance */}
          <div className="pt-4 border-t border-neutral-800 grid grid-cols-1 gap-4">
            <div>
              <p className="text-xs font-semibold text-neutral-300">Car search appearance</p>
              <p className="mt-1 text-[11px] text-neutral-500">
                Public detail URL: /cars/{editingCar ? getCarSlug(editingCar) : `${slugify(name) || 'car'}-<unique-id>`}
              </p>
            </div>
            <div>
              <label htmlFor="cf-seo-title" className="block text-xs font-medium text-neutral-300 mb-1">
                Car SEO Title
              </label>
              <input
                id="cf-seo-title"
                type="text"
                maxLength={70}
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Defaults to car name + self drive rental in Bhopal"
                className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label htmlFor="cf-seo-description" className="block text-xs font-medium text-neutral-300 mb-1">
                Car Meta Description
              </label>
              <textarea
                id="cf-seo-description"
                rows={2}
                maxLength={200}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="A concise, accurate summary of this car and its rental details"
                className="w-full p-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label htmlFor="cf-image-alt" className="block text-xs font-medium text-neutral-300 mb-1">
                Car Image Alt Text
              </label>
              <input
                id="cf-image-alt"
                type="text"
                maxLength={150}
                value={imageAltText}
                onChange={(e) => setImageAltText(e.target.value)}
                placeholder="Describe the visible car and view"
                className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* 15. Multiple Car Images */}
          <div className="pt-4 border-t border-neutral-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-neutral-300">
                  15. Multiple Car Images (Compressed &amp; Stored Outside DB) *
                </p>
                <p className="text-[11px] text-neutral-500">
                  Upload JPG, PNG, or WebP photos. Click the star to choose the primary listing photo.
                </p>
              </div>

              <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-orange-500" />
                <span>{uploading ? 'Optimizing & Uploading...' : 'Upload Photos'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={uploading}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Optional direct URL input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Or paste existing image URL (/uploads/cars/... or https://...)"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="flex-1 h-9 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="inline-flex items-center gap-1 px-3 h-9 text-xs font-medium text-neutral-200 bg-neutral-900 border border-neutral-700 hover:border-neutral-500 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add URL</span>
              </button>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {images.map((url) => {
                  const isPrimary = primaryImageUrl === url;
                  return (
                    <div
                      key={url}
                      className={`relative rounded-lg overflow-hidden border bg-neutral-900 ${
                        isPrimary ? 'border-orange-500' : 'border-neutral-800'
                      }`}
                    >
                      <div className="aspect-[4/3]">
                        <img
                          src={url}
                          alt="Car upload preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2 flex items-center justify-between gap-1 bg-[#09090B]">
                        <button
                          type="button"
                          onClick={() => setPrimaryImageUrl(url)}
                          className={`inline-flex items-center gap-1 text-[11px] font-medium cursor-pointer ${
                            isPrimary ? 'text-orange-400' : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          <Star className={`w-3 h-3 ${isPrimary ? 'fill-orange-500' : ''}`} />
                          <span>{isPrimary ? 'Primary' : 'Set Primary'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(url)}
                          aria-label="Remove image"
                          className="text-neutral-500 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 16 & 17: Featured & Availability Status */}
          <div className="pt-4 border-t border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cf-featured" className="block text-xs font-medium text-neutral-300 mb-1">
                16. Featured Car *
              </label>
              <select
                id="cf-featured"
                value={featured ? 'yes' : 'no'}
                onChange={(e) => setFeatured(e.target.value === 'yes')}
                className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
              >
                <option value="yes">Yes (Show in Featured Fleet)</option>
                <option value="no">No</option>
              </select>
            </div>

            <div>
              <label htmlFor="cf-status" className="block text-xs font-medium text-neutral-300 mb-1">
                17. Availability Status *
              </label>
              <select
                id="cf-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as AvailabilityStatus)}
                className="w-full h-10 px-3 bg-[#09090B] border border-neutral-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
              >
                <option value="Available">Available</option>
                <option value="Booked">Booked</option>
                <option value="Unavailable">Unavailable</option>
                <option value="Under Maintenance">Under Maintenance</option>
              </select>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="p-3 text-xs font-medium text-red-400 bg-red-950/50 border border-red-900 rounded-lg"
            >
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-neutral-300 hover:text-white border border-neutral-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-lg cursor-pointer"
            >
              {saving ? 'Saving Car...' : 'Save Car'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
