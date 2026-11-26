import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { type AxiosError } from 'axios';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  Code2,
  Loader2,
  ArrowRight,
  AlertCircle,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

function getErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  if (axiosError?.response?.data?.message) {
    return axiosError.response.data.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

type PreferredLanguage = 'c' | 'cpp' | 'java' | 'python';

interface FormErrors {
  name?: string;
  email?: string;
  college?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  barColor: string;
  textColor: string;
  checks: {
    length: boolean;
    upper: boolean;
    lower: boolean;
    number: boolean;
    special: boolean;
  };
}

function evaluatePasswordStrength(password: string): PasswordStrength {
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const rawScore = Object.values(checks).filter(Boolean).length;
  // Map 0..5 checks into 0..4 levels
  const score = password.length === 0 ? 0 : Math.min(4, Math.max(1, rawScore - (checks.length ? 0 : 1)));

  if (score <= 1) {
    return {
      score,
      label: 'Weak',
      barColor: 'bg-red-500',
      textColor: 'text-red-500',
      checks,
    };
  }
  if (score === 2) {
    return {
      score,
      label: 'Fair',
      barColor: 'bg-amber-500',
      textColor: 'text-amber-500',
      checks,
    };
  }
  if (score === 3) {
    return {
      score,
      label: 'Good',
      barColor: 'bg-[#38BDF8]',
      textColor: 'text-[#38BDF8]',
      checks,
    };
  }
  return {
    score,
    label: 'Strong',
    barColor: 'bg-[#22C55E]',
    textColor: 'text-[#22C55E]',
    checks,
  };
}

const LANGUAGE_OPTIONS: { value: PreferredLanguage; label: string }[] = [
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
];

export default function RegisterPage() {
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage>('cpp');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const strength = useMemo(() => evaluatePasswordStrength(password), [password]);

  if (!authLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!name.trim()) {
      nextErrors.name = 'Full name is required.';
    } else if (name.trim().length < 2) {
      nextErrors.name = 'Name must be at least 2 characters.';
    }

    if (!email.trim()) {
      nextErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!college.trim()) {
      nextErrors.college = 'College or institution name is required.';
    } else if (college.trim().length < 2) {
      nextErrors.college = 'College name must be at least 2 characters.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    } else if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      nextErrors.password = 'Password must include uppercase, lowercase, and a number.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!acceptTerms) {
      nextErrors.terms = 'You must accept the Terms of Service and Privacy Policy.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate() || isLoading) return;

    setIsLoading(true);
    try {
      const normalizedEmail = email.trim();
      const derivedUsername =
        normalizedEmail.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '') ||
        name.trim().toLowerCase().replace(/\s+/g, '');

      const payload = {
        name: name.trim(),
        username: derivedUsername,
        email: normalizedEmail,
        password,
        collegeName: college.trim(),
        preferredLanguage,
      };

      await register(payload as Parameters<typeof register>[0]);

      toast.success('Account created! Let the climb begin.', { id: 'auth-success' });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          'Registration failed. Please check your details and try again.'
        ),
        { id: 'auth-error' }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900 dark:bg-[#0D1117] dark:text-[#F0F6FC]">
      {/* Subtle background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-0 h-80 w-[38rem] -translate-x-1/2 rounded-full bg-[#22C55E]/10 blur-[120px]"
      />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative w-full max-w-lg"
      >
        {/* Header */}
        <div className="mb-7 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <svg
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10"
              aria-hidden="true"
            >
              <rect
                x="1.5"
                y="1.5"
                width="33"
                height="33"
                rx="9"
                className="fill-[#22C55E]/10 stroke-[#22C55E]/35"
                strokeWidth="1.5"
              />
              <path
                d="M10.5 13L6 18L10.5 23"
                stroke="#22C55E"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M25.5 13L30 18L25.5 23"
                stroke="#22C55E"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.5 23.5L18 11.5L23.5 23.5"
                stroke="#22C55E"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15.4 17.2L18 11.5L20.6 17.2"
                stroke="#38BDF8"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-2xl font-extrabold tracking-tight">
              Code<span className="text-[#22C55E]">Climb</span>
            </span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F0F6FC]">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#8B949E]">
            Start mastering data structures &amp; algorithms step by step
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-[#30363D] dark:bg-[#1C2128] sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Name */}
            <div>
              <label
                htmlFor="reg-name"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-[#F0F6FC]"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-[#8B949E]" />
                <input
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="Alex Sharma"
                  className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 dark:bg-[#0D1117] dark:text-[#F0F6FC] dark:placeholder:text-[#8B949E] ${
                    errors.name
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-200 focus:border-[#22C55E] focus:ring-[#22C55E]/20 dark:border-[#30363D]'
                  }`}
                />
              </div>
              {errors.name && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-red-500">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="reg-email"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-[#F0F6FC]"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-[#8B949E]" />
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="alex@university.edu"
                  className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 dark:bg-[#0D1117] dark:text-[#F0F6FC] dark:placeholder:text-[#8B949E] ${
                    errors.email
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-200 focus:border-[#22C55E] focus:ring-[#22C55E]/20 dark:border-[#30363D]'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-red-500">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* College & Language row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="reg-college"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-[#F0F6FC]"
                >
                  College / University
                </label>
                <div className="relative">
                  <GraduationCap className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-[#8B949E]" />
                  <input
                    id="reg-college"
                    type="text"
                    value={college}
                    onChange={(e) => {
                      setCollege(e.target.value);
                      if (errors.college) setErrors((prev) => ({ ...prev, college: undefined }));
                    }}
                    placeholder="MIT / NIT / IIT..."
                    className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 dark:bg-[#0D1117] dark:text-[#F0F6FC] dark:placeholder:text-[#8B949E] ${
                      errors.college
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-slate-200 focus:border-[#22C55E] focus:ring-[#22C55E]/20 dark:border-[#30363D]'
                    }`}
                  />
                </div>
                {errors.college && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-red-500">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {errors.college}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="reg-language"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-[#F0F6FC]"
                >
                  Preferred Language
                </label>
                <div className="relative">
                  <Code2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-[#8B949E]" />
                  <select
                    id="reg-language"
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value as PreferredLanguage)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-8 text-sm text-slate-900 transition-colors focus:border-[#22C55E] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#F0F6FC]"
                  >
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="reg-password"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-[#F0F6FC]"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-[#8B949E]" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Minimum 8 characters"
                  className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 dark:bg-[#0D1117] dark:text-[#F0F6FC] dark:placeholder:text-[#8B949E] ${
                    errors.password
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-200 focus:border-[#22C55E] focus:ring-[#22C55E]/20 dark:border-[#30363D]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 dark:text-[#8B949E] dark:hover:text-[#F0F6FC]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-red-500">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {errors.password}
                </p>
              )}

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="mt-2.5 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-[#30363D] dark:bg-[#0D1117]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-[#8B949E]">Password strength</span>
                    <span className={`font-semibold ${strength.textColor}`}>{strength.label}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1.5 rounded-full transition-colors duration-200 ${
                          step <= strength.score
                            ? strength.barColor
                            : 'bg-slate-200 dark:bg-[#30363D]'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                    {[
                      { ok: strength.checks.length, text: '8+ characters' },
                      { ok: strength.checks.upper && strength.checks.lower, text: 'Upper & lowercase' },
                      { ok: strength.checks.number, text: 'Contains a number' },
                      { ok: strength.checks.special, text: 'Special character' },
                    ].map((rule) => (
                      <div
                        key={rule.text}
                        className={`flex items-center gap-1 ${
                          rule.ok
                            ? 'text-[#22C55E]'
                            : 'text-slate-400 dark:text-[#8B949E]'
                        }`}
                      >
                        <Check className="h-3 w-3 shrink-0" />
                        <span>{rule.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="reg-confirm-password"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-[#F0F6FC]"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-[#8B949E]" />
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }
                  }}
                  placeholder="Re-enter your password"
                  className={`w-full rounded-xl border bg-slate-50 py-2.5 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 dark:bg-[#0D1117] dark:text-[#F0F6FC] dark:placeholder:text-[#8B949E] ${
                    errors.confirmPassword
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-200 focus:border-[#22C55E] focus:ring-[#22C55E]/20 dark:border-[#30363D]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 dark:text-[#8B949E] dark:hover:text-[#F0F6FC]"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-red-500">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div>
              <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-slate-600 dark:text-[#8B949E]">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    if (errors.terms) setErrors((prev) => ({ ...prev, terms: undefined }));
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 bg-white accent-[#22C55E] dark:border-[#30363D] dark:bg-[#0D1117]"
                />
                <span>
                  I agree to the{' '}
                  <span className="font-medium text-[#38BDF8]">Terms of Service</span> and{' '}
                  <span className="font-medium text-[#38BDF8]">Privacy Policy</span>.
                </span>
              </label>
              {errors.terms && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-red-500">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {errors.terms}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#22C55E] px-5 py-3 text-sm font-semibold text-[#0D1117] shadow-md shadow-[#22C55E]/20 transition-all hover:bg-[#16A34A] disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-[#8B949E]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#22C55E] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
