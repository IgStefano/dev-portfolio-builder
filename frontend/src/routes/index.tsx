import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useHealthApiHealthGet, useIngestApiIngestPost } from '../api/generated'
import type { SiteType, Theme } from '../api/generated'
import { ApiRequestError } from '../api/client'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group'

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
        return null
      }
    }
    return 'Something went wrong. Please check the URL and try again.'
  })()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Hero */}
        <div className="text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Dev Portfolio Builder
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Turn your GitHub profile into a polished portfolio site in under a minute.
          </p>
        </div>

        {/* Health banner */}
        {health && health.anthropic_key_present === false && (
          <div className="rounded-lg border border-yellow-600/30 bg-yellow-900/20 px-4 py-3 text-center text-sm text-yellow-300">
            Demo mode: LLM not configured. Set <code className="rounded bg-yellow-900/40 px-1.5 py-0.5 font-mono text-xs">ANTHROPIC_API_KEY</code> to enable real generation.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* GitHub URL */}
          <div className="space-y-1.5">
            <Label htmlFor="github-url">
              GitHub Profile URL <span className="text-red-400">*</span>
            </Label>
            <Input
              id="github-url"
              type="url"
              placeholder="https://github.com/username"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              onBlur={() => setUrlTouched(true)}
              className={
                showUrlError || (ingest.isError && ingestErrorMessage)
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : undefined
              }
            />
            {showUrlError && (
              <p className="text-sm text-red-400">
                Please enter a valid GitHub URL (e.g. https://github.com/username)
              </p>
            )}
            {ingestErrorMessage && (
              <p className="text-sm text-red-400">{ingestErrorMessage}</p>
            )}
          </div>

          {/* Site Title */}
          <div className="space-y-1.5">
            <Label htmlFor="site-title">
              Site Title <span className="text-gray-600">(optional)</span>
            </Label>
            <Input
              id="site-title"
              type="text"
              placeholder="e.g. Jane Doe — Developer"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
            />
          </div>

          {/* Site Type */}
          <div className="space-y-1.5">
            <Label>
              Site Type <span className="text-red-400">*</span>
            </Label>
            <ToggleGroup
              type="single"
              value={siteType}
              onValueChange={(v) => { if (v) setSiteType(v as SiteType) }}
            >
              {(['portfolio', 'blog', 'both'] as const).map((t) => (
                <ToggleGroupItem key={t} value={t}>
                  {t}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Theme */}
          <div className="space-y-1.5">
            <Label>
              Theme <span className="text-red-400">*</span>
            </Label>
            <ToggleGroup
              type="single"
              value={theme}
              onValueChange={(v) => { if (v) setTheme(v as Theme) }}
            >
              {(['minimal', 'terminal', 'editorial'] as const).map((t) => (
                <ToggleGroupItem key={t} value={t}>
                  {t}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={!urlValid || ingest.isPending}
            className="w-full"
            size="lg"
          >
            {ingest.isPending ? 'Ingesting...' : 'Generate Portfolio'}
          </Button>
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
