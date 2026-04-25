import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900">About</h1>
      <p className="mt-6 text-lg leading-8 text-gray-600">
        A monorepo project using React, TypeScript, Vite, and FastAPI.
      </p>
    </div>
  )
}
