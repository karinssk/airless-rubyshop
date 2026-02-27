import dynamic from "next/dynamic";
import Image from "next/image";
import { resolveUploadUrl } from "@/lib/urls";
import HlsVideoPlayer from "./HlsVideoPlayer";
import GoogleAdsPhoneConversionLink from "./GoogleAdsPhoneConversionLink";
import GoogleAdsConversionLink from "./GoogleAdsConversionLink";

// Loading skeleton for blocks
function BlockSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className={`${height} w-full animate-pulse bg-slate-100`}>
      <div className="mx-auto flex h-full max-w-6xl items-center justify-center px-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-400" />
      </div>
    </div>
  );
}

// Dynamic imports with lazy loading
const AchievementExperience = dynamic(() => import("./AchievementExperience"), {
  loading: () => <BlockSkeleton height="h-48" />,
  ssr: true,
});

const GalleryLightbox = dynamic(() => import("./GalleryLightbox"), {
  loading: () => <BlockSkeleton height="h-96" />,
  ssr: true,
});

const HeroSlider = dynamic(() => import("./HeroSlider"), {
  loading: () => <BlockSkeleton height="h-[400px]" />,
  ssr: true,
});

const ImageSlider = dynamic(() => import("./ImageSlider"), {
  loading: () => <BlockSkeleton height="h-64" />,
  ssr: true,
});

const HeroWithAvailableRoomsCheck = dynamic(() => import("./HeroWithAvailableRoomsCheck"), {
  loading: () => <BlockSkeleton height="h-[500px]" />,
  ssr: true,
});

const OurCoreServices = dynamic(() => import("./OurCoreServices"), {
  loading: () => <BlockSkeleton height="h-96" />,
  ssr: true,
});

const OurPortfolio = dynamic(() => import("./OurPortfolio"), {
  loading: () => <BlockSkeleton height="h-96" />,
  ssr: true,
});

const ReadyForService = dynamic(() => import("./ReadyForService"), {
  loading: () => <BlockSkeleton height="h-48" />,
  ssr: true,
});

const ServiceProcess = dynamic(() => import("./ServiceProcess"), {
  loading: () => <BlockSkeleton height="h-64" />,
  ssr: true,
});

const RequestQuotationForm = dynamic(() => import("./RequestQuotationForm"), {
  loading: () => <BlockSkeleton height="h-96" />,
  ssr: true,
});

const WhyChooseUs = dynamic(() => import("./WhyChooseUs"), {
  loading: () => <BlockSkeleton height="h-64" />,
  ssr: true,
});

const TopProductsSales = dynamic(() => import("./TopProductsSales"), {
  loading: () => <BlockSkeleton height="h-80" />,
  ssr: true,
});

const FeaturedCategories = dynamic(() => import("./FeaturedCategories"), {
  loading: () => <BlockSkeleton height="h-72" />,
  ssr: true,
});

const HeroImagesWithButton = dynamic(() => import("./HeroImagesWithButton"), {
  loading: () => <BlockSkeleton height="h-[500px]" />,
  ssr: true,
});

type Block = {
  type: string;
  props: Record<string, any>;
};

type LocalizedString = string | Record<string, string>;

type Page = {
  title: LocalizedString;
  slug: string;
  seo?: {
    title?: LocalizedString;
    description?: LocalizedString;
  };
  theme?: {
    background?: string;
  };
  layout: Block[];
};

const safeList = (value?: string) => (value ? String(value) : "");
const resolveImage = (value?: string) => resolveUploadUrl(safeList(value));
const extractMapEmbedSrc = (value?: string) => {
  const raw = safeList(value).trim();
  const match = raw.match(/<iframe[^>]*src=["']([^"']+)["']/i);
  return match ? match[1] : raw;
};
const isProbablyImage = (value?: string) =>
  Boolean(value && /^(https?:|\/|uploads\/)/i.test(value));
const isEmbeddableMapUrl = (value?: string) =>
  Boolean(value && /google\.com\/maps\/embed\?/i.test(value));

const extractYouTubeId = (value?: string) => {
  const raw = safeList(value).trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "");
    }
    if (url.hostname.includes("youtube.com")) {
      if (url.searchParams.get("v")) return url.searchParams.get("v") || "";
      const paths = url.pathname.split("/").filter(Boolean);
      const embedIndex = paths.indexOf("embed");
      if (embedIndex !== -1 && paths[embedIndex + 1]) {
        return paths[embedIndex + 1];
      }
      const shortsIndex = paths.indexOf("shorts");
      if (shortsIndex !== -1 && paths[shortsIndex + 1]) {
        return paths[shortsIndex + 1];
      }
    }
  } catch {
    return "";
  }
  return "";
};

