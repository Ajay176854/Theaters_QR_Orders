import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

/**
 * 🔔 Kitchen Order Alarm System (Web Audio API)
 *
 * Keeps ringing continuously while active kitchen prep orders exist,
 * and immediately silences the moment the staff clicks "MARK AS READY" (or "Quick Deliver")!
 */
const SoundAlert = forwardRef(function SoundAlert({ activeCount = 0 }, ref) {
  const [muted, setMuted] = useState(false);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const audioCtxRef = useRef(null);
  const loopIntervalRef = useRef(null);
  const mutedRef = useRef(muted);

  useEffect(() => {
    mutedRef.current = muted;
    if (muted && loopIntervalRef.current) {
      clearInterval(loopIntervalRef.current);
      loopIntervalRef.current = null;
      setIsAlarmActive(false);
    }
  }, [muted]);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Single new-order arrival chime
  const play = () => {
    if (mutedRef.current) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(830.61, now + 0.15);
      gain2.gain.setValueAtTime(0.35, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.warn('Audio playback not allowed or failed:', e);
    }
  };

  // Urgent kitchen attention siren
  const playAlarm = () => {
    if (mutedRef.current) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // High urgency alternating two-tone siren (880Hz <-> 587Hz)
      for (let i = 0; i < 2; i++) {
        const start = now + i * 0.35;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(i % 2 === 0 ? 880 : 659.25, start);
        gain.gain.setValueAtTime(0.35, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.3);
      }
    } catch (e) {
      console.warn('Alarm playback failed:', e);
    }
  };

  // Starts continuous alarm ringing every 2.4 seconds until stopped
  const startContinuousAlarm = () => {
    if (mutedRef.current) return;
    setIsAlarmActive(true);
    if (!loopIntervalRef.current) {
      playAlarm();
      loopIntervalRef.current = setInterval(() => {
        if (!mutedRef.current) {
          playAlarm();
        }
      }, 2400);
    }
  };

  // Stops the continuous alarm immediately (e.g. when staff clicks "MARK AS READY")
  const stopContinuousAlarm = () => {
    setIsAlarmActive(false);
    if (loopIntervalRef.current) {
      clearInterval(loopIntervalRef.current);
      loopIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (loopIntervalRef.current) {
        clearInterval(loopIntervalRef.current);
        loopIntervalRef.current = null;
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    play,
    playAlarm,
    startContinuousAlarm,
    stopContinuousAlarm,
  }));

  return (
    <button
      type="button"
      className="sound-toggle"
      onClick={() => {
        // Unlock Web Audio context on user click
        getAudioContext();
        setMuted((prev) => !prev);
      }}
      title={muted ? 'Unmute order notifications' : 'Mute order notifications'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        padding: '0.4rem 0.8rem',
        background: isAlarmActive && !muted ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-card)',
        border: isAlarmActive && !muted ? '1.5px solid #ef4444' : '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-xs)',
        color: muted ? 'var(--text-muted)' : isAlarmActive ? '#fca5a5' : 'var(--accent)',
        cursor: 'pointer',
        fontSize: '0.78rem',
        fontWeight: 800,
        boxShadow: isAlarmActive && !muted ? '0 0 14px rgba(239, 68, 68, 0.5)' : 'none',
        animation: isAlarmActive && !muted ? 'pulse 1.5s infinite' : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        {muted ? (
          <>
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </>
        ) : (
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        )}
      </svg>
      <span>
        {muted
          ? 'Alarm Muted'
          : isAlarmActive
          ? `🚨 Ringing (${activeCount} Active)`
          : 'Alarm Ready'}
      </span>
    </button>
  );
});

export default SoundAlert;
