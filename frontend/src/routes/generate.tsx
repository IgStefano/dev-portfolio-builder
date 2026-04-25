import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { ApiError } from '../api/client'
import { useGenerateApiGeneratePost } from '../api/generated'
import type { GitHubProfile, SiteType, Theme } from '../api/generated'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'

type GenerateSearch = {
  profile: string
  siteTitle?: string
  siteType: SiteType
  theme: Theme
}

export const Route = createFileRoute('/generate')({
  component: GeneratePage,
  validateSearch: (search: Record<string, unknown>): GenerateSearch => ({
    profile: (search.profile as string) ?? '',
    siteTitle: search.siteTitle as string | undefined,
    siteType: (search.siteType as SiteType) ?? 'portfolio',
    theme: (search.theme as Theme) ?? 'minimal',
  }),
})

function GeneratePage() {
  const navigate = useNavigate()
  const { profile: profileJson, siteTitle, siteType, theme } = Route.useSearch()

  let profile: GitHubProfile | null = null
  try {
    profile = JSON.parse(profileJson) as GitHubProfile
  } catch {
    // invalid profile data
  }

  // Persist profile + preferences for the preview page
  if (profile) {
    sessionStorage.setItem('dpb:profile', profileJson)
    sessionStorage.setItem(
      'dpb:preferences',
      JSON.stringify({ siteTitle, siteType, theme, tone: 'professional' as const }),
    )
  }

  const generate = useGenerateApiGeneratePost({
    mutation: {
      onSuccess: (site) => {
        navigate({
          to: '/preview',
          search: { site: JSON.stringify(site), theme },
        })
      },
    },
  })

  useEffect(() => {
    if (profile && !generate.isPending && !generate.isSuccess && !generate.isError) {
      generate.mutate({
        data: {
          profile,
          site_title: siteTitle,
          site_type: siteType,
          theme,
          tone: 'professional',
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg text-red-400">Invalid profile data.</p>
          <Button variant="outline" onClick={() => navigate({ to: '/' })}>
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-8">
        <h2 className="text-2xl font-bold text-white text-center">
          Building your portfolio...
        </h2>

        {/* Profile summary */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="h-16 w-16 rounded-full border-2 border-gray-700"
              />
              <div>
                <p className="text-lg font-semibold text-white">{profile.name ?? profile.username}</p>
                <p className="text-sm text-gray-400">@{profile.username}</p>
              </div>
            </div>

            {profile.bio && <p className="text-sm text-gray-300">{profile.bio}</p>}

            {profile.languages && profile.languages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((lang) => (
                  <span
                    key={lang}
                    className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-300"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            )}

            {profile.top_repos && profile.top_repos.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                  Top Repositories
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {profile.top_repos.slice(0, 6).map((repo) => (
                    <div key={repo.name} className="rounded-lg bg-gray-800/50 px-3 py-2">
                      <p className="text-sm font-medium text-gray-200">{repo.name}</p>
                      {repo.language && (
                        <p className="text-xs text-gray-500">{repo.language}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status */}
        <div className="text-center">
          {generate.isPending && (
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Generating your site...</span>
            </div>
          )}

          {generate.isError && (
            <div className="space-y-3">
              <p className="text-lg font-semibold text-red-400">Generation failed</p>
              <p className="text-sm text-gray-400">
                {generate.error instanceof ApiError && generate.error.detail
                  ? generate.error.detail
                  : 'An unexpected error occurred while generating your site.'}
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  onClick={() => generate.mutate({
                    data: {
                      profile,
                      site_title: siteTitle,
                      site_type: siteType,
                      theme,
                      tone: 'professional',
                    },
                  })}
                >
                  Retry
                </Button>
                <Button variant="outline" onClick={() => navigate({ to: '/' })}>
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
