import type { Car, SiteSettings } from '../types/rental.ts';
import { getCarSlug, type SeoPageData } from '../data/seo.ts';

interface SeoPageProps {
  page: SeoPageData;
  cars: Car[];
  settings: SiteSettings | null;
}

const CATEGORY_LINKS = [
  { href: '/cars', label: 'All cars' },
  { href: '/cars/hatchback', label: 'Hatchbacks' },
  { href: '/cars/sedan', label: 'Sedans' },
  { href: '/cars/suv', label: 'SUVs' },
];

export function SeoPage({ page, cars, settings }: SeoPageProps) {
  const listedCars = page.category
    ? cars.filter((car) => car.category === page.category)
    : ['cars', 'home', 'bhopal'].includes(page.key)
      ? cars
      : [];
  const contactPhone = settings?.contactNumber || '+91 93032 59841';
  const email = settings?.email?.trim() || '';

  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <header className="border-b border-neutral-200 bg-neutral-950 text-white">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6"
        >
          <a href="/" className="font-display text-lg font-bold">
            24 Self Drive
          </a>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-200">
            <a href="/cars">All cars</a>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
            <a href="/rental-policies">Rental policies</a>
            <a href="/blog">Travel guide</a>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-neutral-600">
          <ol className="flex flex-wrap items-center gap-2">
            <li><a href="/" className="underline underline-offset-2">Home</a></li>
            {page.path !== '/' && (
              <>
                <li aria-hidden="true">/</li>
                <li aria-current="page">{page.heading}</li>
              </>
            )}
          </ol>
        </nav>

        <article className="max-w-4xl">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
            {page.heading}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-neutral-700 sm:text-lg">
            {page.intro}
          </p>

          {page.car && (
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <img
                src={page.car.imageUrl}
                alt={
                  page.car.imageAltText?.trim() ||
                  `${page.car.name} ${page.car.category.toLowerCase()} available for self-drive rental in Bhopal`
                }
                width="800"
                height="600"
                fetchPriority="high"
                decoding="async"
                className="aspect-[4/3] w-full rounded-xl bg-neutral-100 object-cover"
              />
              <div>
                <h2 className="font-display text-2xl font-semibold">Rental overview</h2>
                <p className="mt-3 text-neutral-700">
                  ₹{page.car.dailyRateInr.toLocaleString('en-IN')} per day ·{' '}
                  {page.car.freeKmPerDay} included km per day · {page.car.seats} seats
                </p>
                <p className="mt-2 text-sm text-neutral-600">
                  The booking summary shows applicable deposit and charges. Confirm availability for your dates.
                </p>
                <a
                  href="/"
                  className="mt-5 inline-flex rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700"
                >
                  Check availability
                </a>
              </div>
            </div>
          )}

          {page.sections.map((section) => (
            <section key={section.heading} className="mt-9">
              <h2 className="font-display text-xl font-semibold sm:text-2xl">
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-3 leading-7 text-neutral-700">
                  {paragraph}
                </p>
              ))}
              {section.items && section.items.length > 0 && (
                <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-neutral-700">
                  {section.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </section>
          ))}
        </article>

        {(page.key === 'cars' || page.key === 'home' || page.key === 'bhopal' || page.category) && (
          <section aria-labelledby="listed-cars" className="mt-12">
            <h2 id="listed-cars" className="font-display text-2xl font-bold">
              {page.category
                ? `${page.category} cars currently listed`
                : page.key === 'home'
                  ? 'Featured self-drive cars'
                  : 'Cars currently listed'}
            </h2>
            <nav aria-label="Car categories" className="mt-4 flex flex-wrap gap-3">
              {CATEGORY_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:border-orange-500"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            {listedCars.length > 0 ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {listedCars.map((car) => (
                  <article key={car.id} className="overflow-hidden rounded-xl border border-neutral-200">
                    <a href={`/cars/${getCarSlug(car)}`} className="block">
                      <img
                        src={car.imageUrl}
                        alt={
                          car.imageAltText?.trim() ||
                          `${car.name} ${car.category.toLowerCase()} self-drive car in Bhopal`
                        }
                        width="800"
                        height="600"
                        loading="lazy"
                        decoding="async"
                        className="aspect-[4/3] w-full bg-neutral-100 object-cover"
                      />
                      <div className="p-5">
                        <h3 className="font-display text-lg font-bold">{car.name}</h3>
                        <p className="mt-1 text-sm text-neutral-600">
                          {car.category} · {car.transmission} · {car.seats} seats
                        </p>
                        <p className="mt-3 font-semibold">
                          ₹{car.dailyRateInr.toLocaleString('en-IN')} / day
                        </p>
                        <span className="mt-3 inline-block text-sm font-semibold text-orange-700">
                          View car details
                        </span>
                      </div>
                    </a>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-neutral-600">
                No vehicles in this category are currently listed. Browse all cars or contact us about upcoming availability.
              </p>
            )}
          </section>
        )}

        {page.key === 'contact' && (
          <section className="mt-8 rounded-xl bg-neutral-50 p-6">
            <h2 className="font-display text-xl font-semibold">Business contact</h2>
            <address className="mt-3 not-italic leading-7 text-neutral-700">
              <p>{settings?.businessAddress || 'Bhopal, Madhya Pradesh, India'}</p>
              <p><a href={`tel:${contactPhone.replace(/[^\d+]/g, '')}`}>{contactPhone}</a></p>
              {email && <p><a href={`mailto:${email}`}>{email}</a></p>}
              {settings?.whatsappNumber && (
                <p>
                  <a href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`}>
                    Message 24 Self Drive on WhatsApp
                  </a>
                </p>
              )}
            </address>
          </section>
        )}

        <nav aria-label="Related pages" className="mt-12 border-t border-neutral-200 pt-6">
          <ul className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-orange-800">
            {SEO_LINKS.map((link) => (
              <li key={link.href}><a href={link.href} className="underline underline-offset-2">{link.label}</a></li>
            ))}
          </ul>
        </nav>
      </main>
      <footer className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-neutral-600 sm:px-6">
          24 Self Drive · Self-drive car rental in Bhopal, Madhya Pradesh
        </div>
      </footer>
    </div>
  );
}

const SEO_LINKS = [
  { href: '/self-drive-car-rental-bhopal', label: 'Self Drive Rental in Bhopal' },
  ...CATEGORY_LINKS,
  { href: '/about', label: 'About 24 Self Drive' },
  { href: '/contact', label: 'Contact' },
  { href: '/rental-policies', label: 'Rental policies' },
  { href: '/blog', label: 'Bhopal travel guide' },
];
