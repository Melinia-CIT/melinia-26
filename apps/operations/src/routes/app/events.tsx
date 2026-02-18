import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/events')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/events"!</div>
}
