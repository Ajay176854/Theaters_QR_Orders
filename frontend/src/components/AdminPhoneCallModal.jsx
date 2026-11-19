import { useState, useEffect, useRef } from 'react';

/**
 * 📱 Grandé Muthuram Multiplex — Automated Admin Phone Call & IVR Terminal
 *
 * Implements:
 * 1. Realistic Phone Call Screen for Admin (+91 7092466027)
 * 2. Ringing Audio & Answer / Decline controls
 * 3. Text-to-Speech Voice playing the urgent unpicked order details
 * 4. Interactive Keypad: Press '1' to repeat the order details!
 * 5. Red "Cut Call / Hang Up" button to disconnect immediately
 */
export default function AdminPhoneCallModal({ callData, onClose }) {
  const [callState, setCallState] = useState('ringing'); // 'ringing' | 'connected' | 'ended'
  const [duration, setDuration] = useState(0);
  const [showKeypad, setShowKeypad] = useState(true);
  const [lastKeyPressed, setLastKeyPressed] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const ringAudioCtxRef = useRef(null);
  const ringIntervalRef = useRef(null);
  const timerRef = useRef(null);
  const speechRef = useRef(null);

  // Synthesize realistic telephone ring tone (440Hz + 480Hz)
  const startRingingSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      ringAudioCtxRef.current = ctx;

      const playRingBurst = () => {
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.2);
        osc2.stop(now + 1.2);
      };

      playRingBurst();
      ringIntervalRef.current = setInterval(playRingBurst, 3000);
    } catch (e) {
      console.warn('Ringtone init error:', e);
    }
  };

  const stopRingingSound = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (ringAudioCtxRef.current) {
      try {
        ringAudioCtxRef.current.close();
      } catch {}
      ringAudioCtxRef.current = null;
    }
  };

  // Start ringing on mount
  useEffect(() => {
    startRingingSound();
    return () => {
      stopRingingSound();
      stopVoice();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Voice announcement playback
  const speakVoice = (text) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    // Pick English or Indian English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang.includes('en-IN')) ||
      voices.find((v) => v.lang.includes('en-US')) ||
      voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopVoice = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const getFullSpeechScript = () => {
    return (
      `Emergency Concession Alert from Grandé Muthuram Multiplex. ` +
      `Concession order token ${callData.orderId || callData.shortId || 'GMM'} ` +
      `for Customer ${callData.customer || 'Patron'} at Screen ${callData.screen || 1}, Seat ${callData.seat || 'A1'} ` +
      `has NOT been picked up by kitchen staff for more than ${callData.elapsedMin || 5} minutes. ` +
      `Ordered items: ${callData.items || 'Concession Items'}. ` +
      `Total paid: ${callData.total || 0} rupees. ` +
      `Please check kitchen console immediately. ` +
      `Press 1 on your phone dialpad to repeat these details, or hang up to end the call.`
    );
  };

  // Handle Answering the Call
  const handleAnswerCall = () => {
    stopRingingSound();
    setCallState('connected');

    // Call duration timer
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    // Speak details
    speakVoice(getFullSpeechScript());
  };

  // Handle Hanging Up / Cutting the Call
  const handleEndCall = () => {
    stopRingingSound();
    stopVoice();
    if (timerRef.current) clearInterval(timerRef.current);
    setCallState('ended');

    // Announce call ended
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const bye = new SpeechSynthesisUtterance('Call disconnected. Thank you.');
      bye.rate = 1.1;
      window.speechSynthesis.speak(bye);
    }

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  // Handle Keypad Press (e.g. Press '1' to Repeat)
  const handleKeyPress = (digit) => {
    setLastKeyPressed(digit);
    setTimeout(() => setLastKeyPressed(null), 800);

    // Key tone
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(digit === '1' ? 697 : 770, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {}

    if (digit === '1') {
      stopVoice();
      speakVoice(
        `Key 1 received. Repeating order details now. ` + getFullSpeechScript()
      );
    } else {
      speakVoice(`Key ${digit} received. To repeat order details, press 1. Or hang up to disconnect.`);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      {/* Smartphone Shell */}
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          background: 'linear-gradient(180deg, #18181b 0%, #09090b 100%)',
          border: '2px solid rgba(212, 175, 55, 0.4)',
          borderRadius: '36px',
          padding: '2rem 1.5rem',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(212, 175, 55, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: '#fff',
          position: 'relative',
        }}
      >
        {/* Phone Top Speaker notch */}
        <div
          style={{
            width: '60px',
            height: '5px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '10px',
            marginBottom: '1.25rem',
          }}
        />

        {/* Multiplex Branding */}
        <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: '#d4af37', fontWeight: 800, textTransform: 'uppercase' }}>
          GRANDÉ MUTHURAM MULTIPLEX
        </div>

        {/* Call Status Header */}
        <div style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: callState === 'connected' ? '#4ade80' : '#f87171', fontWeight: 700 }}>
          {callState === 'ringing' && '📞 INCOMING ESCALATION CALL...'}
          {callState === 'connected' && `🔴 CALL CONNECTED (${formatTime(duration)})`}
          {callState === 'ended' && 'CALL DISCONNECTED'}
        </div>

        {/* Recipient Phone Info */}
        <div style={{ marginTop: '1.2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '0.02em' }}>
            Admin Hotline
          </div>
          <div style={{ fontSize: '1rem', color: '#fde047', fontWeight: 700, fontFamily: 'monospace', marginTop: '0.2rem' }}>
            +91 7092466027
          </div>
        </div>

        {/* Caller Avatar / Pulsing Icon */}
        <div
          style={{
            margin: '1.5rem 0',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: callState === 'ringing'
              ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
              : 'linear-gradient(135deg, #d4af37, #996515)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.2rem',
            boxShadow: callState === 'ringing'
              ? '0 0 25px rgba(239, 68, 68, 0.8)'
              : '0 0 20px rgba(212, 175, 55, 0.5)',
            animation: callState === 'ringing' ? 'pulse 1.2s infinite' : 'none',
          }}
        >
          {callState === 'ringing' ? '🚨' : '🎙️'}
        </div>

        {/* Order Details Preview Box */}
        <div
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '0.85rem 1rem',
            fontSize: '0.82rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.3rem',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Order Token:</span>
            <strong style={{ color: '#fff' }}>#{callData.orderId || callData.shortId}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Delivery Seat:</span>
            <strong style={{ color: '#d4af37' }}>Screen {callData.screen} · Seat {callData.seat}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Customer:</span>
            <strong style={{ color: '#fff' }}>{callData.customer}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Items:</span>
            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{callData.items}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Paid Total:</span>
            <strong style={{ color: '#4ade80' }}>₹{callData.total}</strong>
          </div>
          <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '0.35rem', color: '#f87171', fontWeight: 700, fontSize: '0.75rem' }}>
            ⚠️ Unpicked by kitchen for &gt;{callData.elapsedMin || 5} minutes!
          </div>
        </div>

        {/* Voice speaking indicator */}
        {callState === 'connected' && (
          <div
            style={{
              marginTop: '0.85rem',
              fontSize: '0.76rem',
              color: isSpeaking ? '#38bdf8' : '#94a3b8',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isSpeaking ? '#38bdf8' : '#64748b' }} />
            {isSpeaking ? 'Voice playing unpicked order details...' : 'Voice message finished. Press 1 to repeat.'}
          </div>
        )}

        {/* IVR Instruction Banner */}
        {callState === 'connected' && (
          <div
            style={{
              marginTop: '0.75rem',
              width: '100%',
              background: 'rgba(212, 175, 55, 0.15)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              borderRadius: '10px',
              padding: '0.45rem 0.65rem',
              textAlign: 'center',
              fontSize: '0.75rem',
              color: '#fef08a',
              fontWeight: 800,
            }}
          >
            ⌨️ Press <strong>1</strong> on keypad to repeat details · Cut call to exit
          </div>
        )}

        {/* Numeric Keypad (Active when Call is Connected) */}
        {callState === 'connected' && showKeypad && (
          <div
            style={{
              marginTop: '0.9rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.65rem',
              width: '100%',
            }}
          >
            {[
              { k: '1', sub: 'REPEAT' },
              { k: '2', sub: 'ABC' },
              { k: '3', sub: 'DEF' },
              { k: '4', sub: 'GHI' },
              { k: '5', sub: 'JKL' },
              { k: '6', sub: 'MNO' },
              { k: '7', sub: 'PQRS' },
              { k: '8', sub: 'TUV' },
              { k: '9', sub: 'WXYZ' },
              { k: '*', sub: '' },
              { k: '0', sub: '+' },
              { k: '#', sub: '' },
            ].map(({ k, sub }) => (
              <button
                key={k}
                type="button"
                onClick={() => handleKeyPress(k)}
                style={{
                  background: lastKeyPressed === k ? '#d4af37' : k === '1' ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                  border: k === '1' ? '1.5px solid #d4af37' : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '14px',
                  padding: '0.55rem 0',
                  color: lastKeyPressed === k ? '#000' : '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '1.15rem', fontWeight: 900 }}>{k}</span>
                {sub && (
                  <span style={{ fontSize: '0.55rem', fontWeight: 800, color: k === '1' ? '#fde047' : '#94a3b8' }}>
                    {sub}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Call Actions (Answer / Cut Call) */}
        <div
          style={{
            marginTop: '1.4rem',
            display: 'flex',
            justifyContent: 'space-around',
            width: '100%',
            gap: '1rem',
          }}
        >
          {callState === 'ringing' && (
            <>
              {/* Answer Call Button */}
              <button
                type="button"
                onClick={handleAnswerCall}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.85rem',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  border: 'none',
                  borderRadius: '24px',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 18px rgba(34, 197, 94, 0.5)',
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>📞</span>
                <span>ANSWER CALL</span>
              </button>

              {/* Decline Call Button */}
              <button
                type="button"
                onClick={handleEndCall}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.85rem',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '24px',
                  color: '#fca5a5',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>✕</span>
                <span>DECLINE</span>
              </button>
            </>
          )}

          {callState === 'connected' && (
            <button
              type="button"
              onClick={handleEndCall}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
                padding: '0.9rem',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: 'none',
                borderRadius: '24px',
                color: '#fff',
                fontWeight: 900,
                fontSize: '0.95rem',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(239, 68, 68, 0.6)',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>📵</span>
              <span>CUT CALL / HANG UP</span>
            </button>
          )}

          {callState === 'ended' && (
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700 }}>
              Call terminated. Returning to console...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
