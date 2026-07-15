import { Link } from 'react-router-dom'
import { Seo } from '@/components/Seo'
import { Container } from '@/components/Container'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <>
      <Seo title="Page not found" />
      <Container className="grid min-h-[70vh] place-items-center py-16 text-center">
        <div>
          <p className="text-7xl font-black text-brand-600">404</p>
          <h1 className="mt-4 text-2xl font-bold text-ink-900">Page not found</h1>
          <p className="mt-2 text-ink-500">The page you’re looking for doesn’t exist or has moved.</p>
          <Link to="/" className="mt-6 inline-block"><Button>Back to home</Button></Link>
        </div>
      </Container>
    </>
  )
}
