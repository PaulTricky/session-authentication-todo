import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const AuthPage = ({ mode = 'login' }) => {
  const isRegister = mode === 'register';
  const { register, login } = useAppContext();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setError('');

    const result = isRegister
      ? await register(form)
      : await login({ email: form.email, password: form.password });

    // On success the user lands in context and GuestLayout redirects to '/',
    // unmounting this component - so only the failure path touches state.
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/15 disabled:opacity-60';

  console.log('asdasdsdsa');

  return (
    <div className='min-h-screen flex items-center justify-center bg-zinc-50 px-6 py-12'>
      <div className='w-full max-w-sm'>
        <div className='flex items-center gap-2 mb-8'>
          <div className='size-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm'>
            B
          </div>
          <span className='font-bold text-xl tracking-tight text-zinc-900'>
            BuilderAI
          </span>
        </div>

        <h1 className='text-2xl font-bold tracking-tight text-zinc-950 mb-1'>
          {isRegister ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className='text-sm text-zinc-500 mb-8'>
          {isRegister
            ? 'Start building websites with a single prompt.'
            : 'Sign in to pick up where you left off.'}
        </p>

        <form onSubmit={handleSubmit} noValidate className='space-y-4'>
          {isRegister && (
            <div>
              <label
                htmlFor='name'
                className='block text-sm font-medium text-zinc-700 mb-1.5'
              >
                Name
              </label>
              <input
                id='name'
                type='text'
                autoComplete='name'
                placeholder='Alex Rivera'
                value={form.name}
                onChange={update('name')}
                disabled={submitting}
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-zinc-700 mb-1.5'
            >
              Email
            </label>
            <input
              id='email'
              type='email'
              autoComplete='email'
              placeholder='you@example.com'
              value={form.email}
              onChange={update('email')}
              disabled={submitting}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor='password'
              className='block text-sm font-medium text-zinc-700 mb-1.5'
            >
              Password
            </label>
            <div className='relative'>
              <input
                id='password'
                type={showPassword ? 'text' : 'password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                placeholder='••••••••'
                value={form.password}
                onChange={update('password')}
                disabled={submitting}
                className={inputClass + ' pr-11'}
              />
              <button
                type='button'
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className='absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400 hover:text-zinc-600 transition cursor-pointer'
              >
                {showPassword ? (
                  <EyeOffIcon size={16} />
                ) : (
                  <EyeIcon size={16} />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              role='alert'
              className='flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700'
            >
              <AlertCircleIcon size={16} className='mt-0.5 shrink-0' />
              <span>{error}</span>
            </div>
          )}

          <button
            type='submit'
            disabled={submitting}
            className='w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow-sm transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
          >
            {submitting && <Loader2Icon size={16} className='animate-spin' />}
            {isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className='mt-6 text-sm text-zinc-500 text-center'>
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <Link
            to={isRegister ? '/login' : '/register'}
            className='font-semibold text-red-600 hover:text-red-700 transition'
          >
            {isRegister ? 'Sign in' : 'Sign up'}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
