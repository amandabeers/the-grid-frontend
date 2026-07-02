import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { Location } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { LoginRequest } from '../types'
import { AuthLayout, FieldError } from './authUi'
import { inputClass, labelClass, submitClass } from './authStyles'

export function Login() {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>()

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await login(values)
      const from = (location.state as { from?: Location } | null)?.from?.pathname ?? '/'
      // `Location` above is react-router's, matching what AuthGuard stores.
      navigate(from, { replace: true })
    } catch {
      // Deliberately generic — don't reveal whether the email exists (SPEC §5.2).
      setFormError('Email or password is incorrect.')
    }
  })

  return (
    <AuthLayout
      title="Sign in"
      footer={
        <>
          Need an account?{' '}
          <Link to="/register" className="text-signal hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {formError && (
          <p role="alert" className="text-sm text-signal">
            {formError}
          </p>
        )}

        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={inputClass}
            aria-invalid={errors.email ? 'true' : undefined}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email', { required: 'Email is required' })}
          />
          {errors.email && <FieldError id="email-error" message={errors.email.message} />}
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className={inputClass}
            aria-invalid={errors.password ? 'true' : undefined}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password', { required: 'Password is required' })}
          />
          {errors.password && (
            <FieldError id="password-error" message={errors.password.message} />
          )}
        </div>

        <button type="submit" disabled={isSubmitting} className={submitClass}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  )
}
