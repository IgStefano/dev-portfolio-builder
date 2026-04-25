import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import type { GeneratedSite, Theme } from '../api/generated'
import type { PreviewPayload } from '../lib/previewChannel'
import { usePreviewSender } from '../lib/previewChannel'

const SESSION_KEY = 'dpb:draft'

type PreviewSearch = {
  site: string
  theme: Theme
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
  const { site: siteJson, theme } = Route.useSearch()

  const site: GeneratedSite | null = useMemo(() => {
    if (siteJson) {
      try {
        const parsed = JSON.parse(siteJson) as GeneratedSite
        sessionStorage.setItem(SESSION_KEY, siteJson)
        return parsed
      } catch {
        // fall through to sessionStorage
      }
    }
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (stored) {
      try {
        return JSON.parse(stored) as GeneratedSite
      } catch {
        // invalid stored data
      }
    }
    return null
  }, [siteJson])

  const payload: PreviewPayload | null = useMemo(
    () => (site ? { site, theme } : null),
    [site, theme],
  )

  const { iframeRef, onIframeLoad } = usePreviewSender(payload)

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
      <div className="mx-auto max-w-5xl space-y-6">
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
              {site.hero.headline
                ? `${site.hero.headline.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')}.dev`
                : 'your-portfolio.dev'}
            </div>
          </div>

          {/* Iframe */}
          <iframe
            ref={iframeRef}
            src="/render"
            onLoad={onIframeLoad}
            title="Site preview"
            className="h-[600px] w-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  )
}
