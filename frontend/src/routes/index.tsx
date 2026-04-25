import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useHealthApiHealthGet, useIngestApiIngestPost } from '../api/generated'
import type { SiteType, Theme } from '../api/generated'
import { ApiRequestError } from '../api/client'

const GITHUB_URL_RE = /^(@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?|(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\/[^\s]*)?)$/

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const navigate = useNavigate()
  const { data: health } = useHealthApiHealthGet()

  const [githubUrl, setGithubUrl] = useState('')
  const [siteTitle, setSiteTitle] = useState('')
  const [siteType, setSiteType] = useState<SiteType>('portfolio')
  const [theme, setTheme] = useState<Theme>('minimal')
  const [urlTouched, setUrlTouched] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const urlValid = GITHUB_URL_RE.test(githubUrl)
  const showUrlError = urlTouched && githubUrl.length > 0 && !urlValid

  // Auto-dismiss toast after 5s
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  const ingest = useIngestApiIngestPost({
    mutation: {
      onSuccess: (profile) => {
        navigate({
          to: '/generate',
          search: {
            profile: JSON.stringify(profile),
            siteTitle: siteTitle || undefined,
            siteType,
            theme,
          },
        })
      },
      onError: (error) => {
        if (error instanceof ApiRequestError && error.error_code === 'github_rate_limit') {
          setToast('GitHub API rate limit reached. Please wait a minute and try again.')
        }
      },
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlValid) return
    ingest.mutate({ data: { github_url: githubUrl } })
  }

  const ingestErrorMessage = (() => {
    if (!ingest.isError) return null
    const err = ingest.error
    if (err instanceof ApiRequestError) {
      if (err.error_code === 'github_not_found') {
        return 'GitHub user not found. Please check the username and try again.'
      }
      if (err.error_code === 'github_rate_limit') {
        return null // handled by toast
      }
    }
    return 'Something went wrong. Please check the URL and try again.'
  })()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Dev Portfolio Builder
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Turn your GitHub profile into a polished portfolio site in under a minute.
          </p>
        </div>

        {health && health.status === 'ok' && (
          <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 text-center text-sm text-gray-400">
            API connected
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* GitHub URL */}
          <div>
            <label htmlFor="github-url" className="block text-sm font-medium text-gray-300">
              GitHub Profile URL <span className="text-red-400">*</span>
            </label>
            <input
              id="github-url"
              type="url"
              placeholder="https://github.com/username"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              onBlur={() => setUrlTouched(true)}
              className={`mt-1.5 block w-full rounded-lg border bg-gray-900 px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${
                showUrlError || (ingest.isError && ingestErrorMessage)
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-700 focus:ring-blue-500'
              }`}
            />
            {showUrlError && (
              <p className="mt-1.5 text-sm text-red-400">
                Please enter a valid GitHub URL (e.g. https://github.com/username)
              </p>
            )}
            {ingestErrorMessage && (
              <p className="mt-1.5 text-sm text-red-400">
                {ingestErrorMessage}
              </p>
            )}
          </div>

          {/* Site Title */}
          <div>
            <label htmlFor="site-title" className="block text-sm font-medium text-gray-300">
              Site Title <span className="text-gray-600">(optional)</span>
            </label>
            <input
              id="site-title"
              type="text"
              placeholder="e.g. Jane Doe — Developer"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Site Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Site Type <span className="text-red-400">*</span>
            </label>
            <div className="mt-2 flex gap-3">
              {(['portfolio', 'blog', 'both'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSiteType(t)}
                  className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors ${
                    siteType === t
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Theme <span className="text-red-400">*</span>
            </label>
            <div className="mt-2 flex gap-3">
              {(['minimal', 'terminal', 'editorial'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors ${
                    theme === t
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!urlValid || ingest.isPending}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ingest.isPending ? 'Ingesting...' : 'Generate Portfolio'}
          </button>
        </form>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-lg border border-yellow-600/30 bg-yellow-900/80 px-4 py-3 text-sm text-yellow-200 shadow-lg backdrop-blur">
          <div className="flex items-start gap-2">
            <span className="flex-1">{toast}</span>
            <button
              onClick={() => setToast(null)}
              className="text-yellow-300 hover:text-yellow-100"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
