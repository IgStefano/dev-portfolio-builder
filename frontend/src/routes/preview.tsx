import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useGenerateApiGeneratePost,
} from '../api/generated'
import type { GeneratedSite, GitHubProfile, SiteType, Theme, Tone } from '../api/generated'
import type { PreviewPayload } from '../lib/previewChannel'
import { usePreviewSender } from '../lib/previewChannel'
import { ApiRequestError } from '../api/client'

type ViewportPreset = 'desktop' | 'tablet' | 'mobile'

const VIEWPORT_WIDTHS: Record<ViewportPreset, { width: string; label: string }> = {
  desktop: { width: '100%', label: 'Desktop' },
  tablet: { width: '768px', label: 'Tablet' },
  mobile: { width: '390px', label: 'Mobile' },
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function TabletIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="12" y1="18" x2="12" y2="18" />
    </svg>
  )
}

function SmartphoneIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="12" y1="18" x2="12" y2="18" />
    </svg>
  )
}

const VIEWPORT_ICONS: Record<ViewportPreset, typeof MonitorIcon> = {
  desktop: MonitorIcon,
  tablet: TabletIcon,
  mobile: SmartphoneIcon,
}

const SESSION_KEY = 'dpb:draft'

type PreviewSearch = {
  site: string
  theme: Theme
}

type Preferences = {
  siteTitle?: string
  siteType: SiteType
  theme: Theme
  tone: Tone
}

export const Route = createFileRoute('/preview')({
  component: PreviewPage,
  validateSearch: (search: Record<string, unknown>): PreviewSearch => ({
    site: (search.site as string) ?? '',
    theme: (search.theme as Theme) ?? 'minimal',
  }),
})

