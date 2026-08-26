import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = { title: 'ClinicalNote AI | Clinical co-pilot', description: 'Turn consultations into structured clinical notes with clinician review.', generator: 'v0.app' }
export const viewport: Viewport = { colorScheme: 'light', themeColor: '#f6fbfc', userScalable: false }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" className="bg-background"><body>{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html> }
