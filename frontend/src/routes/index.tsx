import { createFileRoute } from '@tanstack/react-router'
import { useHealthApiHealthGet } from '../api/generated'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { data, isLoading, isError } = useHealthApiHealthGet()

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
        Dev Portfolio Builder
      </h1>
      <p className="mt-6 text-lg leading-8 text-gray-600">
        Build and showcase your developer portfolio.
      </p>
      <div className="mt-10">
        <div className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2.5 text-sm">
          <span className="font-medium text-gray-700">API Status:</span>
          {isLoading && (
            <span className="text-gray-500">Checking...</span>
          )}
          {isError && (
            <span className="text-red-600">Unreachable</span>
          )}
          {data && (
            <span className="font-semibold text-green-600">{data.status}</span>
          )}
        </div>
      </div>
    </div>
  )
}
