import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata, Viewport } from 'next'
import { PublicEnvScript } from 'next-runtime-env'
import { createLogger } from '@/lib/logs/console-logger'
import { TelemetryConsentDialog } from '@/app/telemetry-consent-dialog'
import './globals.css'

import { ZoomPrevention } from './zoom-prevention'

const logger = createLogger('RootLayout')

const BROWSER_EXTENSION_ATTRIBUTES = [
  'data-new-gr-c-s-check-loaded',
  'data-gr-ext-installed',
  'data-gr-ext-disabled',
  'data-grammarly',
  'data-fgm',
  'data-lt-installed',
]

if (typeof window !== 'undefined') {
  const originalError = console.error
  console.error = (...args) => {
    if (args[0].includes('Hydration')) {
      const isExtensionError = BROWSER_EXTENSION_ATTRIBUTES.some((attr) =>
        args.some((arg) => typeof arg === 'string' && arg.includes(attr))
      )

      if (!isExtensionError) {
        logger.error('Hydration Error', {
          details: args,
          componentStack: args.find(
            (arg) => typeof arg === 'string' && arg.includes('component stack')
          ),
        })
      }
    }
    originalError.apply(console, args)
  }
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: {
    template: '',
    default: 'Open Kernel',
  },
  description:
    'Build and deploy AI agents using our Figma-like canvas. Build, write evals, and deploy AI agent workflows that automate workflows and streamline your business processes.',
  applicationName: 'Open Kernel',
  authors: [{ name: 'Open Kernel' }],
  generator: 'Next.js',
  keywords: [
    'AI agent',
    'AI agent builder',
    'AI agent workflow',
    'AI workflow automation',
    'visual workflow editor',
    'AI agents',
    'workflow canvas',
    'intelligent automation',
    'AI tools',
    'workflow designer',
    'artificial intelligence',
    'business automation',
    'AI agent workflows',
    'visual programming',
  ],
  referrer: 'origin-when-cross-origin',
  creator: 'Open Kernel',
  publisher: 'Open Kernel',
  metadataBase: new URL('https://openkernel.ai'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://openkernel.ai',
    title: 'Open Kernel',
    description:
      'Build and deploy AI agents using our Figma-like canvas. Build, write evals, and deploy AI agent workflows that automate workflows and streamline your business processes.',
    siteName: 'Open Kernel',
    images: [
      {
        url: 'https://openkernel.ai/social/pill.png',
        width: 1200,
        height: 630,
        alt: 'Open Kernel',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Open Kernel',
    description:
      'Build and deploy AI agents using our Figma-like canvas. Build, write evals, and deploy AI agent workflows that automate workflows and streamline your business processes.',
    images: ['https://openkernel.ai/social/pill.png'],
    creator: '',
    site: '',
  },
  manifest: '/favicon/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      {
        url: '/favicon/favicon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/favicon/favicon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      { url: '/static/ok.png', sizes: 'any', type: 'image/png' },
    ],
    apple: '/favicon/apple-touch-icon.png',
    shortcut: '/favicon/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Open Kernel',
  },
  formatDetection: {
    telephone: false,
  },
  category: 'technology',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#ffffff',
    'msapplication-config': '/favicon/browserconfig.xml',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        {/* Structured Data for SEO */}
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Open Kernel',
              description:
                'Build and deploy AI agents using our Figma-like canvas. Build, write evals, and deploy AI agent workflows that automate workflows and streamline your business processes.',
              url: 'https://openkernel.ai',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web Browser',
              offers: {
                '@type': 'Offer',
                category: 'SaaS',
              },
              creator: {
                '@type': 'Organization',
                name: 'Open Kernel',
                url: 'https://openkernel.ai',
              },
              featureList: [
                'Visual AI Agent Builder',
                'Workflow Canvas Interface',
                'AI Agent Automation',
                'Custom AI Workflows',
              ],
            }),
          }}
        />

        {/* Enhanced meta tags for better SEO */}
        <meta name='theme-color' content='#ffffff' />
        <meta name='color-scheme' content='light' />
        <meta name='format-detection' content='telephone=no' />
        <meta httpEquiv='x-ua-compatible' content='ie=edge' />

        {/* Additional Open Graph tags */}
        <meta property='og:image:width' content='1200' />
        <meta property='og:image:height' content='630' />
        <meta
          property='og:image:alt'
          content='Open Kernel - AI Agent Builder with Visual Canvas Interface'
        />
        <meta property='og:site_name' content='Open Kernel' />
        <meta property='og:locale' content='en_US' />

        {/* Enhanced Twitter Card tags */}
        <meta name='twitter:image:width' content='1200' />
        <meta name='twitter:image:height' content='675' />
        <meta name='twitter:image:alt' content='Open Kernel - AI Agent Builder' />
        <meta name='twitter:url' content='https://openkernel.ai' />
        <meta name='twitter:domain' content='openkernel.ai' />

        {/* Additional image sources */}
        <link rel='image_src' href='https://openkernel.ai/social/pill.png' />

        <PublicEnvScript />
      </head>
      <body suppressHydrationWarning>
        <ZoomPrevention />
        <TelemetryConsentDialog />
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
