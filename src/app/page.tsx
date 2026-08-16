import Image from "next/image";
import DiveQrTool from "@/components/DiveQrTool";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: SITE_NAME,
      alternateName: [
        "Shearwater to SSI QR",
        "UDDF to MySSI",
        "SSI dive QR generator",
      ],
      description: SITE_DESCRIPTION,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Convert Shearwater UDDF dive exports to MySSI QR codes",
        "Works with UDDF 3.x files from other dive computers and Subsurface",
        "Runs entirely in the browser without uploading dive logs",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How do I import a Shearwater dive into the SSI app?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Export the dive as UDDF from Shearwater Cloud Desktop, open this tool, import the UDDF file, then scan the generated QR code while adding a dive in the MySSI app.",
          },
        },
        {
          "@type": "Question",
          name: "Does this work with dive computers other than Shearwater?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, if you can export a standard UDDF 3.x file. Many divers use Subsurface to download from Suunto, Garmin, and other computers, then export UDDF for this tool.",
          },
        },
        {
          "@type": "Question",
          name: "Is my dive log uploaded to a server?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Parsing and QR generation happen locally in your browser. Dive files stay on your device.",
          },
        },
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col bg-[var(--black)] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-10 sm:py-12">
        <header className="mb-10">
          <div className="flex items-center justify-center gap-4 sm:gap-5">
            <Image
              src="/img/shearwater.png"
              alt="Shearwater dive computer brand logo"
              width={120}
              height={120}
              className="h-14 w-auto object-contain sm:h-16"
              priority
            />
            <span
              aria-hidden
              className="text-2xl font-light text-[var(--muted)] sm:text-3xl"
            >
              →
            </span>
            <Image
              src="/img/ssi.webp"
              alt="SSI Scuba Schools International logo"
              width={120}
              height={120}
              className="h-14 w-auto object-contain sm:h-16"
              priority
            />
          </div>
          <h1 className="mt-6 text-center text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            QR generator for SSI
          </h1>
          <p className="mt-2 text-center text-sm text-[var(--muted)]">
            Convert Shearwater and other UDDF dive exports into MySSI QR codes
            you can scan in the SSI app.
          </p>
        </header>

        <section className="mb-8 rounded-2xl border border-white/10 px-5 py-5">
          <h2 className="text-sm font-semibold text-white">How to use</h2>
          <ol className="mt-3 list-decimal space-y-2.5 pl-4 text-sm leading-relaxed text-[var(--muted)]">
            <li>
              Open the Shearwater desktop app (or another logbook) and export
              your dive as a UDDF file.
            </li>
            <li>Import that file here to generate a MySSI QR code.</li>
            <li>In the SSI app, add a dive and scan this QR code.</li>
          </ol>
        </section>

        <DiveQrTool />

        <section className="mt-12 space-y-6 border-t border-white/10 pt-10">
          <div>
            <h2 className="text-base font-semibold text-white">
              Shearwater to MySSI dive import
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              {SITE_NAME} helps scuba divers move logs from Shearwater Peregrine,
              Perdix, Teric, and other computers into the MySSI digital logbook.
              Export UDDF from Shearwater Cloud Desktop, generate a QR code here,
              and scan it when adding a dive in the SSI app.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">
              Works with standard UDDF exports
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Besides Shearwater, many divers export UDDF from Subsurface after
              downloading Suunto, Garmin Descent, or other dive computers. If the
              file is UDDF 3.x, this tool can build an SSI-compatible QR from
              depth, time, date, water temperature, and related fields.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">
              Private by design
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Your dive file never leaves this browser session. There is no
              account and no server-side dive storage — useful when you only need
              a fast SSI QR for certification or logbook sync.
            </p>
          </div>

          <p className="sr-only">
            {SITE_TITLE}. {SITE_DESCRIPTION}
          </p>
        </section>
      </main>
    </div>
  );
}
