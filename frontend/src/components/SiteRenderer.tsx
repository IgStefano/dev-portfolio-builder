import type { GeneratedSite, Theme } from '../api/generated'

type SiteRendererProps = {
  site: GeneratedSite
  theme: Theme
}

export function SiteRenderer({ site, theme }: SiteRendererProps) {
  return (
    <div data-theme={theme} className="min-h-screen overflow-x-hidden bg-white text-gray-900">
      {/* Hero */}
      <section className="bg-gray-50 px-4 py-10 text-center sm:px-8 sm:py-16">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {site.hero.headline}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 sm:text-lg">
          {site.hero.subheadline}
        </p>
      </section>

      {/* About */}
      <section className="px-4 py-8 sm:px-8 sm:py-12">
        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">About</h2>
        <p className="mt-4 leading-relaxed text-gray-600">{site.about.text}</p>
      </section>

      {/* Projects */}
      {site.projects && site.projects.length > 0 && (
        <section className="border-t border-gray-200 px-4 py-8 sm:px-8 sm:py-12">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Projects</h2>
          <div className="mt-6 grid gap-4 sm:gap-6 sm:grid-cols-2">
            {site.projects.map((project) => (
              <div
                key={project.title}
                className="rounded-lg border border-gray-200 p-4 sm:p-5"
              >
                <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
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
        <section className="border-t border-gray-200 px-4 py-8 sm:px-8 sm:py-12">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{site.blog.heading}</h2>
          <div className="mt-6 space-y-6">
            {site.blog.posts.map((post) => (
              <article key={post.title} className="border-l-2 border-gray-300 pl-4">
                <p className="text-xs text-gray-500">{post.date}</p>
                <h3 className="mt-1 text-base font-semibold text-gray-900 sm:text-lg">{post.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{post.summary}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
