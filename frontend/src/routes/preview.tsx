import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { GeneratedSite, Theme } from '../api/generated'

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
  const { site: siteJson } = Route.useSearch()

  let site: GeneratedSite | null = null
  try {
    site = JSON.parse(siteJson) as GeneratedSite
  } catch {
    // invalid site data
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
      <div className="mx-auto max-w-4xl space-y-12">
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

        {/* Rendered site (plain HTML) */}
        <div className="rounded-xl border border-gray-800 bg-white text-gray-900 overflow-hidden">
          {/* Hero */}
          <section className="bg-gray-50 px-8 py-16 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              {site.hero.headline}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              {site.hero.subheadline}
            </p>
          </section>

          {/* About */}
          <section className="px-8 py-12">
            <h2 className="text-2xl font-bold text-gray-900">About</h2>
            <p className="mt-4 leading-relaxed text-gray-600">{site.about.text}</p>
          </section>

          {/* Projects */}
          {site.projects && site.projects.length > 0 && (
            <section className="border-t border-gray-200 px-8 py-12">
              <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {site.projects.map((project) => (
                  <div
                    key={project.title}
                    className="rounded-lg border border-gray-200 p-5"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600"
                      >
                        {project.title}
                      </a>
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">{project.description}</p>
                    {project.tags && project.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {project.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Blog */}
          {site.blog && site.blog.posts && site.blog.posts.length > 0 && (
            <section className="border-t border-gray-200 px-8 py-12">
              <h2 className="text-2xl font-bold text-gray-900">{site.blog.heading}</h2>
              <div className="mt-6 space-y-6">
                {site.blog.posts.map((post) => (
                  <article key={post.title} className="border-l-2 border-gray-300 pl-4">
                    <p className="text-xs text-gray-500">{post.date}</p>
                    <h3 className="mt-1 text-lg font-semibold text-gray-900">{post.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{post.summary}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
