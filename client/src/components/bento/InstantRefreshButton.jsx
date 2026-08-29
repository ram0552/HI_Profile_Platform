import React, { useState } from 'react';
import { RotateCw, Check, AlertCircle } from 'lucide-react';

/**
 * Instant Refresh Button Component
 * Positioned on the UPPER-LEFT SIDE of the Bento content area.
 * 
 * Features:
 * - Server-enforced daily limit tracking (Max 10/day)
 * - Animated loading state
 * - Success / Error / Limit feedback
 * - Fully accessible and responsive
 */
export default function InstantRefreshButton({
    onRefresh,
    loading = false,
    remainingRefreshes = 10,
    lastSyncedAt = null,
    designStyle = 'classic'
}) {
    const [successState, setSuccessState] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const isLimitReached = remainingRefreshes <= 0;
    const isDisabled = loading || isLimitReached;

    const handleButtonClick = async (e) => {
        e.preventDefault();
        if (isDisabled) return;

        setErrorMsg(null);
        setSuccessState(false);

        try {
            const res = await onRefresh();
            if (res && res.success) {
                setSuccessState(true);
                setTimeout(() => setSuccessState(false), 3500);
            } else if (res && res.message) {
                setErrorMsg(res.message);
                setTimeout(() => setErrorMsg(null), 4000);
            }
        } catch (err) {
            setErrorMsg(err.message || 'Refresh failed');
            setTimeout(() => setErrorMsg(null), 4000);
        }
    };

    const getBadgeText = () => {
        if (loading) return 'Syncing profile data...';
        if (successState) return 'Updated just now';
        if (errorMsg) return errorMsg;
        if (isLimitReached) return 'Daily limit reached (10/10 used today)';
        if (remainingRefreshes === 1) return '1 refresh left today';
        return `${remainingRefreshes} refreshes left today`;
    };

    const formattedLastSync = lastSyncedAt
        ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : null;

    return (
        <div
            className="bento-instant-refresh-wrapper"
            style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 4,
                marginBottom: 16,
                zIndex: 10
            }}
        >
            <button
                type="button"
                onClick={handleButtonClick}
                disabled={isDisabled}
                aria-label="Refresh Bento profile data"
                aria-busy={loading}
                title={isLimitReached ? "Daily refresh limit reached (10 refreshes max per day)" : "Fetch latest social profile data from Apify"}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    borderRadius: designStyle === 'brutalist' ? 10 : 14,
                    border: designStyle === 'brutalist'
                        ? '2px solid var(--bento-text-primary, #0F172A)'
                        : '1px solid var(--bento-border-color, #E2E8F0)',
                    background: successState
                        ? '#ECFDF5'
                        : (isLimitReached
                            ? 'var(--bento-canvas-bg, #F1F5F9)'
                            : 'var(--bento-surface-bg, #FFFFFF)'),
                    color: successState
                        ? '#059669'
                        : (isLimitReached
                            ? 'var(--bento-text-muted, #94A3B8)'
                            : 'var(--bento-text-primary, #1E293B)'),
                    boxShadow: designStyle === 'brutalist'
                        ? '3px 3px 0px #0F172A'
                        : (isLimitReached ? 'none' : '0 2px 8px rgba(15, 23, 42, 0.06)'),
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    opacity: isDisabled && !loading ? 0.75 : 1,
                    outline: 'none',
                    userSelect: 'none'
                }}
            >
                {/* Refresh Icon */}
                {successState ? (
                    <Check size={16} style={{ color: '#059669', flexShrink: 0 }} />
                ) : errorMsg ? (
                    <AlertCircle size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
                ) : (
                    <RotateCw
                        size={16}
                        className={loading ? 'bento-spin-icon' : ''}
                        style={{
                            color: loading
                                ? 'var(--bento-accent, #6366F1)'
                                : (isLimitReached ? '#94A3B8' : 'var(--bento-accent, #4F46E5)'),
                            animation: loading ? 'bentoSpin 1s linear infinite' : 'none',
                            flexShrink: 0
                        }}
                    />
                )}

                {/* Button Label */}
                <span>
                    {loading
                        ? 'Refreshing...'
                        : (successState ? 'Updated!' : '↻ Instant Refresh')}
                </span>

                {/* Remaining Counter Pill */}
                {!loading && !successState && (
                    <span
                        style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: 10,
                            background: isLimitReached ? '#E2E8F0' : 'var(--bento-accent-light, #EEF2FF)',
                            color: isLimitReached ? '#64748B' : 'var(--bento-accent, #4F46E5)',
                            marginLeft: 2
                        }}
                    >
                        {remainingRefreshes}/10
                    </span>
                )}
            </button>

            {/* Subtext readout badge */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    paddingLeft: 4,
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    color: successState
                        ? '#059669'
                        : (errorMsg
                            ? '#DC2626'
                            : (isLimitReached ? '#64748B' : 'var(--bento-text-secondary, #64748B)'))
                }}
            >
                <span>{getBadgeText()}</span>
                {formattedLastSync && !loading && !errorMsg && (
                    <>
                        <span style={{ opacity: 0.4 }}>•</span>
                        <span style={{ opacity: 0.85 }}>Synced {formattedLastSync}</span>
                    </>
                )}
            </div>

            {/* CSS Animation for spinning icon */}
            <style>{`
                @keyframes bentoSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .bento-spin-icon {
                    animation: bentoSpin 1s linear infinite;
                }
            `}</style>
        </div>
    );
}
