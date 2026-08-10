import React, { useState } from 'react';
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { changePasswordApi } from '../services/profileApi';

export default function ResetPasswordSection({ accessToken, toast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [retypeNewPassword, setRetypeNewPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleResetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setRetypeNewPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setError(null);
    setSuccess(null);
    setIsOpen(false);
  };

  const handleToggleOpen = () => {
    if (isOpen) {
      handleResetForm();
    } else {
      setError(null);
      setSuccess(null);
      setIsOpen(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword.trim() || !newPassword.trim() || !retypeNewPassword.trim()) {
      setError('Please fill in all required password fields.');
      return;
    }

    if (newPassword !== retypeNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from your current password.');
      return;
    }

    // Password Policy: Min 8 chars, 1 uppercase, 1 lowercase, 1 number
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }

    setSaving(true);

    try {
      const res = await changePasswordApi({ currentPassword, newPassword }, accessToken);

      if (res.success) {
        setSuccess('Password updated successfully.');
        if (toast) toast('Password updated successfully.');
        setTimeout(() => {
          handleResetForm();
        }, 1200);
      } else {
        setError(res.message || 'Unable to update password. Please check your current password and try again.');
      }
    } catch (err) {
      console.error('[ResetPassword Error]', err);
      setError(err.message || 'An error occurred while updating your password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={18} style={{ color: '#4F46E5' }} />
            Password & Security
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
            Keep your account secure by updating your password regularly.
          </p>
        </div>

        {!isOpen && (
          <button
            type="button"
            onClick={handleToggleOpen}
            style={{
              background: '#FFFFFF',
              color: '#4F46E5',
              border: '1px solid #C7D2FE',
              padding: '10px 20px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#EEF2FF';
              e.currentTarget.style.borderColor = '#A5B4FC';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.borderColor = '#C7D2FE';
            }}
          >
            Reset Password
          </button>
        )}
      </div>

      {/* Inline Password Form Panel */}
      {isOpen && (
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: 10, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534', padding: '10px 14px', borderRadius: 10, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{success}</span>
            </div>
          )}

          {/* Current Password Field */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
              Current Password
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                style={{
                  width: '100%',
                  padding: '11px 44px 11px 14px',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#FFFFFF'
                }}
                required
              />
              <button
                type="button"
                aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748B',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* New Password & Retype New Password Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {/* New Password Field */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                New Password
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  style={{
                    width: '100%',
                    padding: '11px 44px 11px 14px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#FFFFFF'
                  }}
                  required
                />
                <button
                  type="button"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748B',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Retype New Password Field (NO Visibility Toggle) */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Retype New Password
              </label>
              <input
                type="password"
                value={retypeNewPassword}
                onChange={(e) => setRetypeNewPassword(e.target.value)}
                placeholder="Confirm new password"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#FFFFFF'
                }}
                required
              />
            </div>
          </div>

          {/* Form Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 4 }}>
            <button
              type="button"
              onClick={handleResetForm}
              disabled={saving}
              style={{
                background: '#FFFFFF',
                color: '#64748B',
                border: '1px solid #CBD5E1',
                padding: '10px 18px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              style={{
                background: '#4F46E5',
                color: '#FFFFFF',
                border: 'none',
                padding: '10px 22px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                opacity: saving ? 0.7 : 1,
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.2)'
              }}
            >
              {saving ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
