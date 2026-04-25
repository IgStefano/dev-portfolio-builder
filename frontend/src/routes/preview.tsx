import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ApiError } from '../api/client'
import { useGenerateApiGeneratePost } from '../api/generated'
import type { GeneratedSite, GitHubProfile, SiteType, Theme, Tone } from '../api/generated'
import type { PreviewPayload } from '../lib/previewChannel'
import { usePreviewSender } from '../lib/previewChannel'

const SESSION_KEY = 'dpb:draft'
const SESSION_META_KEY = 'dpb:draft-meta'

const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'playful', label: 'Playful' },
  { value: 'minimal', label: 'Minimal' },
]

type PreviewSearch = {
  site: string
  theme: Theme
  tone?: string
  profile?: string
  siteTitle?: string
  siteType?: string
}

type DraftMeta = {
  profile: GitHubProfile
  siteTitle?: string
  siteType: SiteType
}

function parseSiteFromStorage(siteJson: string): GeneratedSite | null {
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
}

export const Route = createFileRoute('/preview')({
  component: PreviewPage,
  validateSearch: (search: Record<string, unknown>): PreviewSearch => ({
    site: (search.site as string) ?? '',
    theme: (search.theme as Theme) ?? 'minimal',
    tone: (search.tone as string) ?? 'professional',
    profile: search.profile as string | undefined,
    siteTitle: search.siteTitle as string | undefined,
    siteType: search.siteType as string | undefined,
  }),
})

function PreviewPage() {
  const navigate = useNavigate()
  const {
    site: siteJson,
    theme,
    tone: initialTone,
    profile: profileJson,
    siteTitle,
    siteType,
  } = Route.useSearch()

  const [activeTone, setActiveTone] = useState<Tone>(
    (initialTone as Tone) ?? 'professional',
  )
  const [currentSite, setCurrentSite] = useState<GeneratedSite | null>(
    () => parseSiteFromStorage(siteJson),
  )
  const [toast, setToast] = useState<{ message: string; retryFn: () => void } | null>(null)

  // Store/restore draft meta for regeneration
  const draftMeta: DraftMeta | null = useMemo(() => {
    if (profileJson) {
      try {
        const meta: DraftMeta = {
          profile: JSON.parse(profileJson) as GitHubProfile,
          siteTitle: siteTitle,
          siteType: (siteType as SiteType) ?? 'portfolio',
        }
        sessionStorage.setItem(SESSION_META_KEY, JSON.stringify(meta))
        return meta
      } catch {
        // fall through
      }
    }
    const stored = sessionStorage.getItem(SESSION_META_KEY)
    if (stored) {
      try {
        return JSON.parse(stored) as DraftMeta
      } catch {
        // invalid
      }
    }
    return null
  }, [profileJson, siteTitle, siteType])

  const payload: PreviewPayload | null = useMemo(
    () => (currentSite ? { site: currentSite, theme } : null),
    [currentSite, theme],
  )

  const { iframeRef, onIframeLoad } = usePreviewSender(payload)

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  const generate = useGenerateApiGeneratePost()

  const regenerateRef = useRef<(tone: Tone) => void>(() => {})

  const handleRegenerate = useCallback(
    (tone: Tone) => {
      if (!draftMeta) return

      generate.mutate(
        {
          data: {
            profile: draftMeta.profile,
            site_title: draftMeta.siteTitle,
            site_type: draftMeta.siteType,
            theme,
            tone,
          },
        },
        {
          onSuccess: (newSite) => {
            setCurrentSite(newSite)
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(newSite))
            setToast(null)
          },
          onError: (error) => {
            const detail =
              error instanceof ApiError && error.detail
                ? error.detail
                : 'Generation failed. Please try again.'
            setToast({
              message: detail,
              retryFn: () => regenerateRef.current(tone),
            })
          },
        },
      )
    },
    [draftMeta, theme, generate],
  )

  useEffect(() => {
    regenerateRef.current = handleRegenerate
  }, [handleRegenerate])

  const handleToneChange = useCallback(
    (newTone: Tone) => {
      setActiveTone(newTone)
      handleRegenerate(newTone)
    },
    [handleRegenerate],
  )

  if (!currentSite) {
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
    <div className="flex min-h-screen">
      {/* Side panel */}
      <div className="w-64 shrink-0 border-r border-gray-800 bg-gray-950 p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-gray-500">
            Controls
          </h2>
          <button
            onClick={() => navigate({ to: '/' })}
            className="rounded-lg border border-gray-700 px-2 py-1 text-xs text-gray-400 hover:border-gray-500"
          >
            Start Over
          </button>
        </div>

        {/* Tone chips */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Tone
          </p>
          <div className="flex flex-wrap gap-2">
            {TONE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleToneChange(opt.value)}
                disabled={generate.isPending}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTone === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Regenerate button */}
        <button
          onClick={() => handleRegenerate(activeTone)}
          disabled={generate.isPending || !draftMeta}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generate.isPending && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {generate.isPending ? 'Regenerating...' : 'Regenerate'}
        </button>

        {!draftMeta && (
          <p className="text-xs text-gray-600">
            Regeneration unavailable — profile data not found.
          </p>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Browser frame */}
          <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
            {/* Title bar */}
            <div className="flex items-center gap-3 border-b border-gray-800 bg-gray-900 px-4 py-3">
              {/* Traffic-light dots */}
              <div className="flex gap-1.5">
                <span className="block h-3 w-3 rounded-full bg-red-500/80" />
                <span className="block h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="block h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              {/* URL bar */}
              <div className="flex-1 rounded-md bg-gray-800 px-3 py-1.5 text-xs text-gray-500 select-none">
                {currentSite.hero.headline
                  ? `${currentSite.hero.headline.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')}.dev`
                  : 'your-portfolio.dev'}
              </div>
            </div>

            {/* Iframe */}
            <div className="relative">
              <iframe
                ref={iframeRef}
                src="/render"
                onLoad={onIframeLoad}
                title="Site preview"
                className="h-[600px] w-full border-0 bg-white"
              />
              {/* Loading overlay */}
              {generate.isPending && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-gray-300 shadow-lg">
                    Regenerating...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border border-red-800 bg-gray-900 px-4 py-3 shadow-xl">
          <p className="text-sm text-red-400">{toast.message}</p>
          <button
            onClick={toast.retryFn}
            className="shrink-0 rounded-md bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-500"
          >
            Retry
          </button>
          <button
            onClick={() => setToast(null)}
            className="shrink-0 text-gray-500 hover:text-gray-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
