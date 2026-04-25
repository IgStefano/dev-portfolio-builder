import type { GeneratedSite, Theme } from '../api/generated'
import '../lib/themes.css'

type SiteRendererProps = {
  site: GeneratedSite
  theme: Theme
}

export function SiteRenderer({ site, theme }: SiteRendererProps) {
  return (
    <div data-theme={theme} style={rootStyle}>
      {/* Hero */}
      <section style={theme === 'editorial' ? heroEditorialStyle : heroStyle}>
        <h1 style={headlineStyle}>{site.hero.headline}</h1>
        <p style={subheadlineStyle}>{site.hero.subheadline}</p>
      </section>

      {/* Divider (Terminal only uses ASCII) */}
      {theme === 'terminal' && <Divider />}

      {/* About */}
      <section style={sectionStyle}>
        <h2 style={sectionHeadingStyle}>About</h2>
        <p style={bodyTextStyle}>{site.about.text}</p>
      </section>

      {theme === 'terminal' && <Divider />}

      {/* Projects */}
      {site.projects && site.projects.length > 0 && (
        <section style={sectionWithBorderStyle}>
          <h2 style={sectionHeadingStyle}>Projects</h2>
          <div style={projectGridStyle}>
            {site.projects.map((project) => (
              <div key={project.title} style={projectCardStyle}>
                <h3 style={projectTitleStyle}>
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkStyle}
                  >
                    {project.title}
                  </a>
                </h3>
                <p style={projectDescStyle}>{project.description}</p>
                {project.tags && project.tags.length > 0 && (
                  <div style={tagContainerStyle}>
                    {project.tags.map((tag) => (
                      <span key={tag} style={tagStyle}>
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

      {theme === 'terminal' && site.blog?.posts?.length && <Divider />}

      {/* Blog */}
      {site.blog && site.blog.posts && site.blog.posts.length > 0 && (
        <section style={sectionWithBorderStyle}>
          <h2 style={sectionHeadingStyle}>{site.blog.heading}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-inner)' }}>
            {site.blog.posts.map((post) => (
              <article key={post.title} style={blogPostStyle}>
                <p style={blogDateStyle}>{post.date}</p>
                <h3 style={blogTitleStyle}>{post.title}</h3>
                <p style={blogSummaryStyle}>{post.summary}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Divider() {
  return (
    <div
      style={{
        textAlign: 'center',
        color: 'var(--fg-muted)',
        fontFamily: 'var(--font-body)',
        fontSize: '0.75rem',
        padding: '0.5rem 0',
        letterSpacing: '0.2em',
      }}
    >
      {'─'.repeat(40)}
    </div>
  )
}

/* ── Inline style objects using CSS variables ── */

const rootStyle: React.CSSProperties = {
  minHeight: '100vh',
  overflowX: 'hidden',
  background: 'var(--bg)',
  color: 'var(--fg)',
  fontFamily: 'var(--font-body)',
  margin: 0,
}

const heroStyle: React.CSSProperties = {
  background: 'var(--bg-muted)',
  padding: 'calc(var(--space-section) * 1.5) 2rem',
  textAlign: 'center',
}

const heroEditorialStyle: React.CSSProperties = {
  background: 'var(--bg-muted)',
  padding: 'calc(var(--space-section) * 1.5) 2rem',
  textAlign: 'left',
  maxWidth: '38rem',
  marginLeft: '10%',
}

const headlineStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '2.5rem',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: 'var(--fg)',
  margin: 0,
}

const subheadlineStyle: React.CSSProperties = {
  marginTop: '1rem',
  fontSize: '1.125rem',
  color: 'var(--fg-muted)',
  maxWidth: '36rem',
  lineHeight: 1.6,
}

const sectionStyle: React.CSSProperties = {
  padding: 'var(--space-section) 2rem',
}

const sectionWithBorderStyle: React.CSSProperties = {
  padding: 'var(--space-section) 2rem',
  borderTop: '1px solid var(--border)',
}

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '1.5rem',
  fontWeight: 700,
  color: 'var(--fg)',
  margin: '0 0 var(--space-inner) 0',
}

const bodyTextStyle: React.CSSProperties = {
  lineHeight: 1.7,
  color: 'var(--fg-muted)',
}

const projectGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 'var(--space-inner)',
}

const projectCardStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '1.25rem',
}

const projectTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '1.125rem',
  fontWeight: 600,
  color: 'var(--fg)',
  margin: 0,
}

const linkStyle: React.CSSProperties = {
  color: 'var(--accent)',
  textDecoration: 'none',
}

const projectDescStyle: React.CSSProperties = {
  marginTop: '0.5rem',
  fontSize: '0.875rem',
  color: 'var(--fg-muted)',
  lineHeight: 1.5,
}

const tagContainerStyle: React.CSSProperties = {
  marginTop: '0.75rem',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.375rem',
}

const tagStyle: React.CSSProperties = {
  background: 'var(--bg-muted)',
  color: 'var(--fg-muted)',
  fontSize: '0.75rem',
  padding: '0.125rem 0.625rem',
  borderRadius: '9999px',
}

const blogPostStyle: React.CSSProperties = {
  borderLeft: '2px solid var(--border)',
  paddingLeft: '1rem',
}

const blogDateStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--fg-muted)',
}

const blogTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '1.125rem',
  fontWeight: 600,
  color: 'var(--fg)',
  margin: '0.25rem 0',
}

const blogSummaryStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--fg-muted)',
  lineHeight: 1.5,
}