function PreviewPage() {
  const navigate = useNavigate()
  const { site: siteJson, theme: searchTheme } = Route.useSearch()
  const [viewport, setViewport] = useState<ViewportPreset>('desktop')

  // Mutable state for the current site (updated on tweaks/regeneration)
  const [currentSite, setCurrentSite] = useState<GeneratedSite | null>(null)
  const [currentTheme, setCurrentTheme] = useState<Theme>(searchTheme)
  const [currentTone, setCurrentTone] = useState<Tone>(() => {
    const stored = sessionStorage.getItem('dpb:preferences')
    if (stored) {
      try {
        const prefs = JSON.parse(stored) as Preferences
        if (prefs.tone) return prefs.tone
      } catch {
        // ignore
      }
    }
    return 'professional'
  })
  const [tweakText, setTweakText] = useState('')
  const [toast, setToast] = useState<{ message: string; retry?: () => void } | null>(null)

  // Load profile + preferences from sessionStorage
  const profile: GitHubProfile | null = useMemo(() => {
    const stored = sessionStorage.getItem('dpb:profile')
    if (stored) {
      try {
        return JSON.parse(stored) as GitHubProfile
      } catch {
        return null
      }
    }
    return null
  }, [])

  const preferences: Preferences | null = useMemo(() => {
    const stored = sessionStorage.getItem('dpb:preferences')
    if (stored) {
      try {
        return JSON.parse(stored) as Preferences
      } catch {
        return null
      }
    }
    return null
  }, [])

  // Initialize site from search params or sessionStorage
  const site: GeneratedSite | null = useMemo(() => {
    if (currentSite) return currentSite

    if (siteJson) {
      try {
        const parsed = JSON.parse(siteJson) as GeneratedSite
        sessionStorage.setItem(SESSION_KEY, siteJson)
        return parsed
      } catch {
        // fall through
      }
    }
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (stored) {
      try {
        return JSON.parse(stored) as GeneratedSite
      } catch {
        // invalid
      }
    }
    return null
  }, [siteJson, currentSite])

  const payload: PreviewPayload | null = useMemo(
    () => (site ? { site, theme: currentTheme } : null),
    [site, currentTheme],
  )

  const { iframeRef, onIframeLoad } = usePreviewSender(payload)

  // Auto-dismiss toast after 6s
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(timer)
  }, [toast])

  const generate = useGenerateApiGeneratePost()

  type GenerateOpts = { instructions?: string; toneOverride?: Tone }
  const handleGenerateRef = useRef<(opts?: GenerateOpts) => void>(() => {})

  const handleGenerate = useCallback(
    (opts?: GenerateOpts) => {
      if (!profile) return
      const tone = opts?.toneOverride ?? currentTone
      const instructions = opts?.instructions

      generate.mutate(
        {
          data: {
            profile,
            site_title: preferences?.siteTitle,
            site_type: preferences?.siteType ?? 'portfolio',
            theme: currentTheme,
            tone,
            instructions: instructions || undefined,
          },
        },
        {
          onSuccess: (newSite) => {
            setCurrentSite(newSite)
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(newSite))
            if (instructions) {
              setTweakText('')
            }
          },
          onError: (error) => {
            const isLlmError =
              error instanceof ApiRequestError && error.error_code === 'llm_error'
            setToast({
              message: isLlmError
                ? 'Generation failed. The LLM returned an error.'
                : 'Something went wrong. Please try again.',
              retry: () => {
                generate.reset()
                handleGenerateRef.current(opts)
              },
            })
          },
        },
      )
    },
    [profile, preferences, currentTheme, currentTone, generate],
  )

  useEffect(() => {
    handleGenerateRef.current = handleGenerate
  }, [handleGenerate])

  const handleTweakSubmit = () => {
    const text = tweakText.trim()
    if (!text) return
    handleGenerate({ instructions: text })
  }

  const handleTweakKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTweakSubmit()
    }
  }

  if (!site) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg text-red-400">No site data available.</p>
          <button
            onClick={() => navigate({ to: '/' })}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:border-gray-500"
          >
            Start Over
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-gray-500">
            Preview
          </h2>
          <button
            onClick={() => navigate({ to: '/' })}
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:border-gray-500"
          >
            Start Over
          </button>
        </div>

        <div className="flex gap-6">
          {/* Browser frame */}
          <div className="flex-1 overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
            {/* Title bar */}
            <div className="flex items-center gap-3 border-b border-gray-800 bg-gray-900 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="block h-3 w-3 rounded-full bg-red-500/80" />
                <span className="block h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="block h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 rounded-md bg-gray-800 px-3 py-1.5 text-xs text-gray-500 select-none">
                {site.hero.headline
                  ? `${site.hero.headline.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')}.dev`
                  : 'your-portfolio.dev'}
              </div>
              {/* Viewport toggles */}
              <div className="flex items-center gap-1 rounded-lg bg-gray-800 p-1">
                {(Object.keys(VIEWPORT_WIDTHS) as ViewportPreset[]).map((preset) => {
                  const Icon = VIEWPORT_ICONS[preset]
                  const isActive = viewport === preset
                  return (
                    <button
                      key={preset}
                      onClick={() => setViewport(preset)}
                      title={VIEWPORT_WIDTHS[preset].label}
                      className={`rounded-md p-1.5 transition-colors ${
                        isActive
                          ? 'bg-gray-700 text-gray-200'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Iframe viewport */}
            <div className="flex justify-center bg-gray-950 p-0 transition-[padding] duration-300" style={viewport !== 'desktop' ? { padding: '16px' } : undefined}>
              <iframe
                ref={iframeRef}
                src="/render"
                onLoad={onIframeLoad}
                title="Site preview"
                className="h-[600px] border-0 bg-white transition-[width] duration-300 ease-in-out"
                style={{ width: VIEWPORT_WIDTHS[viewport].width }}
              />
            </div>
          </div>

          {/* Side panel */}
          <div className="w-72 shrink-0 space-y-6">
            {/* Theme chips */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-gray-500">
                Theme
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(['minimal', 'terminal', 'editorial'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCurrentTheme(t)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                      currentTheme === t
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone chips */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-gray-500">
                Tone
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(['professional', 'playful', 'minimal'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setCurrentTone(t)
                      handleGenerate({ toneOverride: t })
                    }}
                    disabled={generate.isPending}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors disabled:opacity-50 ${
                      currentTone === t
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Regenerate */}
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={generate.isPending}
              className="w-full rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-500 disabled:opacity-50"
            >
              {generate.isPending ? 'Generating...' : 'Regenerate'}
            </button>

            {/* Free-form tweak input */}
            <div>
              <label
                htmlFor="tweak-input"
                className="block text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Tweak Instructions
              </label>
              <textarea
                id="tweak-input"
                rows={3}
                placeholder={'e.g. "mention I\'m based in Berlin" or "lean harder into my Rust work"'}
                value={tweakText}
                onChange={(e) => setTweakText(e.target.value)}
                onKeyDown={handleTweakKeyDown}
                disabled={generate.isPending}
                className="mt-2 block w-full resize-none rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleTweakSubmit}
                disabled={generate.isPending || !tweakText.trim()}
                className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generate.isPending ? 'Applying...' : 'Apply Tweak'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-lg border border-red-600/30 bg-red-900/80 px-4 py-3 text-sm text-red-200 shadow-lg backdrop-blur">
          <div className="flex items-start gap-2">
            <span className="flex-1">{toast.message}</span>
            <div className="flex items-center gap-2">
              {toast.retry && (
                <button
                  onClick={toast.retry}
                  className="text-red-300 underline hover:text-red-100"
                >
                  Retry
                </button>
              )}
              <button
                onClick={() => setToast(null)}
                className="text-red-300 hover:text-red-100"
              >
                &times;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
