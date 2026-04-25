import { createFileRoute } from '@tanstack/react-router'
import { SiteRenderer } from '../components/SiteRenderer'
import { usePreviewReceiver } from '../lib/previewChannel'

export const Route = createFileRoute('/render')({
  component: RenderPage,
})

function RenderPage() {
  const payload = usePreviewReceiver()

  if (!payload) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-400">Waiting for preview data...</p>
      </div>
    )
  }

  return <SiteRenderer site={payload.site} theme={payload.theme} />
}
