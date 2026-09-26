import React, { useState, useRef } from 'react';
import { useStockSense } from '../../context/StockSenseContext';
import {
  User,
  Shield,
  KeyRound,
  Building2,
  Mail,
  Phone,
  Calendar,
  Save,
  Bell,
  Sliders,
  Database,
  RefreshCw,
  CheckCircle2,
  Lock,
  Smartphone,
  HardDriveDownload,
  AlertCircle,
  Camera,
  Upload,
  Image as ImageIcon,
  Check,
  Globe,
  Clock,
  ShieldCheck,
  Key,
  Laptop,
  Trash2,
  SlidersHorizontal,
  Volume2,
  FileSpreadsheet,
  QrCode,
  Copy,
  ExternalLink
} from 'lucide-react';
import { CustomSelect } from '../common/CustomSelect';

const PRESET_AVATARS = [
  {
    name: 'Executive Lead',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
  },
  {
    name: 'Warehouse Manager',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
  },
  {
    name: 'Logistics Supervisor',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80'
  },
  {
    name: 'Operations Director',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'
  },
  {
    name: 'Supply Chain Analyst',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80'
  },
  {
    name: 'Inventory Controller',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80'
  }
];

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    updateUserProfile,
    changePassword,
    warehouses,
    products,
    receipts,
    deliveries,
    showToast,
    resetAllData
  } = useStockSense();

  const [activeTab, setActiveTab] = useState<'profile' | 'avatar' | 'security' | 'preferences' | 'data'>('profile');

  // Form State
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '+91 98765 43210');
  const [department, setDepartment] = useState(currentUser.department || 'Warehouse Operations & Logistics');
  const [role, setRole] = useState(currentUser.role || 'Inventory Manager');
  const initialWH = warehouses.find(w => w.name === currentUser.warehouse || currentUser.warehouse?.includes(w.name) || currentUser.warehouse?.includes(w.code))?.name || warehouses[0]?.name || '';
  const [primaryWarehouse, setPrimaryWarehouse] = useState(initialWH);
  const [bio, setBio] = useState('Senior supply chain specialist managing multi-warehouse replenishment, inventory balancing, and dispatch dock fulfillment.');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST +5:30)');

  // Avatar Studio State
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar || '');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Security & 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [generatedApiKey, setGeneratedApiKey] = useState('inv_live_9f83a271bc94827d0023e');

  // Preferences State
  const [autoEmailAlerts, setAutoEmailAlerts] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [barcodeScannerMode, setBarcodeScannerMode] = useState(true);
  const [autoPrintSlips, setAutoPrintSlips] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  // Handle Profile Save
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      fullName,
      email,
      phone,
      department,
      role,
      warehouse: primaryWarehouse,
      avatar: avatarUrl
    });
  };

  // Handle Avatar Image File Upload
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB limit. Please choose a smaller photo.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatarUrl(dataUrl);
      updateUserProfile({ avatar: dataUrl });
      showToast('Profile image updated from file upload!', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Handle Preset Avatar Selection
  const handleSelectPreset = (url: string) => {
    setAvatarUrl(url);
    updateUserProfile({ avatar: url });
    showToast('Preset profile picture applied!', 'success');
  };

  // Handle Custom URL Apply
  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    setAvatarUrl(customUrlInput.trim());
    updateUserProfile({ avatar: customUrlInput.trim() });
    setCustomUrlInput('');
    showToast('Custom image URL applied as profile avatar!', 'success');
  };

  // Handle Remove Avatar
  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    updateUserProfile({ avatar: '' });
    showToast('Profile image removed. Default initials avatar restored.', 'info');
  };

  // Handle Password Change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'danger');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters long', 'warning');
      return;
    }
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      // Toast already handled by context
    }
  };

  // Handle Export Backup
  const handleExportSystemBackup = () => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        user: currentUser,
        counts: {
          products: products.length,
          warehouses: warehouses.length,
          receipts: receipts.length,
          deliveries: deliveries.length,
        },
        products,
        warehouses,
        receipts,
        deliveries,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `invexa-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Complete JSON system backup generated & downloaded!', 'success');
    } catch {
      showToast('Failed to generate system backup', 'danger');
    }
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(generatedApiKey);
    showToast('API Key copied to clipboard!', 'info');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileUpload}
        accept="image/png, image/jpeg, image/webp, image/gif"
        className="hidden"
      />

      {/* Header Profile Hero Card */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 md:p-8 text-white overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar with Interactive Edit Badge */}
          <div className="relative group">
            <div className="w-28 h-28 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/20 overflow-hidden flex items-center justify-center text-3xl font-extrabold text-white shadow-xl">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-display tracking-wider">
                  {currentUser.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </span>
              )}
            </div>

            {/* Hover Camera Overlay Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload New Photo"
              className="absolute inset-0 rounded-2xl bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 backdrop-blur-xs cursor-pointer"
            >
              <Camera className="w-6 h-6" />
              <span className="text-[10px] font-bold">Update Photo</span>
            </button>

            {/* Online Status Dot */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 text-center md:text-left space-y-1.5">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h1 className="text-2xl font-bold font-display tracking-tight">{currentUser.fullName}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {currentUser.role}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Verified
              </span>
            </div>

            <p className="text-xs text-slate-300 font-mono flex items-center justify-center md:justify-start gap-2">
              <span>ID: {currentUser.loginId}</span>
              <span>•</span>
              <span className="text-blue-200">{currentUser.warehouse}</span>
            </p>

            <p className="text-xs text-slate-400">
              Department: <strong className="text-slate-200">{currentUser.department || 'Operations'}</strong> • Member since {currentUser.joinedDate || 'March 2024'}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Change Image</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('avatar')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/60 hover:bg-blue-600 text-white border border-blue-400/30 transition-all flex items-center gap-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Avatar Studio</span>
              </button>
            </div>
          </div>

          {/* Quick Header Action Buttons */}
          <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
            <button
              onClick={handleExportSystemBackup}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition-all shadow-2xs"
            >
              <HardDriveDownload className="w-3.5 h-3.5 text-blue-300" />
              <span>Backup JSON</span>
            </button>
            <button
              onClick={() => {
                if (confirm('Reset entire inventory database to default seed state?')) {
                  resetAllData();
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/30 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-400/30 transition-all shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'profile'
              ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>General Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('avatar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'avatar'
              ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Photo & Avatar</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'security'
              ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security & API</span>
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'preferences'
              ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Preferences</span>
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'data'
              ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Data & Storage</span>
        </button>
      </div>

      {/* TAB 1: GENERAL PROFILE EDIT */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Personal & Corporate Details</h2>
              <p className="text-xs text-slate-500">Update your identity, department, and assigned facility credentials</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Session
            </span>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                    className="form-control text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Corporate Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                    className="form-control text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                    className="form-control text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Corporate Role / Title</label>
                <CustomSelect
                  value={role}
                  onChange={(val) => setRole(val)}
                  options={[
                    'Inventory Manager',
                    'Warehouse Operator',
                    'Logistics Supervisor',
                    'Supply Chain Specialist',
                    'Fulfillment Lead',
                    'System Administrator'
                  ]}
                  size="md"
                />
              </div>

              <div>
                <label className="form-label">Assigned Primary Facility *</label>
                <CustomSelect
                  value={primaryWarehouse}
                  onChange={(val) => setPrimaryWarehouse(val)}
                  icon={Building2}
                  options={warehouses.map((wh) => ({
                    value: wh.name,
                    label: wh.name,
                    subLabel: `${wh.city} • ${wh.type}`,
                    badge: wh.code,
                    badgeColor: 'bg-blue-50 text-blue-700'
                  }))}
                  size="md"
                />
              </div>

              <div>
                <label className="form-label">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="form-control text-xs"
                />
              </div>

              <div>
                <label className="form-label">Time Zone</label>
                <CustomSelect
                  value={timezone}
                  onChange={(val) => setTimezone(val)}
                  options={[
                    'Asia/Kolkata (IST +5:30)',
                    'UTC (GMT +0:00)',
                    'America/New_York (EST -5:00)',
                    'America/Los_Angeles (PST -8:00)',
                    'Europe/London (BST +1:00)',
                    'Asia/Dubai (GST +4:00)',
                    'Asia/Singapore (SGT +8:00)'
                  ]}
                  size="md"
                />
              </div>

              <div>
                <label className="form-label">Employee System Login ID</label>
                <input
                  type="text"
                  readOnly
                  value={currentUser.loginId}
                  className="form-control text-xs bg-slate-100 font-mono text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="md:col-span-2">
                <label className="form-label">Professional Summary & Operational Notes</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="form-control text-xs"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button type="submit" className="btn btn-primary text-xs">
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: PHOTO & AVATAR STUDIO */}
      {activeTab === 'avatar' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-150">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Photo & Profile Picture Studio</h2>
            <p className="text-xs text-slate-500">Upload your own photo, choose from executive presets, or provide an image link</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Live Preview Box */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl bg-white border-2 border-slate-200 shadow-md overflow-hidden flex items-center justify-center text-4xl font-extrabold text-slate-700">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display">
                      {currentUser.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </span>
                  )}
                </div>

                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white shadow-xs">
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900">{fullName}</h4>
                <p className="text-xs text-slate-500">{role}</p>
                <p className="text-[11px] text-blue-600 font-semibold">{primaryWarehouse}</p>
              </div>

              <div className="w-full flex flex-col gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full btn btn-primary text-xs flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Local File</span>
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="w-full btn btn-secondary text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Presets & URL Options */}
            <div className="md:col-span-2 space-y-5">
              {/* Option A: Quick Upload */}
              <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/60 transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Upload Image File</h4>
                    <p className="text-[11px] text-slate-500">Supports PNG, JPG, WebP (Max 5MB)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary text-xs"
                >
                  Browse Computer
                </button>
              </div>

              {/* Option B: Executive Presets */}
              <div>
                <label className="form-label mb-2 block">Choose from Professional Avatar Presets</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {PRESET_AVATARS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(preset.url)}
                      className={`group relative rounded-xl overflow-hidden aspect-square border-2 transition-all p-0.5 ${
                        avatarUrl === preset.url
                          ? 'border-blue-600 ring-2 ring-blue-500/20 scale-105 shadow-md'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover rounded-lg group-hover:scale-110 transition-transform"
                      />
                      {avatarUrl === preset.url && (
                        <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center text-white">
                          <Check className="w-5 h-5 drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option C: Image URL */}
              <form onSubmit={handleApplyCustomUrl} className="space-y-2">
                <label className="form-label">Or Provide Web Image URL</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://example.com/my-profile-pic.jpg"
                    className="form-control text-xs flex-1 font-mono"
                  />
                  <button type="submit" className="btn btn-secondary text-xs shrink-0">
                    Apply URL
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY & ACCESS */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Change Password Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Change Password</h2>
                <p className="text-xs text-slate-500">Update your secure login credentials</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Encrypted SHA-256
              </span>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
              <div>
                <label className="form-label">Current Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ paddingLeft: '2.5rem' }}
                    className="form-control text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">New Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 chars"
                      style={{ paddingLeft: '2.5rem' }}
                      className="form-control text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Confirm New Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      style={{ paddingLeft: '2.5rem' }}
                      className="form-control text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold block text-slate-800">Password Policy Requirements:</span>
                <p>• Minimum 8 characters in length</p>
                <p>• Include at least one uppercase letter and number</p>
              </div>

              <button type="submit" className="btn btn-primary text-xs">
                <Lock className="w-4 h-4" />
                <span>Update Password Credentials</span>
              </button>
            </form>
          </div>

          {/* Two-Factor Authentication & API Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Two-Factor Authentication & API Access</h2>
              <p className="text-xs text-slate-500">Strengthen account protection and configure external ERP integrations</p>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Authenticator App (2FA)</h4>
                    <p className="text-[11px] text-slate-500">Require an OTP code from Google Authenticator or Authy upon sign-in</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTwoFactorEnabled(!twoFactorEnabled);
                    showToast(twoFactorEnabled ? '2FA disabled' : '2FA enabled successfully!', 'info');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    twoFactorEnabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Personal API Access Token</h4>
                    <p className="text-[11px] text-slate-500 font-mono text-slate-400">{generatedApiKey}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyApiKey}
                    className="btn btn-secondary text-xs flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Key</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratedApiKey(`inv_live_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`);
                      showToast('New API access token generated!', 'success');
                    }}
                    className="btn btn-secondary text-xs"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-150">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">System & Workflow Preferences</h2>
            <p className="text-xs text-slate-500">Configure scanner feedback, alerts, and operational behaviors</p>
          </div>

          <div className="space-y-4 divide-y divide-slate-100">
            <div className="flex items-center justify-between pt-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Automated Email Alerts for Low Stock</h4>
                <p className="text-[11px] text-slate-500">Receive instant alerts when a product breaches its safety stock reorder level</p>
              </div>
              <input
                type="checkbox"
                checked={autoEmailAlerts}
                onChange={(e) => {
                  setAutoEmailAlerts(e.target.checked);
                  showToast('Email alert preferences saved', 'info');
                }}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Audio Feedback on Barcode Scan</h4>
                <p className="text-[11px] text-slate-500">Play confirmation tone when an item SKU or pallet barcode is scanned</p>
              </div>
              <input
                type="checkbox"
                checked={soundEffects}
                onChange={(e) => {
                  setSoundEffects(e.target.checked);
                  showToast('Audio feedback setting updated', 'info');
                }}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Auto-Generate Packing Slips on Dispatch</h4>
                <p className="text-[11px] text-slate-500">Automatically open print dialog when an outbound delivery is validated as Done</p>
              </div>
              <input
                type="checkbox"
                checked={autoPrintSlips}
                onChange={(e) => {
                  setAutoPrintSlips(e.target.checked);
                  showToast('Packing slip workflow setting saved', 'info');
                }}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900">High-Density Matrix Layout</h4>
                <p className="text-[11px] text-slate-500">Display more items per page on inventory tables with tighter padding</p>
              </div>
              <input
                type="checkbox"
                checked={compactMode}
                onChange={(e) => {
                  setCompactMode(e.target.checked);
                  showToast('Density layout applied', 'info');
                }}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DATA & STORAGE */}
      {activeTab === 'data' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-150">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Database & System Backups</h2>
            <p className="text-xs text-slate-500">Export operational data, verify database status, and manage workspace persistence</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs mb-1">
                  <HardDriveDownload className="w-4 h-4" />
                  <span>Full Inventory JSON Snapshot</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Generates an encrypted JSON backup file containing all products, warehouse bin hierarchies, move history, receipts, and deliveries.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportSystemBackup}
                className="btn btn-primary text-xs"
              >
                Download System Backup (.json)
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 text-rose-700 font-bold text-xs mb-1">
                  <RefreshCw className="w-4 h-4" />
                  <span>Factory Database Reset</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Clears local storage adjustments and restores default enterprise multi-facility seed datasets.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset entire inventory database to fresh factory seed state?')) {
                    resetAllData();
                  }
                }}
                className="btn btn-secondary text-xs text-rose-600 border-rose-200 hover:bg-rose-100"
              >
                Reset Database to Factory Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
