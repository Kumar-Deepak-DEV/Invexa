import React, { useState, useEffect } from 'react';
import { useStockSense } from '../../context/StockSenseContext';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  Phone,
  IdCard,
  Layers,
  Shield
} from 'lucide-react';

export const AuthView: React.FC = () => {
  const { login, registerUser, showToast, setActiveView, activeView } = useStockSense();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'otp' | 'reset'>(() => {
    if (activeView === 'register' || activeView === 'signup') return 'register';
    return 'login';
  });

  useEffect(() => {
    if (activeView === 'register' || activeView === 'signup') {
      setMode('register');
    } else if (activeView === 'login' || activeView === 'auth') {
      setMode('login');
    }
  }, [activeView]);

  // Login State
  const [loginId, setLoginId] = useState('alex.rivera');
  const [loginPassword, setLoginPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register State
  const [regFullName, setRegFullName] = useState('');
  const [regLoginId, setRegLoginId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState('Inventory Manager');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Forgot / OTP / Reset State
  const [resetEmail, setResetEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(60);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Background Warehouse Images Rotator (5-Second Interval with Preloading & Seamless 60fps Cross-Fade)
  const warehouseImages = [
    '/warehouse1.jpg',
    '/warehouse2.jpg',
    '/warehouse3.jpg',
    '/warehouse4.jpg',
    '/warehouse5.jpg',
  ];
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [prevBgIndex, setPrevBgIndex] = useState(0);

  // Preload all background images into memory on mount to prevent any switching delay
  useEffect(() => {
    warehouseImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const bgTimer = setInterval(() => {
      setCurrentBgIndex((prevCurrent) => {
        setPrevBgIndex(prevCurrent);
        return (prevCurrent + 1) % warehouseImages.length;
      });
    }, 6000);
    return () => clearInterval(bgTimer);
  }, [warehouseImages.length]);

  const handleSelectSlide = (index: number) => {
    if (index === currentBgIndex) return;
    setPrevBgIndex(currentBgIndex);
    setCurrentBgIndex(index);
  };

  // Password Validation Rules for Registration
  const hasMinLen = regPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(regPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(regPassword);
  const isLoginIdValid = regLoginId ? (regLoginId.length >= 6 && regLoginId.length <= 12 && /^[a-zA-Z0-9._-]+$/.test(regLoginId)) : true;

  // Timer effect for OTP
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (mode === 'otp' && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [mode, otpTimer]);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !loginPassword.trim()) {
      showToast('Please enter both Login ID and Password', 'warning');
      return;
    }

    try {
      const result = await login(loginId.trim(), loginPassword);
      if (result?.success) {
        setActiveView('dashboard');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Login failed';
      showToast(errMsg, 'danger');
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim() || !regEmail.trim() || !regPassword.trim()) {
      showToast('Please fill all required fields', 'warning');
      return;
    }
    if (regLoginId && !isLoginIdValid) {
      showToast('Login ID must be 6-12 alphanumeric characters', 'danger');
      return;
    }
    if (!hasMinLen || !hasUpperCase || !hasSpecial) {
      showToast('Password does not meet security requirements', 'danger');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      showToast('Passwords do not match', 'danger');
      return;
    }
    if (!agreeTerms) {
      showToast('Please accept the Terms & Conditions to create an account', 'warning');
      return;
    }

    const assignedLoginId = regLoginId.trim() || regEmail.split('@')[0];

    try {
      const result = await registerUser({
        fullName: regFullName.trim(),
        loginId: assignedLoginId,
        email: regEmail.trim(),
        password: regPassword,
        phone: regPhone.trim(),
        role: regRole,
      });

      if (result?.success) {
        setLoginId(assignedLoginId);
        setActiveView('dashboard');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Registration failed';
      showToast(errMsg, 'danger');
    }
  };

  // Handle Forgot Password Request
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      showToast('Please enter your email or Login ID', 'warning');
      return;
    }
    setOtpTimer(60);
    setMode('otp');
    showToast('6-Digit OTP security code sent to ' + resetEmail, 'info');
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    const newArr = [...otpDigits];
    newArr[index] = val;
    setOtpDigits(newArr);

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length < 6) {
      showToast('Please enter the complete 6-digit verification code', 'warning');
      return;
    }
    showToast('OTP verified successfully! Set your new password.', 'success');
    setMode('reset');
  };

  // Handle Reset Password Submit
  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'warning');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('Passwords do not match', 'danger');
      return;
    }
    showToast('Password reset successfully! You can now log in.', 'success');
    setMode('login');
  };

  return (
    <div className="h-screen w-full bg-white flex flex-col lg:flex-row overflow-hidden">
      {/* LEFT SIDE: Dynamic Warehouse Image Slideshow with Dark Translucent Overlay */}
      <div className="w-full lg:w-1/2 h-full p-4 sm:p-6 lg:p-8 text-white flex flex-col justify-between relative overflow-hidden shrink-0 bg-slate-950">
        {/* Background Image Slideshow with Smooth Seamless Cross-Fade */}
        {warehouseImages.map((imgUrl, index) => {
          const isCurrent = index === currentBgIndex;
          const isPrev = index === prevBgIndex;

          let layerStyles = 'opacity-0 z-0 pointer-events-none';
          if (isCurrent) {
            layerStyles = 'opacity-100 z-20 transition-opacity duration-[2000ms] ease-in-out will-change-[opacity]';
          } else if (isPrev) {
            layerStyles = 'opacity-100 z-10';
          }

          return (
            <div
              key={imgUrl}
              className={`absolute inset-0 bg-cover bg-center ${layerStyles}`}
              style={{ backgroundImage: `url(${imgUrl})` }}
            />
          );
        })}

        {/* Refined Translucent Dark Overlay (Slightly More Transparent so Warehouse Background Pops) */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/65 via-slate-900/55 to-indigo-950/65 backdrop-blur-[1px] z-10 pointer-events-none" />

        {/* Decorative Ambient Lighting */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none z-10" />
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none z-10" />

        {/* Top Header Branding Badge */}
        <div className="relative z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-white p-1 flex items-center justify-center shadow-xl shrink-0">
              <img src="/invexa_logo.png" alt="INVEXA Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-xl lg:text-2xl font-black tracking-tight text-white">INVEXA</span>
              <span className="block text-[9px] lg:text-[10px] uppercase font-bold tracking-widest text-sky-200">Smart Inventory ERP</span>
            </div>
          </div>
        </div>

        {/* Main Content Hero */}
        <div className="relative z-20 my-auto py-3 lg:py-4 space-y-3 lg:space-y-4 max-w-lg">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-sky-100 backdrop-blur-md border border-white/15 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-300" />
              Enterprise Supply Chain Intelligence
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-white">
              Smart Inventory. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-indigo-100 to-white">
                Simple Control.
              </span>
            </h1>
            <p className="text-xs text-slate-200 leading-relaxed font-normal">
              Empower your enterprise supply chain with real-time stock matrix balancing, automated replenishment rules, and immutable audit logs.
            </p>
          </div>

          {/* Key Feature Points */}
          <div className="space-y-2 pt-0.5">
            <div className="flex items-center gap-2.5 text-xs text-white font-medium bg-white/10 hover:bg-white/15 p-2.5 rounded-xl border border-white/20 backdrop-blur-md transition-all">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Multi-Warehouse & Rack Location Hierarchy</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-white font-medium bg-white/10 hover:bg-white/15 p-2.5 rounded-xl border border-white/20 backdrop-blur-md transition-all">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Zero-Stock-Drift Internal Transfers</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-white font-medium bg-white/10 hover:bg-white/15 p-2.5 rounded-xl border border-white/20 backdrop-blur-md transition-all">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Automated Over-Delivery Prevention</span>
            </div>
          </div>

          {/* Live System Metric Card */}
          <div className="pt-0.5">
            <div className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 shadow-xl flex items-center justify-between transition-all">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-400/20 text-sky-200 border border-sky-300/30 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Live Inventory Balance Engine</div>
                  <div className="text-[10px] text-slate-200">Automated Audit & Replenishment</div>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  99.98% Accuracy
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info & Slideshow Indicators */}
        <div className="relative z-20 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-slate-300/80 font-medium">
          <div className="flex items-center gap-3">
            <span>INVEXA Core v2.4</span>
            {/* Image Slideshow Indicators */}
            <div className="flex items-center gap-1.5 ml-2">
              {warehouseImages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                    i === currentBgIndex ? 'w-5 bg-sky-400' : 'w-1.5 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Cryptographic Ledger Active
          </span>
        </div>
      </div>

      {/* RIGHT SIDE: Clean, modern form area on white background */}
      <div className="w-full lg:w-1/2 h-full flex flex-col justify-between p-4 sm:p-6 lg:p-8 xl:p-10 bg-white overflow-hidden">
        {/* Top Header Branding */}
        <div>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md border border-slate-200 shrink-0">
              <img src="/invexa_logo.png" alt="INVEXA Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900">INVEXA</span>
              <span className="block text-[9px] uppercase font-bold tracking-widest text-sky-600">Smart Inventory ERP</span>
            </div>
          </div>
        </div>

        {/* Center Form Section */}
        <div className="my-auto py-1 max-w-md w-full mx-auto">
          {/* REGISTER MODE */}
          {mode === 'register' && (
            <div className="space-y-2.5 animate-scale-up">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Create your account</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Join your organization's inventory control and supply chain network
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-2">
                {/* Full Name & Corporate Email */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sarah Connor"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Corporate Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="sarah@stocksense.io"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Phone & Login ID */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="+1 (555) 019-2834"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Login ID / Username
                    </label>
                    <div className="relative">
                      <IdCard className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. sarah.c"
                        value={regLoginId}
                        onChange={(e) => setRegLoginId(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Min 8 chars"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Repeat password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Security Requirements Checklist */}
                <div className="p-1.5 bg-slate-50/90 rounded-lg text-xs space-y-0.5 border border-slate-200/80">
                  <div className="font-semibold text-slate-700 text-[10px]">Password Security Requirements:</div>
                  <div className="grid grid-cols-2 gap-0.5 text-[10px] text-slate-500">
                    <span className={`flex items-center gap-1 ${hasMinLen ? 'text-emerald-600 font-bold' : ''}`}>
                      <CheckCircle2 className="w-3 h-3 shrink-0" /> Min 8 Characters
                    </span>
                    <span className={`flex items-center gap-1 ${hasUpperCase ? 'text-emerald-600 font-bold' : ''}`}>
                      <CheckCircle2 className="w-3 h-3 shrink-0" /> 1 Uppercase Letter
                    </span>
                    <span className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-600 font-bold' : ''}`}>
                      <CheckCircle2 className="w-3 h-3 shrink-0" /> 1 Special Character
                    </span>
                    <span className={`flex items-center gap-1 ${isLoginIdValid ? 'text-emerald-600 font-bold' : ''}`}>
                      <CheckCircle2 className="w-3 h-3 shrink-0" /> Valid Login Format
                    </span>
                  </div>
                </div>

                {/* Terms & Conditions Checkbox */}
                <label className="flex items-start gap-2 cursor-pointer pt-0">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-3.5 h-3.5 text-sky-600 rounded focus:ring-sky-500 mt-0.5"
                  />
                  <span className="text-[11px] text-slate-600 leading-tight">
                    I agree to the{' '}
                    <a href="#" onClick={(e) => e.preventDefault()} className="text-sky-600 hover:text-sky-700 hover:underline font-semibold">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" onClick={(e) => e.preventDefault()} className="text-sky-600 hover:text-sky-700 hover:underline font-semibold">
                      Privacy Policy
                    </a>
                  </span>
                </label>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 active:from-sky-700 active:to-blue-800 text-white rounded-lg text-xs font-bold shadow-md shadow-sky-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  Create Account
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Already have an account */}
              <div className="pt-1.5 text-center text-xs text-slate-500 border-t border-slate-100">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-sky-600 font-bold hover:text-sky-700 hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}

          {/* LOGIN MODE */}
          {mode === 'login' && (
            <div className="space-y-3 animate-scale-up">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Sign In to INVEXA</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Access your warehouse operations dashboard and live inventory balance
                </p>
              </div>

              {/* Demo Fill Pill */}
              <div className="py-2 px-3 bg-sky-50/70 border border-sky-200/70 rounded-lg text-xs flex items-center justify-between text-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>Demo Login: <strong>alex.rivera</strong> / <strong>Admin@123</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLoginId('alex.rivera');
                    setLoginPassword('Admin@123');
                  }}
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-800 underline shrink-0 cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Login ID or Corporate Email
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      placeholder="e.g. alex.rivera or alex@stocksense.io"
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-sky-600 hover:text-sky-700 font-semibold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 text-sky-600 rounded focus:ring-sky-500"
                    />
                    <span className="text-xs text-slate-600">Remember this workstation</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 active:from-sky-700 active:to-blue-800 text-white rounded-lg text-xs font-bold shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  Sign In to Portal
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
                Don't have an enterprise account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-sky-600 font-bold hover:text-sky-700 hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </div>
          )}

          {/* FORGOT PASSWORD MODE */}
          {mode === 'forgot' && (
            <div className="space-y-3.5 animate-scale-up">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Recover Password</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your registered corporate email or Login ID to receive a 6-digit verification PIN
                </p>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Email or Login ID
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="alex.rivera@stocksense.io"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 transition-all outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  Send 6-Digit OTP Code
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* OTP VERIFICATION MODE */}
          {mode === 'otp' && (
            <div className="space-y-3.5 animate-scale-up">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Enter 6-Digit OTP</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  We have sent a verification code to <strong>{resetEmail || 'your email'}</strong>
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-3.5">
                <div className="flex items-center justify-center gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      className="w-9 h-10 text-center text-base font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 outline-none"
                    />
                  ))}
                </div>

                <div className="text-center text-xs text-slate-500">
                  {otpTimer > 0 ? (
                    <span>Code expires in <strong className="text-sky-600">{otpTimer}s</strong></span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOtpTimer(60)}
                      className="text-sky-600 font-bold hover:underline cursor-pointer"
                    >
                      Resend Code
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  Verify Code
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                >
                  Change Email / ID
                </button>
              </div>
            </div>
          )}

          {/* RESET PASSWORD MODE */}
          {mode === 'reset' && (
            <div className="space-y-3.5 animate-scale-up">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Create New Password</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose a strong, unique password for your account
                </p>
              </div>

              <form onSubmit={handleResetSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full pl-3 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 transition-all outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  Update & Proceed to Sign In
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Footer Copyright */}
        <p className="text-[11px] text-slate-400 text-center lg:text-left pt-2">
          © {new Date().getFullYear()} INVEXA Core v2.4 • Enterprise Inventory ERP. All rights reserved.
        </p>
      </div>
    </div>
  );
};

