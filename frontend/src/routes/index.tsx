import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
        Dev Portfolio Builder
      </h1>
      <p className="mt-6 text-lg leading-8 text-gray-600">
        Build and showcase your developer portfolio.
      </p>
      <div className="mt-10">
        <a
          href="/api/health"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          Check API Health
        </a>
      </div>
    </div>
  )
}
