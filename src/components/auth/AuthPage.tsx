import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import styles from './AuthPage.module.css';

type Mode = 'login' | 'register';

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const { login, register, isLoading, error } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (!username.trim() || !password.trim()) {
      setLocalError('Please fill in all required fields');
      return;
    }

    if (mode === 'register' && !email.trim()) {
      setLocalError('Email is required for registration');
      return;
    }

    try {
      if (mode === 'login') {
        await login({ username, password });
      } else {
        await register({ username, email, password });
      }
    } catch {
      // error already set in store
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setLocalError(null);
    setUsername('');
    setEmail('');
    setPassword('');
  }

  const displayError = localError ?? error;

  return (
    <div className={styles.container}>
      <div className={styles.backdrop} />
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>T</span>
          <span className={styles.logoText}>TaskBoard</span>
        </div>

        <h1 className={styles.heading}>
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>
        <p className={styles.subheading}>
          {mode === 'login'
            ? 'Sign in to your workspace'
            : 'Get started for free today'}
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Username</label>
            <input
              className={styles.input}
              type="text"
              placeholder="your_username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              disabled={isLoading}
            />
          </div>

          {mode === 'register' && (
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isLoading}
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              disabled={isLoading}
            />
          </div>

          {displayError && (
            <div className={styles.error} role="alert">
              {displayError}
            </div>
          )}

          <button
            className={styles.submit}
            type="submit"
            disabled={isLoading}
          >
            {isLoading
              ? 'Please wait…'
              : mode === 'login'
              ? 'Sign in'
              : 'Create account'}
          </button>
        </form>

        <div className={styles.toggle}>
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                className={styles.toggleBtn}
                onClick={() => switchMode('register')} 
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                className={styles.toggleBtn}
                onClick={() => switchMode('login')} 
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
