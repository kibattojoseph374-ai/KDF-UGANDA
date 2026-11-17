import React, { useEffect, useRef, useState } from 'react';
import {
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  ArrowRight,
  Globe,
  MapPin,
  Camera,
  ImagePlus,
  KeyRound,
  X,
} from 'lucide-react';
import { KDF_ORG } from '../data/kdfData';
import { safeReadJson } from '../utils/http';

export interface RegisteredUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  district: string;
  role: string;
  photoCount?: number;
  hasPasskey?: boolean;
  niraDetails?: {
    nin?: string;
    cardNumber?: string;
    birthDistrict?: string;
    issueStatus?: string;
    verifiedSource?: string;
  };
  socialLinks: Record<string, string>;
  createdAt: string;
}

interface RegistrationGateProps {
  onRegistered: (user: RegisteredUser, token: string) => void;
}

export const RegistrationGate: React.FC<RegistrationGateProps> = ({ onRegistered }) => {
  const [authMode, setAuthMode] = useState<'register' | 'signin' | 'reset'>('register');

  // Shared / Register state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Uganda');
  const [district, setDistrict] = useState('Mityana District');
  const [role, setRole] = useState('Applicant / Beneficiary');
  const [password, setPassword] = useState('');
  const [passkey, setPasskey] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  // Sign-In state
  const [loginId, setLoginId] = useState('');
  const [loginSecret, setLoginSecret] = useState('');

  // Reset Password state
  const [resetId, setResetId] = useState('');
  const [resetName, setResetName] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetNewPasskey, setResetNewPasskey] = useState('');

  // Camera state for 3-photo capture
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const openCamera = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera is not supported in this browser. You can upload 3 photos from phone storage instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 60);
    } catch {
      setError('Camera access was blocked or unavailable. You can upload 3 photos from phone storage instead.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
      setPhotos((prev) => [...prev.slice(0, 5), dataUrl]);
    }
  };

  const compressImageFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
      reader.onload = () => {
        const rawUrl = String(reader.result || '');
        if (!rawUrl) {
          reject(new Error(`Empty file: ${file.name}`));
          return;
        }
        const img = new Image();
        img.onload = () => {
          const maxDim = 900;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width >= height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.78));
        };
        img.onerror = () => resolve(rawUrl);
        img.src = rawUrl;
      };
      reader.readAsDataURL(file);
    });

  const handlePhotoFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    setError(null);
    for (const file of files.slice(0, 6)) {
      try {
        const compressed = await compressImageFile(file);
        setPhotos((prev) => (prev.length < 6 ? [...prev, compressed] : prev));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to read selected photo.');
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    if (!fullName.trim() || (!email.trim() && !phone.trim())) {
      setError('Full name and at least an email address or phone number are required.');
      return;
    }
    if (passkey.trim().length < 4) {
      setError('Please create a Passkey (minimum 4 characters/digits) to protect your data.');
      return;
    }
    if (photos.length < 3) {
      setError(`Please upload or capture at least 3 verification photos (${photos.length}/3 added).`);
      return;
    }

    setLoading(true);
    try {
      stopCamera();
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          country: country.trim(),
          district: district.trim(),
          role,
          password: password.trim(),
          passkey: passkey.trim(),
          photos,
        }),
      });
      const data = await safeReadJson<{ user: RegisteredUser; token: string }>(res);
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      onRegistered(data.user, data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginId.trim(), secret: loginSecret.trim() }),
      });
      const data = await safeReadJson<{ user: RegisteredUser; token: string }>(res);
      if (!res.ok) throw new Error(data.error || 'Sign in failed');
      onRegistered(data.user, data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: resetId.trim(),
          fullName: resetName.trim(),
          newPassword: resetNewPass.trim(),
          newPasskey: resetNewPasskey.trim(),
        }),
      });
      const data = await safeReadJson<{ message?: string }>(res);
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setSuccessMsg(data.message || 'Password and passkey reset successfully.');
      setAuthMode('signin');
      setLoginId(resetId.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1917] flex flex-col lg:flex-row">
      {/* Left Institutional Showcase Column */}
      <div className="relative lg:w-6/12 min-h-[320px] lg:min-h-screen flex flex-col justify-between overflow-hidden bg-[#14532D] text-[#FBF9F5]">
        <img
          src="/assets/aistudio/images_b5dd9d59.jpg"
          alt="Kibatto Development Foundation Limited ascending light sky banner"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D2E1A]/95 via-[#0D2E1A]/65 to-[#0D2E1A]/45" />

        <div className="relative z-10 p-8 lg:p-14">
          <p className="text-xs font-medium tracking-widest uppercase text-[#E6D4A8]">
            {KDF_ORG.jurisdiction}
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white max-w-xl">
            {KDF_ORG.name}
          </h1>
          <p className="mt-1 text-sm text-[#D6E6DC] font-medium">{KDF_ORG.shortName}</p>
        </div>

        <div className="relative z-10 p-8 lg:p-14 space-y-6 max-w-2xl">
          <p className="text-base sm:text-lg leading-relaxed text-[#F5F2EB]">
            Empowering orphans, persons with disabilities, the elderly, OVC, widows, the girl child,
            women, and street children. Protected with user-created Passkeys, salted scrypt hashing,
            AES-256-GCM encryption, and 3-photo verification.
          </p>

          <div className="pt-4 border-t border-white/20 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[#E5ECE7]">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#E6D4A8] shrink-0 mt-0.5" />
              <span>{KDF_ORG.poBox}</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-[#E6D4A8] shrink-0 mt-0.5" />
              <span className="font-mono tabular-nums">Office: {KDF_ORG.officeLine}</span>
            </div>
            <div className="flex items-start gap-2.5 sm:col-span-2">
              <Globe className="w-4 h-4 text-[#E6D4A8] shrink-0 mt-0.5" />
              <span>Official Desk: {KDF_ORG.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Passkey + 3-Photo Verification + Sign-In / Reset Gate */}
      <div className="lg:w-6/12 flex items-center justify-center p-6 sm:p-10 bg-[#FBF9F5]">
        <div className="w-full max-w-lg bg-white border border-[#E5DFD3] rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-medium text-[#14532D] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Passkey & Encrypted Portal Access</span>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="mt-4 grid grid-cols-3 gap-1 p-1 bg-[#F3EFE7] rounded-lg">
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                authMode === 'register' ? 'bg-white text-[#14532D] shadow-sm' : 'text-[#57534E]'
              }`}
            >
              Register Account
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setError(null);
                stopCamera();
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                authMode === 'signin' ? 'bg-white text-[#14532D] shadow-sm' : 'text-[#57534E]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('reset');
                setError(null);
                stopCamera();
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                authMode === 'reset' ? 'bg-white text-[#14532D] shadow-sm' : 'text-[#57534E]'
              }`}
            >
              Reset Password
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mt-4 p-3 rounded-lg bg-[#14532D]/10 border border-[#14532D]/25 text-sm text-[#14532D] font-medium">
              {successMsg}
            </div>
          )}

          {/* Register Form */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="mt-5 space-y-3.5">
              <div>
                <label htmlFor="reg-name" className="block text-xs font-semibold mb-1">
                  Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Nakato Grace"
                  className="w-full px-3.5 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-email" className="block text-xs font-semibold mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#78716C] absolute left-3 top-2.5" />
                    <input
                      id="reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="reg-phone" className="block text-xs font-semibold mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#78716C] absolute left-3 top-2.5" />
                    <input
                      id="reg-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+256 770 000000"
                      className="w-full pl-9 pr-3 py-2 text-sm font-mono bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Account Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password"
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Personal Security Passkey (PIN/Key)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#78716C] absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={passkey}
                      onChange={(e) => setPasskey(e.target.value)}
                      placeholder="4+ chars to lock vault"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">District / City</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-2.5 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  >
                    <option>Applicant / Beneficiary</option>
                    <option>Community Member</option>
                    <option>Donor / Sponsor</option>
                    <option>Staff / Specialist</option>
                    <option>UN / NGO Partner</option>
                  </select>
                </div>
              </div>

              {/* Mandatory 3-Photo Upload / Camera Capture */}
              <div className="p-3.5 rounded-lg bg-[#FBF9F5] border border-[#D6CEBE] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#1C1917]">
                    Upload or Capture at Least 3 Photos ({photos.length}/3 required)
                  </span>
                  <div className="flex gap-2">
                    <label className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-white border border-[#D6CEBE] text-xs font-semibold cursor-pointer hover:bg-[#F3EFE7]">
                      <ImagePlus className="w-3.5 h-3.5" />
                      <span>Choose Photos</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoFiles}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={cameraOpen ? stopCamera : openCamera}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#14532D] text-white text-xs font-semibold"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{cameraOpen ? 'Close Camera' : 'Camera'}</span>
                    </button>
                  </div>
                </div>

                {cameraOpen && (
                  <div className="space-y-2">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full max-h-44 rounded-lg bg-black object-cover"
                    />
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="w-full py-1.5 rounded bg-[#1E3A8A] text-white text-xs font-semibold"
                    >
                      Capture Verification Photo
                    </button>
                  </div>
                )}

                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {photos.map((src, idx) => (
                      <div key={idx} className="relative rounded-md overflow-hidden border border-[#D6CEBE] aspect-square">
                        <img src={src} alt={`Verification ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-0.5 rounded bg-black/70 text-white"
                          aria-label="Remove photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                <Lock className="w-4 h-4" />
                <span>{loading ? 'Encrypting Account...' : 'Create Protected Account & Enter'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Sign In Form */}
          {authMode === 'signin' && (
            <form onSubmit={handleSignIn} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Registered Email Address or Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="you@example.com or +256..."
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Password or Passkey</label>
                <input
                  type="password"
                  required
                  value={loginSecret}
                  onChange={(e) => setLoginSecret(e.target.value)}
                  placeholder="Enter password or personal passkey"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#14532D] hover:bg-[#114224] text-white text-sm font-semibold"
              >
                <Lock className="w-4 h-4" />
                <span>{loading ? 'Verifying...' : 'Sign In to KDF Portal'}</span>
              </button>
            </form>
          )}

          {/* Reset Forgotten Password Form */}
          {authMode === 'reset' && (
            <form onSubmit={handleResetPassword} className="mt-5 space-y-4">
              <p className="text-xs text-[#57534E]">
                Verify your registered email or phone number and full name to reset your forgotten
                password and passkey.
              </p>
              <div>
                <label className="block text-xs font-semibold mb-1">Registered Email or Phone</label>
                <input
                  type="text"
                  required
                  value={resetId}
                  onChange={(e) => setResetId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Registered Full Name</label>
                <input
                  type="text"
                  required
                  value={resetName}
                  onChange={(e) => setResetName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={resetNewPass}
                    onChange={(e) => setResetNewPass(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">New Passkey</label>
                  <input
                    type="password"
                    required
                    value={resetNewPasskey}
                    onChange={(e) => setResetNewPasskey(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#1E3A8A] hover:bg-[#172C6B] text-white text-sm font-semibold"
              >
                {loading ? 'Resetting...' : 'Reset Password & Passkey'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
