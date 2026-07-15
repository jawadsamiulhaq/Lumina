import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
  message?: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center px-6 text-center">
          <div className="max-w-md space-y-4">
            <h1 className="text-2xl font-bold text-ink-900">Something broke</h1>
            <p className="text-sm text-ink-500">{this.state.message ?? 'An unexpected error occurred.'}</p>
            <Button onClick={() => window.location.assign('/')}>Back to home</Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
