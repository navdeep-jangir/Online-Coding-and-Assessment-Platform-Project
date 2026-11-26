import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  GraduationCap,
  Code2,
  Lock,
  Eye,
  EyeOff,
  Save,
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';

type PreferredLanguage = 'c' | 'cpp' | 'java' | 'python';

const LANGUAGE_OPTIONS: { value: PreferredLanguage; label: string }[] = [
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
];

function normalizeLanguage(lang?: string): PreferredLanguage {
  const lowered = (lang || 'cpp').toLowerCase();
  if (lowered === 'c++' || lowered === 'cpp') return 'cpp';
  if (lowered === 'c' || lowered === 'java' || lowered === 'python') return lowered;
  return 'cpp';
}

function getInitials(name?: string): string {
  if (!name) return 'CC';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'CC';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();

  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [college, setCollege] = useState(user?.collegeName || user?.college || '');
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage>(
    normalizeLanguage(user?.preferredLanguage)
  );
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setCollege(user.collegeName || user.college || '');
    setPreferredLanguage(normalizeLanguage(user.preferredLanguage));
  }, [user]);

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedCollege = college.trim();

    if (trimmedName.length < 2) {
      setProfileError('Name must be at least 2 characters.');
      return;
    }

    setProfileError(null);
    setIsSavingProfile(true);
    try {
      const payload = {
        name: trimmedName,
        collegeName: trimmedCollege,
        preferredLanguage,
      };
      await updateProfile(payload as Parameters<typeof updateProfile>[0]);
      toast.success('Profile updated successfully!');
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Could not update profile. Please try again.';
      toast.error(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setPasswordError('New password must include uppercase, lowercase, and a number.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from your current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordError(null);
    setIsUpdatingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully!');
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to change password. Please verify your current password.';
      toast.error(message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const displayName = name.trim() || user?.name || 'Climber';
  const displayEmail = user?.email || 'user@codeclimb.dev';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mx-auto max-w-4xl space-y-6"
    >
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F0F6FC]">
          Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-[#8B949E]">
          Manage your personal details, preferred coding language, and account security.
        </p>
      </div>

      {/* Avatar & Overview Card */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#30363D] dark:bg-[#1C2128] sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#22C55E] to-[#38BDF8] text-2xl font-extrabold text-[#0D1117] shadow-lg shadow-[#22C55E]/20">
            {getInitials(displayName)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-[#F0F6FC]">
                {displayName}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#22C55E]/30 bg-[#22C55E]/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#22C55E]">
                <CheckCircle2 className="h-3 w-3" />
                {user?.role || 'member'}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-[#8B949E]">{displayEmail}</p>
            {college.trim() && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#8B949E]">
                <GraduationCap className="h-3.5 w-3.5 text-[#38BDF8]" />
                {college}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs dark:border-[#30363D] dark:bg-[#0D1117]">
          <span className="text-slate-500 dark:text-[#8B949E]">Default Language: </span>
          <span className="font-mono font-semibold text-[#22C55E]">
            {LANGUAGE_OPTIONS.find((l) => l.value === preferredLanguage)?.label || 'C++'}
          </span>
        </div>
      </div>

      {/* Edit Profile Form */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#30363D] dark:bg-[#1C2128]">
        <div className="mb-5 flex items-center gap-2.5 border-b border-slate-200 pb-4 dark:border-[#30363D]">
          <User className="h-5 w-5 text-[#22C55E]" />
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-[#F0F6FC]">
              Personal Information
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#8B949E]">
              Update how your profile appears across leaderboards and submissions.
            </p>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Name */}
            <div>
              <label
                htmlFor="profile-name"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-[#F0F6FC]"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-[#8B949E]" />
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (profileError) setProfileError(null);
                  }}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#22C55E] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#F0F6FC] dark:placeholder:text-[#8B949E]"
                />
              </div>
            </div>

            {/* Email (Read-only) */}
            <div>
              <label
                htmlFor="profile-email"
                className="mb-1.5 flex items-center justify-between text-sm font-medium text-slate-700 dark:text-[#F0F6FC]"
              >
                <span>Email Address</span>
                <span className="text-[11px] font-normal text-slate-400 dark:text-[#8B949E]">
                  Read-only
                </span>
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-[#8B949E]" />
                <input
                  id="profile-email"
                  type="email"
                  value={displayEmail}
                  readOnly
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 py-2.5 pl-10 pr-4 text-sm text-slate-500 dark:border-[#30363D] dark:bg-[#161B22] dark:text-[#8B949E]"
                />
              </div>
            </div>

            {/* College */}
            <div>
              <label
                htmlFor="profile-college"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-[#F0F6FC]"
              >
                College / Institution
              </label>
              <div className="relative">
                <GraduationCap className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-[#8B949E]" />
                <input
                  id="profile-college"
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="Enter your college or university"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#22C55E] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#F0F6FC] dark:placeholder:text-[#8B949E]"
                />
              </div>
            </div>

            {/* Preferred Language */}
            <div>
              <label
                htmlFor="profile-language"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-[#F0F6FC]"
              >
                Preferred Language
              </label>
              <div className="relative">
                <Code2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-[#8B949E]" />
                <select
                  id="profile-language"
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

          {profileError && (
            <p className="flex items-center gap-1.5 text-xs text-red-500">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {profileError}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="inline-flex items-center gap-2 rounded-xl bg-[#22C55E] px-5 py-2.5 text-sm font-semibold text-[#0D1117] shadow-sm transition-all hover:bg-[#16A34A] disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Change Password Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#30363D] dark:bg-[#1C2128]">
        <div className="mb-5 flex items-center gap-2.5 border-b border-slate-200 pb-4 dark:border-[#30363D]">
          <ShieldCheck className="h-5 w-5 text-[#38BDF8]" />
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-[#F0F6FC]">
              Change Password
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#8B949E]">
              Keep your account protected with a strong, unique password.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {/* Current Password */}
          <div>
            <label
              htmlFor="current-password"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-[#F0F6FC]"
            >
              Current Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-[#8B949E]" />
              <input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="Enter current password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#38BDF8] focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/20 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#F0F6FC] dark:placeholder:text-[#8B949E]"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 dark:text-[#8B949E] dark:hover:text-[#F0F6FC]"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* New Password */}
            <div>
              <label
                htmlFor="new-password"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-[#F0F6FC]"
              >
                New Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-[#8B949E]" />
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#38BDF8] focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/20 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#F0F6FC] dark:placeholder:text-[#8B949E]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 dark:text-[#8B949E] dark:hover:text-[#F0F6FC]"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label
                htmlFor="confirm-new-password"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-[#F0F6FC]"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-[#8B949E]" />
                <input
                  id="confirm-new-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="Re-enter new password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#38BDF8] focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/20 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-[#F0F6FC] dark:placeholder:text-[#8B949E]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 dark:text-[#8B949E] dark:hover:text-[#F0F6FC]"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {passwordError && (
            <p className="flex items-center gap-1.5 text-xs text-red-500">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {passwordError}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="inline-flex items-center gap-2 rounded-xl border border-[#38BDF8]/40 bg-[#38BDF8]/15 px-5 py-2.5 text-sm font-semibold text-[#38BDF8] transition-all hover:bg-[#38BDF8] hover:text-[#0D1117] disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </motion.div>
  );
}
