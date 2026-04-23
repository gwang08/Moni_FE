'use client';

/**
 * Reusable chibi mascot SVG with different moods/expressions.
 * Used across all dialogs in the app.
 *
 * Moods: happy, worried, sad, excited, thinking
 */

export type ChibiMood = 'happy' | 'worried' | 'sad' | 'excited' | 'thinking';

interface Props {
  mood?: ChibiMood;
  size?: number;
}

function Eyes({ mood }: { mood: ChibiMood }) {
  switch (mood) {
    case 'excited':
      // Sparkly eyes
      return (
        <>
          <text x="44" y="57" fontSize="10" textAnchor="middle">★</text>
          <text x="76" y="57" fontSize="10" textAnchor="middle">★</text>
        </>
      );
    case 'sad':
      // Droopy eyes
      return (
        <>
          <ellipse cx="48" cy="55" rx="4" ry="3" fill="#333" />
          <circle cx="47" cy="53" r="1.5" fill="white" />
          <ellipse cx="72" cy="55" rx="4" ry="3" fill="#333" />
          <circle cx="71" cy="53" r="1.5" fill="white" />
          {/* Tear */}
          <ellipse cx="42" cy="62" rx="2" ry="3" fill="#87CEEB" opacity="0.7" />
        </>
      );
    case 'worried':
      // Wide eyes with worry brows
      return (
        <>
          <ellipse cx="48" cy="53" rx="4.5" ry="5.5" fill="#333" />
          <circle cx="47" cy="51" r="2" fill="white" />
          <ellipse cx="72" cy="53" rx="4.5" ry="5.5" fill="#333" />
          <circle cx="71" cy="51" r="2" fill="white" />
          {/* Worry brows */}
          <line x1="40" y1="42" x2="52" y2="44" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="80" y1="42" x2="68" y2="44" stroke="#333" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case 'thinking':
      // Looking up eyes
      return (
        <>
          <ellipse cx="48" cy="51" rx="4" ry="5" fill="#333" />
          <circle cx="47" cy="49" r="1.5" fill="white" />
          <ellipse cx="72" cy="51" rx="4" ry="5" fill="#333" />
          <circle cx="71" cy="49" r="1.5" fill="white" />
        </>
      );
    default: // happy
      return (
        <>
          <ellipse cx="48" cy="53" rx="4" ry="5" fill="#333" />
          <circle cx="47" cy="51" r="1.5" fill="white" />
          <ellipse cx="72" cy="53" rx="4" ry="5" fill="#333" />
          <circle cx="71" cy="51" r="1.5" fill="white" />
        </>
      );
  }
}

function Mouth({ mood }: { mood: ChibiMood }) {
  switch (mood) {
    case 'excited':
      return <ellipse cx="60" cy="66" rx="7" ry="6" fill="#333" />;
    case 'sad':
      return <path d="M50 68 Q60 62 70 68" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />;
    case 'worried':
      return <path d="M50 67 Q60 63 70 67" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />;
    case 'thinking':
      return <circle cx="65" cy="66" r="3" fill="#333" />;
    default: // happy
      return <path d="M48 64 Q60 75 72 64" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />;
  }
}

function Accessory({ mood }: { mood: ChibiMood }) {
  if (mood === 'thinking') {
    // Thought bubble
    return (
      <>
        <circle cx="95" cy="30" r="8" fill="white" stroke="#ddd" strokeWidth="1" />
        <text x="95" y="34" fontSize="10" textAnchor="middle">?</text>
        <circle cx="88" cy="42" r="3" fill="white" stroke="#ddd" strokeWidth="1" />
      </>
    );
  }
  // Default: book
  return (
    <>
      <rect x="82" y="70" width="18" height="14" rx="2" fill="#4FC3F7" transform="rotate(-15 91 77)" />
      <line x1="88" y1="68" x2="88" y2="82" stroke="white" strokeWidth="1" transform="rotate(-15 91 77)" />
    </>
  );
}

export function ChibiMascot({ mood = 'happy', size = 80 }: Props) {
  const moodLabels: Record<ChibiMood, string> = {
    happy: "biểu cảm vui vẻ, sẵn sàng hỗ trợ",
    worried: "biểu cảm hơi lo lắng, đang nhắc nhở bạn",
    sad: "biểu cảm buồn bã, cần bạn cố gắng hơn",
    excited: "biểu cảm hào hứng, chúc mừng thành tích của bạn",
    thinking: "biểu cảm đang suy nghĩ, tìm giải pháp cho bạn"
  };

  return (
    <div 
      className="relative mx-auto mb-2" 
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Mascot Moni ${moodLabels[mood]}`}
    >
      <div>
        <svg viewBox="0 0 120 120" style={{ width: size, height: size }} aria-hidden="true">
          {/* Body */}
          <circle cx="60" cy="65" r="35" fill="#FFA94D" />
          {/* Face */}
          <circle cx="60" cy="58" r="30" fill="#FFE0B2" />
          {/* Eyes */}
          <Eyes mood={mood} />
          {/* Mouth */}
          <Mouth mood={mood} />
          {/* Blush */}
          <circle cx="40" cy="62" r="5" fill="#FFB3B3" opacity="0.6" />
          <circle cx="80" cy="62" r="5" fill="#FFB3B3" opacity="0.6" />
          {/* Graduation cap */}
          <polygon points="60,20 30,35 60,42 90,35" fill="#333" />
          <rect x="55" y="18" width="10" height="5" rx="2" fill="#333" />
          <line x1="85" y1="35" x2="92" y2="45" stroke="#333" strokeWidth="2" />
          <circle cx="93" cy="47" r="3" fill="#FFA94D" />
          {/* Accessory */}
          <Accessory mood={mood} />
          {/* Wave hand (happy/excited only) */}
          {(mood === 'happy' || mood === 'excited') && (
            <circle cx="28" cy="72" r="6" fill="#FFE0B2" className="animate-wave-hand" />
          )}
        </svg>
      </div>
      {/* Sparkles for happy/excited */}
      {(mood === 'happy' || mood === 'excited') && (
        <>
          <div className="absolute top-0 left-1 animate-sparkle">
            <svg width="12" height="12" viewBox="0 0 12 12"><polygon points="6,0 7.5,4.5 12,6 7.5,7.5 6,12 4.5,7.5 0,6 4.5,4.5" fill="#FFD700" /></svg>
          </div>
          <div className="absolute top-3 right-0 animate-sparkle-delay">
            <svg width="10" height="10" viewBox="0 0 12 12"><polygon points="6,0 7.5,4.5 12,6 7.5,7.5 6,12 4.5,7.5 0,6 4.5,4.5" fill="#FF8A65" /></svg>
          </div>
        </>
      )}
    </div>
  );
}

/** Global CSS for chibi animations — include once in layout or dialog that uses ChibiMascot */
export function ChibiAnimationStyles() {
  return (
    <style jsx global>{`
      @keyframes bounce-slow {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      @keyframes wave-hand {
        0%, 100% { transform: rotate(0deg) translateX(0); }
        25% { transform: rotate(-15deg) translateX(-3px); }
        75% { transform: rotate(15deg) translateX(3px); }
      }
      @keyframes sparkle {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.3; transform: scale(0.5); }
      }
      @keyframes sparkle-delay {
        0%, 100% { opacity: 0.3; transform: scale(0.5); }
        50% { opacity: 1; transform: scale(1); }
      }
      .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
      .animate-wave-hand { animation: wave-hand 1.5s ease-in-out infinite; transform-origin: 28px 72px; }
      .animate-sparkle { animation: sparkle 2s ease-in-out infinite; }
      .animate-sparkle-delay { animation: sparkle-delay 2s ease-in-out infinite; }
    `}</style>
  );
}