export default function PageRenderer({ page }: { page: Page }) {
  const background = page.theme?.background;
  return (
    <div
      className="min-h-screen text-slate-900"
      style={background ? { background } : undefined}
    >
      {page.layout.map((block, index) => {
        switch (block.type) {
          case "hero":
            return <Hero key={index} {...block.props} />;
          case "landing-hero-01":
            return <LandingHero01 key={index} {...block.props} />;
          case "hero-images":
            return <HeroImages key={index} {...block.props} />;
          case "youtube-embed":
            return <YouTubeEmbed key={index} {...block.props} />;
          case "video-hls-01":
            return <VideoHls01 key={index} {...block.props} />;
          case "customer-reviews-images":
            return <CustomerReviewsImages key={index} {...block.props} />;
          case "hero-with-available-rooms-check":
            return <HeroWithAvailableRoomsCheck key={index} {...block.props} />;
          case "contact-and-services":
            return <ContactAndServices key={index} {...block.props} />;
          case "about-us-text":
            return <AboutUsText key={index} {...block.props} />;
          case "about-us-images":
            return <AboutUsImages key={index} {...block.props} />;
          case "branches-detail":
            return <BranchesDetail key={index} {...block.props} />;
          case "contact-info-card":
            return <ContactInfoCard key={index} {...block.props} />;
          case "google-map":
            return <GoogleMap key={index} {...block.props} />;
          case "our-vision":
            return <OurVision key={index} {...block.props} />;
          case "our-core-values":
            return <OurCoreValues key={index} {...block.props} />;
          case "why-choose-us-v2":
            return <WhyChooseUsV2 key={index} {...block.props} />;
          case "work-with-us":
            return <WorkWithUs key={index} {...block.props} />;
          case "welfare-and-benefits":
            return <WelfareAndBenefits key={index} {...block.props} />;
          case "job-vacancies":
            return <JobVacancies key={index} {...block.props} />;
          case "request-quotation-forms":
            return <RequestQuotationForm key={index} {...block.props} />;
          case "contact-channels":
            return <ContactChannels key={index} {...block.props} />;
          case "contact-us-text":
            return <ContactUsText key={index} {...block.props} />;
          case "achievement-expreience":
            return <AchievementExperience key={index} {...block.props} />;
          case "why-choose-us":
            return <WhyChooseUs key={index} {...block.props} />;
          case "our-core-services":
            return <OurCoreServices key={index} {...block.props} />;
          case "service-process":
            return <ServiceProcess key={index} {...block.props} />;
          case "ready-for-service":
            return <ReadyForService key={index} {...block.props} />;
          case "our-portfolio":
            return <OurPortfolio key={index} {...block.props} />;
          case "our-work":
            return <OurWork key={index} {...block.props} />;
          case "our-work-gallery":
            return <OurWorkGallery key={index} {...block.props} />;
          case "grand-events":
            return <GrandEvents key={index} {...block.props} />;
          case "wellness-facilities":
            return <WellnessFacilities key={index} {...block.props} />;
          case "images-slider":
            return <ImagesSlider key={index} {...block.props} />;
          case "services":
            return <Services key={index} {...block.props} />;
          case "products-section-images":
            return <ProductsSectionImages key={index} {...block.props} />;
          case "features":
            return <Features key={index} {...block.props} />;
          case "gallery":
            return <Gallery key={index} {...block.props} />;
          case "faq":
            return <FrequentlyAskedQuestions key={index} {...block.props} />;
          case "frequently-asked-questions":
            return <FrequentlyAskedQuestions key={index} {...block.props} />;
          case "contact":
            return <Contact key={index} {...block.props} />;
          case "top-products-sales":
            return <TopProductsSales key={index} {...block.props} />;
          case "featured-categories":
            return <FeaturedCategories key={index} {...block.props} />;
          case "hero-images-with-button":
            return <HeroImagesWithButton key={index} {...block.props} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

function LandingHero01(props: Record<string, any>) {
  const backgroundImage = resolveImage(props.backgroundImage);
  const backgroundImageMobile = resolveImage(props.backgroundImageMobile);
  const overlayOpacity = Math.min(
    0.85,
    Math.max(0.2, Number(props.overlayOpacity) || 0.55)
  );
  const logoUrl = resolveImage(props.logoUrl);

  return (
    <section className="relative min-h-[300px] overflow-hidden aspect-[4/5] sm:aspect-[4/5] md:aspect-auto sm:min-h-[380px] lg:min-h-[600px]">
      {backgroundImageMobile ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center md:hidden"
            style={{ backgroundImage: `url(${backgroundImageMobile})` }}
          />
          <div
            className="absolute inset-0 hidden bg-cover bg-center md:block"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
        </>
      ) : backgroundImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      ) : null}
      <div
        className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/70 to-transparent"
        style={{ opacity: overlayOpacity }}
      />
      <div className="absolute inset-0">
        <div className="mx-auto flex h-full max-w-6xl flex-col items-start justify-end gap-4 px-4 pb-8 pt-6 text-left text-white sm:gap-6 sm:px-6 sm:pb-12 sm:pt-8 lg:pb-16">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="h-10 w-auto object-contain"
            />
          ) : null}
          <div className="max-w-[520px] space-y-3 sm:space-y-4">
            <h1 className="text-2xl font-semibold leading-tight drop-shadow sm:text-4xl lg:text-5xl whitespace-pre-line">
              {safeList(props.title)}
            </h1>
            <p className="text-xs text-white/80 drop-shadow sm:text-base whitespace-pre-line">
              {safeList(props.description)}
            </p>
            {props.buttonText ? (
              <GoogleAdsConversionLink
                href={safeList(props.buttonHref) || "#"}
                sendTo="AW-1065750118/2OqdCMSD8f8bEOacmPwD"
                value={110.0}
                currency="THB"
                className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-black/20 sm:px-5 sm:py-3 sm:text-sm"
              >
                {safeList(props.buttonText)}
              </GoogleAdsConversionLink>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutUsImages(props: Record<string, any>) {
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  return (
    <section className="py-10 md:py-16" style={backgroundStyle}>
      <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold text-[var(--brand-navy)] whitespace-pre-line">
            {safeList(props.heading)}
          </h2>
          <p className="text-sm text-slate-800 whitespace-pre-line">
            {safeList(props.description)}
          </p>
        </div>
        <div className="overflow-hidden rounded-3xl bg-white/70 shadow-xl shadow-slate-900/10">
          {props.image ? (
            <img
              src={resolveImage(props.image)}
              alt={safeList(props.heading) || "About RUBYSHOP"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-slate-400">
              No image
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function BranchesDetail(props: Record<string, any>) {
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  const branches = (props.branches || []) as Array<Record<string, any>>;
  const branch = branches[0];
  return (
    <section className="py-10 md:py-16" style={backgroundStyle}>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6">
        <h2 className="text-center text-3xl font-semibold text-[var(--brand-navy)]">
          {safeList(props.heading)}
        </h2>
        <div className="grid gap-6 md:grid-cols-[0.45fr_0.55fr]">
          <div className="rounded-2xl bg-white p-5 shadow-lg shadow-black/10">
            {branch ? (
              <>
                <h3 className="text-base font-semibold text-[var(--brand-navy)]">
                  {safeList(branch.name)}
                </h3>
                <div className="mt-4 grid gap-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-700">
                      📍
                    </span>
                    <div>
                      <p className="font-semibold text-slate-700">ที่อยู่</p>
                      <p className="whitespace-pre-line">
                        {safeList(branch.address)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-700">
                      ☎️
                    </span>
                    <div>
                      <p className="font-semibold text-slate-700">โทรศัพท์</p>
                      <p>{safeList(branch.phone)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-700">
                      ✉️
                    </span>
                    <div>
                      <p className="font-semibold text-slate-700">อีเมล</p>
                      <p>{safeList(branch.email)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-700">
                      🕒
                    </span>
                    <div>
                      <p className="font-semibold text-slate-700">เวลาทำการ</p>
                      <p className="whitespace-pre-line">
                        {safeList(branch.hours)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-700">
                    บริการที่สาขานี้
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(branch.services || []).map(
                      (service: string, serviceIndex: number) => (
                        <span
                          key={`${service}-${serviceIndex}`}
                          className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-600"
                        >
                          {safeList(service)}
                        </span>
                      )
                    )}
                  </div>
                </div>
                <a
                  href={safeList(branch.mapHref) || "#"}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white"
                >
                  📍 {safeList(branch.mapLabel) || "นำทางไปสาขานี้"}
                </a>
              </>
            ) : (
              <div className="text-sm text-slate-500">
                No branch data yet.
              </div>
            )}
          </div>
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/10">
            {branch?.mapHref && isEmbeddableMapUrl(branch.mapHref) ? (
              <iframe
                title="Branch map"
                src={safeList(branch.mapHref)}
                className="h-[420px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="flex h-[420px] flex-col items-center justify-center gap-3 text-center text-sm text-slate-400">
                <span>Map URL must be a Google Maps embed link.</span>
                {branch?.mapHref ? (
                  <a
                    href={safeList(branch.mapHref)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                  >
                    Open in maps
                  </a>
                ) : (
                  <span>Add mapHref to show the map.</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function GoogleMap(props: Record<string, any>) {
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  const heading = safeList(props.heading);
  const mapSrc = extractMapEmbedSrc(props.mapUrl);
  const embedSrc = mapSrc && isEmbeddableMapUrl(mapSrc) ? mapSrc : "";
  const height = Math.max(240, Number(props.height) || 420);

  return (
    <section className="py-10 md:py-16" style={backgroundStyle}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6">
        {heading ? (
          <h2 className="text-center text-3xl font-semibold text-[var(--brand-navy)]">
            {heading}
          </h2>
        ) : null}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-black/10">
          {embedSrc ? (
            <iframe
              title="Google Map"
              src={embedSrc}
              className="w-full"
              style={{ height }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <div
              className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-slate-400"
              style={{ height }}
            >
              <span>Map URL must be a Google Maps embed link.</span>
              {mapSrc ? (
                <a
                  href={mapSrc}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Open in maps
                </a>
              ) : (
                <span>Add mapUrl to show the map.</span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ContactInfoCard(props: Record<string, any>) {
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  const items = (props.items || []) as Array<Record<string, any>>;
  const socials = (props.socials || []) as Array<Record<string, any>>;
  const mapSrc = extractMapEmbedSrc(props.mapUrl);
  const embedSrc = mapSrc && isEmbeddableMapUrl(mapSrc) ? mapSrc : "";
  const mapHeight = Math.max(240, Number(props.mapHeight) || 420);

  return (
    <section className="py-10 md:py-16" style={backgroundStyle}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-8 lg:grid-cols-[0.58fr_0.42fr]">
          <div className="rounded-[32px] bg-white p-8 shadow-2xl shadow-black/10">
            <h2 className="text-2xl font-semibold text-slate-900">
              {safeList(props.heading)}
            </h2>
            <div className="mt-6 grid gap-4">
              {items.map((item, itemIndex) => {
                const icon = safeList(item.icon);
                const iconIsImage = icon && isProbablyImage(icon);
                const value = safeList(item.value);
                const href = safeList(item.href);
                const isPhoneLink = Boolean(href && href.startsWith("tel:"));
                return (
                  <div
                    key={item.id || `${item.title}-${itemIndex}`}
                    className="flex gap-4"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                      {icon ? (
                        iconIsImage ? (
                          <img
                            src={resolveImage(icon)}
                            alt=""
                            className="h-5 w-5 object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-lg">{icon}</span>
                        )
                      ) : (
                        <span className="text-lg">•</span>
                      )}
                    </div>
                    <div className="flex-1 text-sm text-slate-600">
                      <p className="font-semibold text-slate-900">
                        {safeList(item.title)}
                      </p>
                      {href ? (
                        isPhoneLink ? (
                          <GoogleAdsPhoneConversionLink
                            href={href}
                            className="text-slate-800 underline-offset-2 hover:underline whitespace-pre-line"
                          >
                            {value}
                          </GoogleAdsPhoneConversionLink>
                        ) : (
                          <a
                            href={href}
                            className="text-slate-800 underline-offset-2 hover:underline whitespace-pre-line"
                          >
                            {value}
                          </a>
                        )
                      ) : (
                        <p className="text-slate-800 whitespace-pre-line">
                          {value}
                        </p>
                      )}
                      {safeList(item.note) ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {safeList(item.note)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="text-xs font-semibold text-slate-500">
                {safeList(props.socialLabel)}
              </span>
              {socials.map((social, socialIndex) => {
                const icon = safeList(social.icon);
                const iconIsImage = icon && isProbablyImage(icon);
                const href = safeList(social.href) || "#";
                const isLineLink = href.includes("line.me") || href.includes("lin.ee");
                const iconContent = icon ? (
                  iconIsImage ? (
                    <img
                      src={resolveImage(icon)}
                      alt={safeList(social.label)}
                      className="h-4 w-4 object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-sm">{icon}</span>
                  )
                ) : (
                  <span className="text-sm">★</span>
                );
                return isLineLink ? (
                  <GoogleAdsConversionLink
                    key={social.id || `${social.label}-${socialIndex}`}
                    href={href}
                    sendTo="AW-1065750118/HXjpCK-f5_8bEOacmPwD"
                    value={100.0}
                    currency="THB"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                  >
                    {iconContent}
                  </GoogleAdsConversionLink>
                ) : (
                  <a
                    key={social.id || `${social.label}-${socialIndex}`}
                    href={href}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                  >
                    {iconContent}
                  </a>
                );
              })}
            </div>
          </div>
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl shadow-black/10">
            {embedSrc ? (
              <iframe
                title="Contact map"
                src={embedSrc}
                className="w-full"
                style={{ height: mapHeight }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <div
                className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-slate-400"
                style={{ height: mapHeight }}
              >
                <span>Map URL must be a Google Maps embed link.</span>
                {mapSrc ? (
                  <a
                    href={mapSrc}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                  >
                    Open in maps
                  </a>
                ) : (
                  <span>Add mapUrl to show the map.</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function OurVision(props: Record<string, any>) {
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  const cards = (props.cards || []) as Array<Record<string, any>>;
  return (
    <section className="py-10 md:py-16" style={backgroundStyle}>
      <div className="mx-auto grid max-w-5xl gap-6 px-6 md:grid-cols-2">
        {cards.map((card, index) => (
          <div
            key={card.id || `${card.title}-${index}`}
            className="rounded-2xl bg-white p-6 shadow-xl shadow-black/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-blue)] text-white">
              {card.icon ? (
                <img
                  src={resolveImage(card.icon)}
                  alt=""
                  className="h-6 w-6 object-contain brightness-0 invert"
                  loading="lazy"
                />
              ) : (
                <span className="text-sm">★</span>
              )}
            </div>
            <h3 className="mt-4 text-base font-semibold text-[var(--brand-navy)]">
              {safeList(card.title)}
            </h3>
            <p className="text-xs text-[var(--brand-blue)]">
              {safeList(card.subtitle)}
            </p>
            <p className="mt-3 text-xs text-slate-600 whitespace-pre-line">
              {safeList(card.description)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function OurCoreValues(props: Record<string, any>) {
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  const items = (props.items || []) as Array<Record<string, any>>;
  return (
    <section className="py-10 md:py-16" style={backgroundStyle}>
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 text-center">
        <div>
          <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
            {safeList(props.heading)}
          </h2>
          <p className="mt-2 text-sm text-[var(--brand-blue)]">
            {safeList(props.subheading)}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item, index) => (
            <div key={item.id || `${item.title}-${index}`}>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-blue)] text-white">
                {item.icon ? (
                  <img
                    src={resolveImage(item.icon)}
                    alt=""
                    className="h-6 w-6 object-contain brightness-0 invert"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-sm">★</span>
                )}
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[var(--brand-navy)]">
                {safeList(item.title)}
              </h3>
              <p className="text-xs text-[var(--brand-blue)]">
                {safeList(item.subtitle)}
              </p>
              <p className="mt-2 text-xs text-slate-600 whitespace-pre-line">
                {safeList(item.description)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChooseUsV2(props: Record<string, any>) {
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  const items = (props.items || []) as Array<Record<string, any>>;
  return (
    <section className="py-10 md:py-16" style={backgroundStyle}>
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 text-center">
        <div>
          <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
            {safeList(props.heading)}
          </h2>
          <p className="mt-2 text-sm text-[var(--brand-blue)]">
            {safeList(props.subheading)}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item, index) => (
            <div
              key={item.id || `${item.text}-${index}`}
              className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-left shadow-lg shadow-black/10"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-blue)] text-xs font-semibold text-white">
                ✓
              </span>
              <p className="text-sm text-slate-700">{safeList(item.text)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkWithUs(props: Record<string, any>) {
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  const icon = safeList(props.icon);
  return (
    <section className="py-14 text-white" style={backgroundStyle}>
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-6 text-center">
        {icon ? (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/30 bg-white/10">
            <img
              src={icon}
              alt=""
              className="h-7 w-7 object-contain brightness-0 invert"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/30 bg-white/10 text-xl">
            ✦
          </div>
        )}
        <h2 className="text-3xl font-semibold text-white">
          {safeList(props.heading)}
        </h2>
        <p className="text-sm text-slate-200 whitespace-pre-line">
          {safeList(props.subheading)}
        </p>
      </div>
    </section>
  );
}

function WelfareAndBenefits(props: Record<string, any>) {
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  const items = (props.items || []) as Array<Record<string, any>>;
  return (
    <section className="py-10 md:py-16" style={backgroundStyle}>
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 text-center">
        <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
          {safeList(props.heading)}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item, index) => (
            <div
              key={item.id || `${item.title}-${index}`}
              className="rounded-2xl bg-white px-6 py-8 shadow-xl shadow-black/10"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-blue)] text-white">
                {item.icon ? (
                  <img
                    src={resolveImage(item.icon)}
                    alt=""
                    className="h-6 w-6 object-contain brightness-0 invert"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-sm">★</span>
                )}
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[var(--brand-navy)]">
                {safeList(item.title)}
              </h3>
              <p className="mt-2 text-xs text-slate-600 whitespace-pre-line">
                {safeList(item.description)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function JobVacancies(props: Record<string, any>) {
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  const jobs = (props.jobs || []) as Array<Record<string, any>>;
  return (
    <section className="py-10 md:py-16" style={backgroundStyle}>
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6">
        <h2 className="text-center text-2xl font-semibold text-[var(--brand-navy)]">
          {safeList(props.heading)}
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {jobs.map((job, index) => (
            <div
              key={job.id || `${job.title}-${index}`}
              className="rounded-2xl bg-white p-6 shadow-xl shadow-black/10"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[var(--brand-navy)]">
                    {safeList(job.title)}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">📍 {safeList(job.location)}</span>
                    <span className="flex items-center gap-1">🕒 {safeList(job.type)}</span>
                    <span className="rounded-full bg-[var(--brand-yellow)] px-3 py-1 text-[11px] font-semibold text-[var(--brand-navy)]">
                      {safeList(job.salary)}
                    </span>
                  </div>
                </div>
                <a
                  href={safeList(job.applyHref) || "#"}
                  className="rounded-full bg-[var(--brand-blue)] px-4 py-2 text-xs font-semibold text-white"
                >
                  {safeList(job.applyLabel) || "Apply for a job"}
                </a>
              </div>
              <div className="mt-4 text-xs text-slate-600">
                <p className="font-semibold text-slate-700">Features:</p>
                <ul className="mt-2 grid gap-1">
                  {(job.features || []).map(
                    (feature: string, featureIndex: number) => (
                      <li key={`${feature}-${featureIndex}`} className="flex gap-2">
                        <span className="mt-0.5 text-[10px] text-red-600">•</span>
                        <span>{safeList(feature)}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactUsText(props: Record<string, any>) {
  const baseColor = safeList(props.backgroundColor) || "#0b3c86";
  const gradientColor = safeList(props.gradientColor) || "#f7c326";
  const backgroundStyle = {
    background: `linear-gradient(90deg, ${baseColor} 0%, ${gradientColor} 100%)`,
  };
  return (
    <section className="py-10 md:py-16 text-white" style={backgroundStyle}>
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-6 text-center">
        <h2 className="text-4xl font-semibold text-white">
          {safeList(props.heading)}
        </h2>
        <p className="text-base text-slate-100">{safeList(props.subheading)}</p>
        <p className="text-sm text-slate-100 whitespace-pre-line">
          {safeList(props.description)}
        </p>
      </div>
    </section>
  );
}

function ContactChannels(props: Record<string, any>) {
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  const channels = (props.channels || []) as Array<Record<string, any>>;
  const ctaButtons = (props.ctaButtons || []) as Array<Record<string, any>>;
  return (
    <section className="py-10 md:py-16" style={backgroundStyle}>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6">
        <div className="text-left">
          <h2 className="text-2xl font-semibold text-[var(--brand-navy)]">
            {safeList(props.heading)}
          </h2>
          <p className="mt-2 text-sm text-[var(--brand-blue)]">
            {safeList(props.subheading)}
          </p>
        </div>
        <div className="grid gap-4">
          {channels.map((channel, index) => (
            <div
              key={channel.id || `${channel.title}-${index}`}
              className="flex gap-4 rounded-2xl bg-white p-5 shadow-lg shadow-black/10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-blue)] text-white">
                {channel.icon ? (
                  <img
                    src={resolveImage(channel.icon)}
                    alt=""
                    className="h-6 w-6 object-contain brightness-0 invert"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-sm">★</span>
                )}
              </div>
              <div className="flex-1 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">
                    {safeList(channel.title)}
                  </p>
                  <span className="text-[11px] text-slate-400">
                    {safeList(channel.subtitle)}
                  </span>
                </div>
                <p className="mt-2 font-semibold text-[var(--brand-navy)]">
                  {safeList(channel.primary)}
                </p>
                {channel.secondary && (
                  <p className="mt-1 text-[var(--brand-navy)]">
                    {safeList(channel.secondary)}
                  </p>
                )}
                {channel.note && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    {safeList(channel.note)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-[var(--brand-blue)] p-5 text-white">
          <h3 className="text-sm font-semibold">{safeList(props.ctaTitle)}</h3>
          <p className="mt-2 text-xs text-slate-200">
            {safeList(props.ctaSubtitle)}
          </p>
          <div className="mt-4 grid gap-2">
            {ctaButtons.map((cta, index) => (
              <a
                key={cta.id || `${cta.label}-${index}`}
                href={safeList(cta.href) || "#"}
                className="flex items-center justify-center gap-2 rounded-full bg-[var(--brand-yellow)] px-4 py-2 text-xs font-semibold text-[var(--brand-navy)]"
              >
                {cta.icon ? (
                  <img
                    src={resolveImage(cta.icon)}
                    alt=""
                    className="h-4 w-4 object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span>☎️</span>
                )}
                {safeList(cta.label)}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutUsText(props: Record<string, any>) {
  const backgroundColor = safeList(props.backgroundColor);
  const backgroundStyle = backgroundColor ? { backgroundColor } : undefined;
  const bg = backgroundColor.toLowerCase();
  const isLight =
    !bg || bg === "#fff" || bg === "#ffffff" || bg === "white";
  const headingClass = isLight ? "text-slate-900" : "text-white";
  const subheadingClass = isLight ? "text-slate-600" : "text-slate-200";
  const descriptionClass = isLight ? "text-slate-700" : "text-slate-100";
  const taglineClass = isLight ? "text-slate-500" : "text-slate-200";
  return (
    <section
      className={`py-10 md:py-16 ${isLight ? "text-slate-900" : "text-white"}`}
      style={backgroundStyle}
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 text-center">
        <h2 className={`text-4xl font-semibold tracking-wide whitespace-pre-line ${headingClass}`}>
          {safeList(props.heading)}
        </h2>
        <p className={`text-base font-medium whitespace-pre-line ${subheadingClass}`}>
          {safeList(props.subheading)}
        </p>
        <p className={`text-sm whitespace-pre-line ${descriptionClass}`}>
          {safeList(props.description)}
        </p>
        <p className={`text-sm font-semibold whitespace-pre-line ${taglineClass}`}>
          {safeList(props.tagline)}
        </p>
      </div>
    </section>
  );
}

function ContactAndServices(props: Record<string, any>) {
  const backgroundColor = safeList(props.backgroundColor);
  const backgroundStyle = backgroundColor
    ? { backgroundColor }
    : undefined;
  const bg = backgroundColor.toLowerCase();
  const isLight =
    !bg || bg === "#fff" || bg === "#ffffff" || bg === "white";
  const headingClass = isLight ? "text-slate-900" : "text-white";
  const bodyClass = isLight ? "text-slate-600" : "text-slate-200";
  const secondaryCtaClass = isLight
    ? "border-slate-300 text-slate-700"
    : "border-white/40 text-white";
  return (
    <section
      className={`py-6 md:py-16 ${isLight ? "text-slate-900" : "text-white"}`}
      style={backgroundStyle}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6">
        <div className="text-center">
          <h2 className={`text-3xl font-semibold leading-tight ${headingClass}`}>
            {safeList(props.heading)}
          </h2>
          <p className={`mt-3 text-base ${bodyClass}`}>
            {safeList(props.subheading)}
          </p>
          <p className={`mt-2 text-sm ${bodyClass}`}>
            {safeList(props.badges)}
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href={safeList(props.primaryCtaHref) || "#"}
            className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white"
          >
            {safeList(props.primaryCtaText)}
          </a>
          <a
            href={safeList(props.secondaryCtaHref) || "#"}
            className={`rounded-full border px-6 py-3 text-sm font-semibold ${secondaryCtaClass}`}
          >
            {safeList(props.secondaryCtaText)}
          </a>
        </div>
      </div>
    </section>
  );
}

function OurWork(props: Record<string, any>) {
  const backgroundColor = safeList(props.backgroundColor);
  const backgroundStyle = backgroundColor ? { backgroundColor } : undefined;
  const bg = backgroundColor.toLowerCase();
  const isLight =
    !bg || bg === "#fff" || bg === "#ffffff" || bg === "white";
  const headingClass = isLight ? "text-slate-900" : "text-white";
  const subheadingClass = isLight ? "text-slate-500" : "text-white/70";
  const descriptionClass = isLight ? "text-slate-600" : "text-white/80";
  const items = (props.items || []) as Array<Record<string, any>>;
  return (
    <section className="py-10 md:py-16" style={backgroundStyle}>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6">
        <div className="text-center">
          <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${subheadingClass}`}>
            {safeList(props.subheading)}
          </p>
          <h2 className={`mt-3 text-3xl font-semibold ${headingClass}`}>
            {safeList(props.heading)}
          </h2>
          <p className={`mt-3 text-sm whitespace-pre-line ${descriptionClass}`}>
            {safeList(props.description)}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item, index) => (
            <div
              key={`${safeList(item.title)}-${index}`}
              className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-black/10"
            >
              <div className="h-48 w-full overflow-hidden">
                {item.image ? (
                  <img
                    src={resolveImage(item.image)}
                    alt={safeList(item.title)}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    No image
                  </div>
                )}
              </div>
              <div className="space-y-2 px-5 py-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-navy)]">
                  {safeList(item.title)}
                </p>
                <p className="text-sm text-slate-600">
                  {safeList(item.subtitle)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OurWorkGallery(props: Record<string, any>) {
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  const images = (props.images || []) as Array<Record<string, any>>;
  return (
    <section className="py-10 md:py-16" style={backgroundStyle}>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand-orange)]">
            {safeList(props.subheading)}
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--brand-navy)]">
            {safeList(props.heading)}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <div
              key={`${safeList(image.url)}-${index}`}
              className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-black/10"
            >
              <div className="h-48 w-full overflow-hidden">
                {image.url ? (
                  <img
                    src={resolveImage(image.url)}
                    alt={safeList(image.caption)}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    No image
                  </div>
                )}
              </div>
              <div className="px-4 py-3 text-sm text-slate-600">
                {safeList(image.caption)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GrandEvents(props: Record<string, any>) {
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  const ctaBackground = safeList(props.ctaBackground) || "#6b6f2d";
  const ctaTextColor = safeList(props.ctaTextColor) || "#ffffff";
  return (
    <section className="py-10 md:py-16" style={backgroundStyle}>
      <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold text-[var(--brand-navy)] whitespace-pre-line">
            {safeList(props.heading)}
          </h2>
          <p className="text-sm text-slate-700 whitespace-pre-line">
            {safeList(props.description)}
          </p>
          {safeList(props.ctaText) && (
            <a
              href={safeList(props.ctaHref) || "#"}
              className="inline-flex rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-wide shadow-lg shadow-slate-900/10"
              style={{ backgroundColor: ctaBackground, color: ctaTextColor }}
            >
              {safeList(props.ctaText)}
            </a>
          )}
        </div>
        <div className="grid grid-cols-[1fr_0.9fr] grid-rows-2 gap-4">
          <div className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-900/10">
            <div className="h-48 w-full overflow-hidden">
              {props.imageTop ? (
                <img
                  src={resolveImage(props.imageTop)}
                  alt={safeList(props.heading)}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  No image
                </div>
              )}
            </div>
          </div>
          <div className="row-span-2 overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-900/10">
            <div className="h-full min-h-[240px] w-full overflow-hidden">
              {props.imageSide ? (
                <img
                  src={resolveImage(props.imageSide)}
                  alt={safeList(props.heading)}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  No image
                </div>
              )}
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-900/10">
            <div className="h-48 w-full overflow-hidden">
              {props.imageBottom ? (
                <img
                  src={resolveImage(props.imageBottom)}
                  alt={safeList(props.heading)}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  No image
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WellnessFacilities(props: Record<string, any>) {
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  const items = (props.items || []) as Array<Record<string, any>>;
  return (
    <section className="py-10 md:py-16" style={backgroundStyle}>
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6">
        {items.map((item, index) => {
          const imageFirst = index % 2 === 1;
          return (
            <div
              key={`${safeList(item.title)}-${index}`}
              className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center"
            >
              <div className={imageFirst ? "order-2 lg:order-2" : "order-2 lg:order-1"}>
                <div className="space-y-4">
                  <h3 className="text-3xl font-semibold text-[var(--brand-navy)] font-serif">
                    {safeList(item.title)}
                  </h3>
                  <p className="text-sm text-slate-600 whitespace-pre-line">
                    {safeList(item.description)}
                  </p>
                  <a
                    href={safeList(item.ctaHref) || "#"}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-orange)]"
                  >
                    {safeList(item.ctaText) || "See More"}
                    <span aria-hidden="true">›</span>
                  </a>
                </div>
              </div>
              <div className={imageFirst ? "order-1 lg:order-1" : "order-1 lg:order-2"}>
                <div className="overflow-hidden rounded-3xl bg-slate-100 shadow-xl shadow-slate-900/10">
                  {item.image ? (
                    <img
                      src={resolveImage(item.image)}
                      alt={safeList(item.title)}
                      className="h-64 w-full object-cover md:h-72"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-64 items-center justify-center text-xs text-slate-400">
                      No image
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ImagesSlider(props: Record<string, any>) {
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  const images = (props.images || []) as Array<Record<string, any>>;
  return (
    <section className="py-10 md:py-16" style={backgroundStyle}>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand-orange)]">
            {safeList(props.subheading)}
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--brand-navy)]">
            {safeList(props.heading)}
          </h2>
        </div>
        <ImageSlider
          images={images.map((item) => ({
            url: safeList(item.url),
            caption: safeList(item.caption),
          }))}
        />
      </div>
    </section>
  );
}

function Hero(props: Record<string, any>) {
  const backgroundImage = props.backgroundImage as string | undefined;
  const slides = (props.slides || []) as Array<Record<string, string>>;
  const heroImage = resolveImage(backgroundImage);
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  return (
    <header className="relative overflow-hidden" style={backgroundStyle}>
      <div />
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:flex-row lg:items-center lg:gap-10 lg:pb-16">
        <div className="max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-xs font-semibold text-[var(--brand-navy)]">
            <span className="h-2 w-2 rounded-full bg-[var(--brand-orange)]" />
            {safeList(props.subtitle) || safeList(slides[0]?.subtitle)}
          </div>
          <h1 className="text-3xl font-semibold leading-tight text-[var(--brand-navy)] sm:text-4xl lg:text-5xl">
            {safeList(props.title) || safeList(slides[0]?.title)}
          </h1>
          <p className="text-sm text-slate-700 sm:text-base lg:text-lg">
            {safeList(props.description)}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              className="rounded-full bg-[var(--brand-blue)] px-5 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-black/20 sm:px-6 sm:py-3"
              href={safeList(props.primaryCtaHref) || "#"}
            >
              {safeList(props.primaryCtaText) || "จองคิว"}
            </a>
            <a
              className="rounded-full border border-[var(--brand-blue)] px-5 py-2.5 text-center text-sm font-semibold text-[var(--brand-blue)] sm:px-6 sm:py-3"
              href={safeList(props.secondaryCtaHref) || "#"}
            >
              {safeList(props.secondaryCtaText) || "ดูรายละเอียด"}
            </a>
          </div>
        </div>
        <div className="relative flex-1">
          <div className="absolute -right-8 -top-6 h-32 w-32 rounded-full bg-white/70 blur-xl" />
          <div className="relative h-64 overflow-hidden rounded-3xl bg-white/90 shadow-2xl shadow-black/15 backdrop-blur sm:h-72 lg:h-80">
            {heroImage ? (
              <Image
                src={heroImage}
                alt={safeList(props.title) || "Hero image"}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                unoptimized={heroImage.includes("localhost")}
              />
            ) : slides.length > 0 ? (
              <div className="h-64 sm:h-72 lg:h-80">
                <HeroSlider
                  slides={slides.map((slide) => ({
                    image: resolveImage(slide.image || slide.url),
                    title: safeList(slide.title),
                    subtitle: safeList(slide.subtitle),
                  }))}
                />
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-slate-400 sm:h-72 lg:h-80">
                No hero image
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function HeroImages(props: Record<string, any>) {
  const images = (props.images || []) as Array<Record<string, string>>;
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  return (
    <section className="py-0" style={backgroundStyle}>
      {images.length > 0 ? (
        <div className="h-[260px] w-full sm:h-[360px] md:h-[480px] lg:h-[600px]">
          <HeroSlider
            slides={images.map((slide) => ({
              image: resolveImage(slide.image || slide.url),
              title: safeList(slide.title),
              subtitle: safeList(slide.subtitle),
            }))}
            imageFit="cover"
          />
        </div>
      ) : (
        <div className="flex h-[220px] items-center justify-center text-sm text-slate-400 sm:h-[320px] md:h-[400px] lg:h-[480px]">
          No hero images yet.
        </div>
      )}
    </section>
  );
}

function YouTubeEmbed(props: Record<string, any>) {
  const heading = safeList(props.heading);
  const videoId = extractYouTubeId(props.videoUrl);
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}`
    : "";

  return (
    <section className="py-10 md:py-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6">
        {heading ? (
          <h2 className="text-center text-2xl font-semibold text-[var(--brand-navy)]">
            {heading}
          </h2>
        ) : null}
        <div className="relative w-full overflow-hidden rounded-3xl bg-slate-100 shadow-xl shadow-slate-900/10">
          {embedUrl ? (
            <iframe
              title={heading || "YouTube Video"}
              src={embedUrl}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex aspect-video items-center justify-center text-sm text-slate-400">
              Invalid YouTube URL.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function VideoHls01(props: Record<string, any>) {
  const heading = safeList(props.heading);
  const description = safeList(props.description);
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  const hlsDesktop = safeList(props.hlsUrlDesktop || props.hlsUrl);
  const hlsMobile = safeList(props.hlsUrlMobile || props.hlsUrl);
  const resolvedHlsDesktop = hlsDesktop ? resolveUploadUrl(hlsDesktop) : "";
  const resolvedHlsMobile = hlsMobile ? resolveUploadUrl(hlsMobile) : "";
  const fallbackHls = resolvedHlsDesktop || resolvedHlsMobile;
  const posterImage = safeList(props.posterImage);
  const resolvedPoster = posterImage ? resolveUploadUrl(posterImage) : "";

  return (
    <section className="py-10 md:py-16" style={backgroundStyle}>
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6">
        {heading ? (
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-[var(--brand-navy)] whitespace-pre-line">
              {heading}
            </h2>
            {description ? (
              <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">
                {description}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="mt-6">
        <div className="mx-auto w-full max-w-5xl px-6 md:max-w-none md:px-0">
          <div className="relative w-full overflow-hidden rounded-3xl bg-slate-900/10 shadow-xl shadow-slate-900/10 md:rounded-none md:shadow-none">
          {fallbackHls ? (
            <>
              <HlsVideoPlayer
                src={resolvedHlsDesktop || fallbackHls}
                poster={resolvedPoster}
                className="hidden aspect-video w-full md:block"
                autoPlayOnView
                muted
              />
              <div className="mx-auto w-full max-w-[420px] md:hidden">
                <HlsVideoPlayer
                  src={resolvedHlsMobile || fallbackHls}
                  poster={resolvedPoster}
                  className="aspect-[9/16] w-full"
                  autoPlayOnView
                  muted
                />
              </div>
            </>
          ) : (
            <div className="flex aspect-video items-center justify-center text-sm text-slate-400">
              No HLS video available.
            </div>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}

function CustomerReviewsImages(props: Record<string, any>) {
  const heading = safeList(props.heading);
  const imageLeft = resolveImage(props.imageLeft);
  const imageRight = resolveImage(props.imageRight);

  return (
    <section className="py-10 md:py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6">
        {heading ? (
          <h2 className="text-center text-2xl font-semibold text-[var(--brand-navy)]">
            {heading}
          </h2>
        ) : null}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl bg-slate-100 shadow-lg shadow-slate-900/10">
            {imageLeft ? (
              <img
                src={imageLeft}
                alt="Customer review 1"
                className="aspect-[4/5] w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center text-sm text-slate-400">
                No image
              </div>
            )}
          </div>
          <div className="overflow-hidden rounded-3xl bg-slate-100 shadow-lg shadow-slate-900/10">
            {imageRight ? (
              <img
                src={imageRight}
                alt="Customer review 2"
                className="aspect-[4/5] w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center text-sm text-slate-400">
                No image
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Services(props: Record<string, any>) {
  const items = (props.items || []) as Array<Record<string, string>>;
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  return (
    <section id="services" className="py-0" style={backgroundStyle}>
      <div className="mx-auto max-w-6xl px-0">
        <div className="flex flex-col gap-0 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--brand-navy)]">
            Services
          </p>
          <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
            {safeList(props.title)}
          </h2>
          <p className="text-base text-slate-600">
            เลือกแพ็กเกจที่เหมาะกับบ้านและธุรกิจของคุณ พร้อมทีมช่างดูแลครบ
          </p>
        </div>
        <div className="mt-0 grid gap-0 md:grid-cols-3">
          {items.map((service, index) => (
            <div
              key={`${service.title}-${index}`}
              className="flex h-full flex-col justify-between rounded-none border border-white/70 bg-white/80 p-0 shadow-none"
            >
              <div>
                <div className="mb-0 flex h-12 w-12 items-center justify-center rounded-none bg-[var(--brand-yellow)] text-[var(--brand-navy)]">
                  ★
                </div>
                <h3 className="text-xl font-semibold text-[var(--brand-navy)]">
                  {safeList(service.title)}
                </h3>
                <p className="mt-0 text-sm text-slate-600">
                  {safeList(service.description)}
                </p>
              </div>
              <div className="mt-0 flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--brand-orange)]">
                  {safeList(service.price)}
                </span>
                <a
                  href={safeList(service.ctaHref) || "#booking"}
                  className="rounded-full bg-[var(--brand-blue)] px-4 py-2 text-xs font-semibold text-white"
                >
                  {safeList(service.ctaText) || "จองบริการ"}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductsSectionImages(props: Record<string, any>) {
  const items = (props.items || []) as Array<Record<string, string>>;
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  return (
    <section className="py-10 md:py-16" style={backgroundStyle}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--brand-orange)]">
          {safeList(props.eyebrow)}
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-[var(--brand-navy)]">
          {safeList(props.title)}
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {items.map((item, index) => {
            const ctaText = safeList(item.ctaText);
            return (
              <div key={`${item.title}-${index}`} className="grid gap-4">
                <div className="overflow-hidden rounded-[32px] bg-slate-100">
                  {item.image ? (
                    <img
                      src={resolveImage(item.image)}
                      alt={safeList(item.title)}
                      className="h-52 w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-52 items-center justify-center text-sm text-slate-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-[var(--brand-navy)]">
                    {safeList(item.title)}
                  </h3>
                  <p className="text-sm text-slate-600 whitespace-pre-line">
                    {safeList(item.description)}
                  </p>
                  {ctaText ? (
                    <a
                      href={safeList(item.ctaHref) || "#"}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-orange)]"
                    >
                      {ctaText}
                      <span aria-hidden="true">→</span>
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Features(props: Record<string, any>) {
  const items = (props.items || []) as Array<Record<string, string>>;
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  return (
    <section
      className="bg-[var(--brand-navy)] py-0 text-white"
      style={backgroundStyle}
    >
      <div className="mx-auto grid max-w-6xl gap-0 px-0 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <h2 className="text-3xl font-semibold">{safeList(props.title)}</h2>
          <p className="mt-0 text-sm text-slate-200">
            เราออกแบบประสบการณ์ตั้งแต่จองคิวจนถึงหลังบริการ เพื่อให้คุณมั่นใจ
            ว่างานเสร็จตามมาตรฐานและมีการติดตามผลอย่างมืออาชีพ
          </p>
        </div>
        <div className="grid gap-0">
          {items.map((item, index) => (
            <div
              key={`${item.text}-${index}`}
              className="rounded-none bg-white/10 px-0 py-0 text-sm"
            >
              {safeList(item.text)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Gallery(props: Record<string, any>) {
  const images = (props.images || []) as Array<Record<string, string>>;
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  return (
    <section className="mx-auto max-w-6xl px-0 py-0" style={backgroundStyle}>
      <h2 className="text-2xl font-semibold text-[var(--brand-navy)]">
        {safeList(props.title)}
      </h2>
      <GalleryLightbox items={images} />
    </section>
  );
}

function Faq(props: Record<string, any>) {
  const items = (props.items || []) as Array<Record<string, string>>;
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  return (
    <section className="mx-auto max-w-6xl px-6 py-8 md:py-12" style={backgroundStyle}>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-[var(--brand-navy)]">
          {safeList(props.title)}
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((faq, index) => (
            <div
              key={`${faq.question}-${index}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm"
            >
              <p className="font-semibold text-[var(--brand-navy)]">
                {safeList(faq.question)}
              </p>
              <p className="mt-2 text-slate-600">{safeList(faq.answer)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FrequentlyAskedQuestions(props: Record<string, any>) {
  const items = (props.items || []) as Array<Record<string, string>>;
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  const title = safeList(props.title);
  const subtitle = safeList(props.subtitle);

  return (
    <section className="px-6 py-10 md:py-16" style={backgroundStyle}>
      <div className="mx-auto max-w-4xl text-center">
        {title ? (
          <h2 className="text-3xl font-semibold text-[var(--brand-navy)] whitespace-pre-line">
            {title}
          </h2>
        ) : null}
        {subtitle ? (
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand-navy)]/70 whitespace-pre-line">
            {subtitle}
          </p>
        ) : null}
      </div>
      <div className="mx-auto mt-10 grid max-w-4xl gap-4">
        {items.map((faq, index) => (
          <details
            key={`${faq.question}-${index}`}
            className="group rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-left [&::-webkit-details-marker]:hidden">
              <span className="text-base font-semibold text-[var(--brand-navy)]">
                {safeList(faq.question)}
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-[var(--brand-navy)] transition-transform duration-200 group-open:rotate-180">
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                >
                  <path
                    d="M5.5 7.5l4.5 4.5 4.5-4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </summary>
            <div className="px-6 pb-5 text-sm text-slate-600 whitespace-pre-line">
              {safeList(faq.answer)}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function Contact(props: Record<string, any>) {
  const backgroundStyle = safeList(props.backgroundColor)
    ? { backgroundColor: safeList(props.backgroundColor) }
    : undefined;
  return (
    <section
      id="booking"
      className="mx-auto max-w-6xl px-6 py-10 md:py-16"
      style={backgroundStyle}
    >
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/10">
          <h3 className="text-2xl font-semibold text-slate-900">
            {safeList(props.title) || "จองคิวบริการ"}
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            กรอกข้อมูลแล้วทีมงานจะโทรกลับภายใน 15 นาทีในเวลาทำการ
          </p>
          <form className="mt-6 grid gap-4">
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="ชื่อ-นามสกุล"
              aria-label="ชื่อ-นามสกุล"
            />
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="เบอร์โทรศัพท์"
              aria-label="เบอร์โทรศัพท์"
            />
            <textarea
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="รายละเอียดบริการที่ต้องการ"
              rows={3}
              aria-label="รายละเอียดบริการ"
            />
            <a
              href={safeList(props.ctaHref) || "#"}
              className="rounded-full bg-black px-6 py-3 text-center text-sm font-semibold text-white"
            >
              {safeList(props.ctaText) || "ส่งข้อมูลให้ทีมงานติดต่อกลับ"}
            </a>
          </form>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/10">
          <h3 className="text-xl font-semibold text-slate-900">ติดต่อเรา</h3>
          <div className="mt-4 grid gap-3 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span>โทร</span>
              <strong className="text-slate-900">
                {safeList(props.phone)}
              </strong>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              {safeList(props.note)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
