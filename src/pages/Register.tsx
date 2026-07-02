import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuthStore } from '../store/authStore'
import type { RegisterRequest } from '../types'
import { AuthLayout, FieldError } from './authUi'
import { inputClass, labelClass, submitClass } from './authStyles'

interface RegisterForm extends RegisterRequest {
  confirmPassword: string
}

export function Register() {
  const registerUser = useAuthStore((s) => s.register)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>()

  const onSubmit = handleSubmit(async (values) => {
    const body: RegisterRequest = {
      username: values.username,
      email: values.email,
      password: values.password,
    }
    try {
      await registerUser(body)
      navigate('/grid', { replace: true })
    } catch (err) {
      // Map the server's specific field error inline (SPEC §5.1). The backend
      // identifies the offending field on 409 conflicts via ApiError.field.
      if (err instanceof ApiError && (err.field === 'username' || err.field === 'email')) {
        setError(err.field, { message: err.message })
      } else {
        const message =
          err instanceof ApiError ? err.message : 'Something went wrong. Try again in a moment.'
        setError('root', { message })
      }
    }
  })

  return (
    <AuthLayout
      title="Create your account"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-signal hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {errors.root && (
          <p role="alert" className="text-sm text-signal">
            {errors.root.message}
          </p>
        )}

        <div>
          <label htmlFor="username" className={labelClass}>
            Username
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            className={inputClass}
            aria-invalid={errors.username ? 'true' : undefined}
            aria-describedby={errors.username ? 'username-error' : undefined}
            {...register('username', { required: 'Username is required' })}
          />
          {errors.username && (
            <FieldError id="username-error" message={errors.username.message} />
          )}
        </div>

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
            autoComplete="new-password"
            className={inputClass}
            aria-invalid={errors.password ? 'true' : undefined}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
            })}
          />
          {errors.password && (
            <FieldError id="password-error" message={errors.password.message} />
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className={labelClass}>
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={inputClass}
            aria-invalid={errors.confirmPassword ? 'true' : undefined}
            aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) =>
                value === getValues('password') || 'Passwords do not match',
            })}
          />
          {errors.confirmPassword && (
            <FieldError id="confirmPassword-error" message={errors.confirmPassword.message} />
          )}
        </div>

        <button type="submit" disabled={isSubmitting} className={submitClass}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  )
}
