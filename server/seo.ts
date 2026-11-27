import {
  getCarSlug,
  getSeoPage,
  LIVE_SITE_ORIGIN,
  SEO_PAGES,
  type SeoPageData,
} from '../src/data/seo.ts';
import type { Car, PageSeoOverride, SiteSettings } from '../src/types/rental.ts';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeXml(value: string): string {
  return escapeHtml(value).replace(/'/g, '&apos;');
}

function renderPageContent(page: SeoPageData, cars: Car[], settings: SiteSettings): string {
  const listedCars = page.category
    ? cars.filter((car) => car.category === page.category)
    : ['cars', 'home', 'bhopal'].includes(page.key)
      ? cars
      : [];
  const categoryLinks = [
    { href: '/cars', label: 'All cars' },
    { href: '/cars/hatchback', label: 'Hatchbacks' },
    { href: '/cars/sedan', label: 'Sedans' },
    { href: '/cars/suv', label: 'SUVs' },
  ];
  const relatedLinks = [
    { href: '/self-drive-car-rental-bhopal', label: 'Self Drive Rental in Bhopal' },
    ...categoryLinks,
    { href: '/about', label: 'About 24 Self Drive' },
    { href: '/contact', label: 'Contact' },
    { href: '/rental-policies', label: 'Rental policies' },
    { href: '/blog', label: 'Bhopal travel guide' },
  ];
  const sections = page.sections.map((section) => `
    <section class="mt-9">
      <h2 class="font-display text-xl font-semibold sm:text-2xl">${escapeHtml(section.heading)}</h2>
      ${section.paragraphs.map((paragraph) => `<p class="mt-3 leading-7 text-neutral-700">${escapeHtml(paragraph)}</p>`).join('')}
      ${section.items?.length ? `<ul class="mt-3 list-disc space-y-2 pl-6 leading-7 text-neutral-700">${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
    </section>
  `).join('');
  const carDetail = page.car
    ? `<div class="mt-8 grid gap-8 md:grid-cols-2">
        <img src="${escapeHtml(page.car.imageUrl)}" alt="${escapeHtml(page.car.imageAltText?.trim() || `${page.car.name} ${page.car.category.toLowerCase()} available for self-drive rental in Bhopal`)}" width="800" height="600" fetchpriority="high" decoding="async" class="aspect-[4/3] w-full rounded-xl bg-neutral-100 object-cover" />
        <div>
          <h2 class="font-display text-2xl font-semibold">Rental overview</h2>
          <p class="mt-3 text-neutral-700">₹${page.car.dailyRateInr.toLocaleString('en-IN')} per day · ${page.car.freeKmPerDay} included km per day · ${page.car.seats} seats</p>
          <p class="mt-2 text-sm text-neutral-600">The booking summary shows applicable deposit and charges. Confirm availability for your dates.</p>
          <a href="/" class="mt-5 inline-flex rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700">Check availability</a>
        </div>
      </div>`
    : '';
  const carCards =
    page.key === 'cars' || page.key === 'home' || page.key === 'bhopal' || page.category
      ? `<section aria-labelledby="listed-cars" class="mt-12">
          <h2 id="listed-cars" class="font-display text-2xl font-bold">${
            page.category
              ? `${escapeHtml(page.category)} cars currently listed`
              : page.key === 'home'
                ? 'Featured self-drive cars'
                : 'Cars currently listed'
          }</h2>
          <nav aria-label="Car categories" class="mt-4 flex flex-wrap gap-3">
            ${categoryLinks.map((link) => `<a href="${link.href}" class="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:border-orange-500">${link.label}</a>`).join('')}
          </nav>
          ${
            listedCars.length
              ? `<div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">${listedCars.map((car) => `<article class="overflow-hidden rounded-xl border border-neutral-200">
                  <a href="/cars/${escapeHtml(getCarSlug(car))}" class="block">
                    <img src="${escapeHtml(car.imageUrl)}" alt="${escapeHtml(car.imageAltText?.trim() || `${car.name} ${car.category.toLowerCase()} self-drive car in Bhopal`)}" width="800" height="600" loading="lazy" decoding="async" class="aspect-[4/3] w-full bg-neutral-100 object-cover" />
                    <div class="p-5">
                      <h3 class="font-display text-lg font-bold">${escapeHtml(car.name)}</h3>
                      <p class="mt-1 text-sm text-neutral-600">${escapeHtml(car.category)} · ${escapeHtml(car.transmission)} · ${car.seats} seats</p>
                      <p class="mt-3 font-semibold">₹${car.dailyRateInr.toLocaleString('en-IN')} / day</p>
                      <span class="mt-3 inline-block text-sm font-semibold text-orange-700">View car details</span>
                    </div>
                  </a>
                </article>`).join('')}</div>`
              : '<p class="mt-5 text-neutral-600">No vehicles in this category are currently listed. Browse all cars or contact us about upcoming availability.</p>'
          }
        </section>`
      : '';
  const contact =
    page.key === 'contact'
      ? `<section class="mt-8 rounded-xl bg-neutral-50 p-6">
          <h2 class="font-display text-xl font-semibold">Business contact</h2>
          <address class="mt-3 not-italic leading-7 text-neutral-700">
            <p>${escapeHtml(settings.businessAddress || 'Bhopal, Madhya Pradesh, India')}</p>
            <p><a href="tel:${escapeHtml((settings.contactNumber || '').replace(/[^\d+]/g, ''))}">${escapeHtml(settings.contactNumber)}</a></p>
            ${settings.email ? `<p><a href="mailto:${escapeHtml(settings.email)}">${escapeHtml(settings.email)}</a></p>` : ''}
            ${settings.whatsappNumber ? `<p><a href="https://wa.me/${escapeHtml(settings.whatsappNumber.replace(/\D/g, ''))}">Message 24 Self Drive on WhatsApp</a></p>` : ''}
          </address>
        </section>`
      : '';

  return `<div class="min-h-screen bg-white text-neutral-950">
    <header class="border-b border-neutral-200 bg-neutral-950 text-white">
      <nav aria-label="Main navigation" class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <a href="/" class="font-display text-lg font-bold">24 Self Drive</a>
        <div class="flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-200">
          <a href="/cars">All cars</a><a href="/about">About</a><a href="/contact">Contact</a><a href="/rental-policies">Rental policies</a><a href="/blog">Travel guide</a>
        </div>
      </nav>
    </header>
    <main class="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <nav aria-label="Breadcrumb" class="mb-6 text-sm text-neutral-600">
        <ol class="flex flex-wrap items-center gap-2"><li><a href="/" class="underline underline-offset-2">Home</a></li>${page.path !== '/' ? `<li aria-hidden="true">/</li><li aria-current="page">${escapeHtml(page.heading)}</li>` : ''}</ol>
      </nav>
      <article class="max-w-4xl">
        <h1 class="font-display text-3xl font-bold tracking-tight sm:text-5xl">${escapeHtml(page.heading)}</h1>
        <p class="mt-5 max-w-3xl text-base leading-7 text-neutral-700 sm:text-lg">${escapeHtml(page.intro)}</p>
        ${carDetail}
        ${sections}
      </article>
      ${carCards}
      ${contact}
      <nav aria-label="Related pages" class="mt-12 border-t border-neutral-200 pt-6">
        <ul class="flex flex-wrap gap-x-5 gap-y-3 text-sm text-orange-800">${relatedLinks.map((link) => `<li><a href="${link.href}" class="underline underline-offset-2">${link.label}</a></li>`).join('')}</ul>
      </nav>
    </main>
    <footer class="border-t border-neutral-200 bg-neutral-50">
      <div class="mx-auto max-w-6xl px-4 py-6 text-sm text-neutral-600 sm:px-6">24 Self Drive · Self-drive car rental in Bhopal, Madhya Pradesh</div>
    </footer>
  </div>`;
}

function absoluteUrl(value: string, origin: string): string {
  try {
    return new URL(value, origin).toString();
  } catch {
    return origin;
  }
}

function setMetaTag(html: string, attribute: 'name' | 'property', key: string, value: string): string {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tag = new RegExp(`<meta\\s+${attribute}="${escapedKey}"[^>]*>`, 'i');
  const meta = `<meta ${attribute}="${escapeHtml(key)}" content="${escapeHtml(value)}" />`;
  return tag.test(html)
    ? html.replace(tag, meta)
    : html.replace('</head>', `    ${meta}\n  </head>`);
}

function setCanonical(html: string, canonical: string): string {
  const tag = '<link rel="canonical" href="' + escapeHtml(canonical) + '" />';
  return /<link\s+rel="canonical"[^>]*>/i.test(html)
    ? html.replace(/<link\s+rel="canonical"[^>]*>/i, tag)
    : html.replace('</head>', `    ${tag}\n  </head>`);
}

function makeBreadcrumbSchema(page: SeoPageData, origin: string) {
  const items = [{ name: 'Home', url: `${origin}/` }];
  if (page.car) items.push({ name: 'Cars', url: `${origin}/cars` });
  if (page.path !== '/') items.push({ name: page.heading, url: absoluteUrl(page.path, origin) });
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function makeStructuredData(
  page: SeoPageData,
  cars: Car[],
  settings: SiteSettings,
  origin: string,
) {
  const brand = {
    '@type': 'Organization',
    '@id': `${origin}/#organization`,
    name: settings.businessName,
    url: `${origin}/`,
    telephone: settings.contactNumber,
    areaServed: { '@type': 'City', name: 'Bhopal', containedInPlace: 'Madhya Pradesh, India' },
    ...(settings.logoUrl ? { logo: absoluteUrl(settings.logoUrl, origin) } : {}),
  };
  const rentalBusiness = {
    '@type': 'AutoRental',
    '@id': `${origin}/#business`,
    name: settings.businessName,
    url: `${origin}/`,
    telephone: settings.contactNumber,
    parentOrganization: { '@id': `${origin}/#organization` },
    areaServed: { '@type': 'City', name: 'Bhopal', containedInPlace: 'Madhya Pradesh, India' },
  };
  const graph: Record<string, unknown>[] = [brand, rentalBusiness, makeBreadcrumbSchema(page, origin)];

  if (page.car) {
    const car = page.car;
    graph.push({
      '@type': 'Vehicle',
      '@id': `${origin}${page.path}#vehicle`,
      name: car.name,
      brand: { '@type': 'Brand', name: car.brand },
      model: car.model,
      vehicleModelDate: String(car.modelYear),
      vehicleConfiguration: car.variant,
      fuelType: car.fuelType,
      vehicleTransmission: car.transmission,
      numberOfSeats: car.seats,
      image: absoluteUrl(car.imageUrl, origin),
      description: page.description,
      offers: {
        '@type': 'Offer',
        url: `${origin}${page.path}`,
        priceCurrency: 'INR',
        price: car.dailyRateInr,
        availability:
          car.status === 'Available'
            ? 'https://schema.org/InStock'
            : 'https://schema.org/LimitedAvailability',
        seller: { '@id': `${origin}/#business` },
      },
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

export interface RenderedSeoPage {
  html: string;
  page: SeoPageData;
  canonical: string;
  robots: string;
}

export function renderSeoDocument(
  template: string,
  pathname: string,
  cars: Car[],
  settings: SiteSettings,
  origin: string,
  googleSiteVerification = '',
): RenderedSeoPage | null {
  const page = getSeoPage(pathname, cars);
  if (!page) return null;

  const override: PageSeoOverride = settings.pageSeo?.[page.key] ?? {};
  const title = override.title?.trim() || page.title;
  const description = override.description?.trim() || page.description;
  const canonical = override.canonicalUrl?.trim() || absoluteUrl(page.path, origin);
  const robots = override.robots || 'index,follow';
  const carImage = page.car?.imageUrl;
  const ogImage =
    override.ogImage ||
    carImage ||
    settings.logoUrl ||
    '/src/assets/images/hero_bhopal_suv_1795412733764.webp';
  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = setMetaTag(html, 'name', 'description', description);
  html = setMetaTag(html, 'name', 'robots', robots);
  html = setMetaTag(html, 'property', 'og:site_name', settings.businessName);
  html = setMetaTag(html, 'property', 'og:type', page.car ? 'product' : 'website');
  html = setMetaTag(html, 'property', 'og:title', title);
  html = setMetaTag(html, 'property', 'og:description', description);
  html = setMetaTag(html, 'property', 'og:url', canonical);
  html = setMetaTag(html, 'name', 'twitter:card', ogImage ? 'summary_large_image' : 'summary');
  html = setMetaTag(html, 'name', 'twitter:title', title);
  html = setMetaTag(html, 'name', 'twitter:description', description);
  if (ogImage) {
    const imageUrl = absoluteUrl(ogImage, origin);
    html = setMetaTag(html, 'property', 'og:image', imageUrl);
    html = setMetaTag(html, 'name', 'twitter:image', imageUrl);
  }
  html = setCanonical(html, canonical);
  if (googleSiteVerification) {
    html = setMetaTag(html, 'name', 'google-site-verification', googleSiteVerification);
  }

  const schema = JSON.stringify(makeStructuredData(page, cars, settings, origin)).replace(/</g, '\\u003c');
  const schemaTag = `<script type="application/ld+json">${schema}</script>`;
  html = /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i.test(html)
    ? html.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i, schemaTag)
    : html.replace('</head>', `    ${schemaTag}\n  </head>`);
  const gaId = settings.ga4MeasurementId || '';
  if (/^G-[A-Z0-9]{4,20}$/.test(gaId)) {
    const analytics = `<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');</script>`;
    html = html.replace('</head>', `${analytics}\n  </head>`);
  }

  const content = renderPageContent(page, cars, settings);
  html = html.replace('<div id="root"></div>', `<div id="root">${content}</div>`);
  return { html, page, canonical, robots };
}

export function buildRobotsTxt(origin: string): string {
  return `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`;
}

export function buildSitemapXml(cars: Car[], settings: SiteSettings, origin: string): string {
  const siteOrigin = origin || LIVE_SITE_ORIGIN;
  const urls = SEO_PAGES.filter((page) => {
    const override = settings.pageSeo?.[page.key];
    return override?.robots !== 'noindex,follow' && override?.robots !== 'noindex,nofollow';
  }).map((page) => {
    const canonical =
      settings.pageSeo?.[page.key]?.canonicalUrl?.trim() || absoluteUrl(page.path, siteOrigin);
    return { loc: canonical, lastmod: undefined as string | undefined };
  });

  for (const car of cars) {
    if (car.isArchived) continue;
    const path = `/cars/${getCarSlug(car)}`;
    const override = settings.pageSeo?.[`car:${getCarSlug(car)}`];
    if (override?.robots === 'noindex,follow' || override?.robots === 'noindex,nofollow') continue;
    urls.push({
      loc: override?.canonicalUrl?.trim() || absoluteUrl(path, siteOrigin),
      lastmod: car.updatedAt ? new Date(car.updatedAt).toISOString().slice(0, 10) : undefined,
    });
  }

  const entries = urls
    .map(
      ({ loc, lastmod }) =>
        `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

export function getSeoStaticPaths(): string[] {
  return SEO_PAGES.map((page) => page.path);
}
