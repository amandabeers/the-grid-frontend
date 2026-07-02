import type { ReactNode } from 'react'

// Shared components for the auth screens (Login, Register).
// Class-string constants live in ./authStyles so this file only exports
// components (keeps React Fast Refresh happy).

export function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <p id={id} role="alert" className="mt-1 text-sm text-signal">
      {message}
    </p>
  )
}

interface AuthLayoutProps {
  title: string
  children: ReactNode
  footer: ReactNode
}

export function AuthLayout({ title, children, footer }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8">
        <h1 className="mb-6 font-display text-3xl font-bold text-chalk">The Grid</h1>
        <h2 className="mb-6 font-display text-xl text-chalk">{title}</h2>
        {children}
        <p className="mt-6 text-center font-body text-sm text-chalk-muted">{footer}</p>
      </div>
    </main>
  )
}
