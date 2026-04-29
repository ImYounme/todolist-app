import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../constants/routes';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email, password, t) {
  const errors = {};
  if (!email) {
    errors.email = t('auth.emailRequired');
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = t('auth.emailInvalid');
  }
  if (!password) {
    errors.password = t('auth.passwordRequired');
  }
  return errors;
}

export function LoginForm({ onSubmit, isLoading, serverError }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  function handleSubmit(e) {
    e.preventDefault();
    const errors = validate(email, password, t);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    onSubmit(email, password);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-4">
        <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="login-email">
          {t('auth.email')}
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          autoComplete="email"
          disabled={isLoading}
          className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary disabled:opacity-50"
        />
        {fieldErrors.email && (
          <p role="alert" className="mt-1 text-xs text-overdue">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-text-primary mb-1" htmlFor="login-password">
          {t('auth.password')}
        </label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          disabled={isLoading}
          className="w-full px-3 py-2 border border-border-gray rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary disabled:opacity-50"
        />
        {fieldErrors.password && (
          <p role="alert" className="mt-1 text-xs text-overdue">
            {fieldErrors.password}
          </p>
        )}
      </div>

      {serverError && (
        <p role="alert" className="mb-4 text-sm text-overdue text-center">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? t('common.processing') : t('auth.loginButton')}
      </button>

      <p className="mt-6 text-center text-sm text-text-secondary">
        {t('auth.noAccount')}{' '}
        <Link to={ROUTES.SIGNUP} className="text-primary hover:underline">
          {t('auth.signupLink')}
        </Link>
      </p>
    </form>
  );
}
