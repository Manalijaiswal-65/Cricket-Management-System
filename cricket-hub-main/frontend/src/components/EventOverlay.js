import React, { useEffect, useState } from 'react';

// Add animation styles to document head
const addAnimationStyles = () => {
  if (document.getElementById('cricket-event-animations')) return;

  const style = document.createElement('style');
  style.id = 'cricket-event-animations';
  style.textContent = `
    /* ===== PRO EVENT ANIMATIONS ===== */

    @keyframes overlayIn {
      0% { opacity: 0; backdrop-filter: blur(0px); }
      100% { opacity: 1; backdrop-filter: blur(8px); }
    }

    @keyframes overlayOut {
      0% { opacity: 1; backdrop-filter: blur(8px); }
      100% { opacity: 0; backdrop-filter: blur(0px); }
    }

    /* 3D Text Reveal */
    @keyframes textReveal3D {
      0% { transform: perspective(400px) rotateX(90deg); opacity: 0; }
      40% { transform: perspective(400px) rotateX(-20deg); opacity: 1; }
      60% { transform: perspective(400px) rotateX(10deg); }
      80% { transform: perspective(400px) rotateX(-5deg); }
      100% { transform: perspective(400px) rotateX(0deg); opacity: 1; }
    }

    /* Shockwave effect */
    @keyframes shockwave {
      0% { transform: scale(0); opacity: 0; box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
      50% { opacity: 1; }
      100% { transform: scale(2); opacity: 0; box-shadow: 0 0 0 100px rgba(255, 255, 255, 0); }
    }

    /* Glitch effect for Wicket */
    @keyframes glitch {
      0% { transform: translate(0); }
      20% { transform: translate(-5px, 5px); }
      40% { transform: translate(-5px, -5px); }
      60% { transform: translate(5px, 5px); }
      80% { transform: translate(5px, -5px); }
      100% { transform: translate(0); }
    }

    /* Rocket launch for Six */
    @keyframes rocketLaunch {
      0% { transform: translateY(100vh) scale(0.5); opacity: 0; }
      50% { transform: translateY(0) scale(1.2); opacity: 1; }
      70% { transform: translateY(-20px) scale(1); }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }

    /* Boundary wave for Four */
    @keyframes boundarySlide {
      0% { transform: translateX(-100vw) skewX(-20deg); opacity: 0; }
      60% { transform: translateX(10%) skewX(10deg); opacity: 1; }
      80% { transform: translateX(-5%) skewX(-5deg); }
      100% { transform: translateX(0) skewX(0); opacity: 1; }
    }

    /* Pulse ring */
    @keyframes pulseRing {
      0% { transform: scale(0.8); opacity: 0.5; }
      100% { transform: scale(1.3); opacity: 0; }
    }

    /* Confetti fall */
    @keyframes confettiFall {
      0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }

    /* Floating particles */
    @keyframes floatParticle {
      0% { transform: translateY(0) translateX(0); opacity: 0; }
      20% { opacity: 1; }
      100% { transform: translateY(-100px) translateX(50px); opacity: 0; }
    }

    .animate-overlay-in { animation: overlayIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
    .animate-overlay-out { animation: overlayOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
    .animate-text-3d { animation: textReveal3D 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
    .animate-shockwave { animation: shockwave 1s ease-out infinite; }
    .animate-glitch { animation: glitch 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both infinite; }
    .animate-rocket { animation: rocketLaunch 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
    .animate-boundary { animation: boundarySlide 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
  `;
  document.head.appendChild(style);
};

const EventOverlay = ({ event, onComplete }) => {
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    addAnimationStyles();
  }, []);

  useEffect(() => {
    if (!event) return;

    const displayDuration = event.type === 'winning' ? 5000 :
                           event.type === 'wicket' ? 3000 :
                           event.type === 'six' ? 2500 :
                           event.type === 'four' ? 2000 :
                           event.type === 'end_innings' ? 3000 : 1500;

    const timer = setTimeout(() => {
      setIsHiding(true);
      setTimeout(() => {
        onComplete();
        setIsHiding(false);
      }, 300);
    }, displayDuration);

    return () => clearTimeout(timer);
  }, [event, onComplete]);

  if (!event) return null;

  const getEventConfig = () => {
    switch (event.type) {
      case 'six':
        return {
          text: '6',
          subtext: 'MAXIMUM!',
          bgGradient: 'from-violet-600/90 via-fuchsia-600/90 to-violet-600/90',
          textColor: 'text-white',
          icon: '🚀',
          animation: 'animate-rocket',
          particles: true,
          particleColors: ['#8b5cf6', '#d946ef', '#f472b6']
        };
      case 'four':
        return {
          text: '4',
          subtext: 'BOUNDARY!',
          bgGradient: 'from-blue-600/90 via-cyan-500/90 to-blue-600/90',
          textColor: 'text-white',
          icon: '💥',
          animation: 'animate-boundary',
          particles: true,
          particleColors: ['#3b82f6', '#06b6d4', '#0ea5e9']
        };
      case 'wicket':
        return {
          text: 'OUT!',
          subtext: 'WICKET',
          bgGradient: 'from-red-700/90 via-rose-600/90 to-red-700/90',
          textColor: 'text-white',
          icon: '🏏',
          animation: 'animate-text-3d animate-glitch',
          particles: false,
          shockwave: true
        };
      case 'wide':
        return {
          text: 'WIDE',
          subtext: '+1 Extra',
          bgGradient: 'from-yellow-500/90 via-amber-500/90 to-yellow-500/90',
          textColor: 'text-black',
          icon: '↔️',
          animation: 'animate-text-3d',
          particles: false
        };
      case 'noball':
        return {
          text: 'NO BALL',
          subtext: 'Free Hit Coming Up!',
          bgGradient: 'from-orange-500/90 via-amber-500/90 to-orange-500/90',
          textColor: 'text-black',
          icon: '⚠️',
          animation: 'animate-text-3d',
          particles: false
        };
      case 'end_innings':
        return {
          text: 'INNINGS BREAK',
          subtext: 'Target Set',
          bgGradient: 'from-slate-800/95 via-slate-700/95 to-slate-800/95',
          textColor: 'text-white',
          icon: '🔄',
          animation: 'animate-text-3d',
          particles: false
        };
      case 'winning':
        return {
          text: event.winner || 'WINNER',
          subtext: 'CHAMPIONS! 🏆',
          bgGradient: 'from-yellow-400/90 via-amber-300/90 to-yellow-400/90',
          textColor: 'text-black',
          icon: '🎉',
          animation: 'animate-text-3d',
          particles: true,
          particleColors: ['#fbbf24', '#f59e0b', '#eab308', '#22c55e', '#3b82f6'],
          confetti: true
        };
      case 'dot':
        return {
          text: '•',
          subtext: 'DOT BALL',
          bgGradient: 'from-gray-600/80 via-gray-500/80 to-gray-600/80',
          textColor: 'text-white',
          icon: '',
          animation: 'animate-text-3d',
          particles: false,
          small: true
        };
      default: // runs 1, 2, 3, 5
        return {
          text: event.runs?.toString() || '1',
          subtext: event.runs === 1 ? 'RUN' : 'RUNS',
          bgGradient: 'from-emerald-600/90 via-green-500/90 to-emerald-600/90',
          textColor: 'text-white',
          icon: '🏃',
          animation: 'animate-text-3d',
          particles: false
        };
    }
  };

  const config = getEventConfig();

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden ${isHiding ? 'animate-overlay-out' : 'animate-overlay-in'}`}>
      {/* Background overlay with blur and gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient}`} />

      {/* Shockwave effect for wickets */}
      {config.shockwave && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-32 h-32 rounded-full border-4 border-white animate-shockwave" />
          <div className="w-32 h-32 rounded-full border-4 border-white animate-shockwave" style={{ animationDelay: '0.3s' }} />
        </div>
      )}

      {/* Particles/Confetti for special events */}
      {config.particles && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: config.particleColors[i % config.particleColors.length],
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `floatParticle ${1 + Math.random()}s ease-out ${Math.random() * 0.5}s infinite`
              }}
            />
          ))}
        </div>
      )}

      {/* Confetti for winning */}
      {config.confetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-8 rounded-sm"
              style={{
                backgroundColor: config.particleColors[i % config.particleColors.length],
                left: `${Math.random() * 100}%`,
                top: '-20px',
                animation: `confettiFall ${2 + Math.random() * 2}s linear ${Math.random() * 2}s infinite`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <div className={`relative z-10 text-center transform ${config.animation}`}>
        {config.icon && (
          <div className="text-7xl mb-6 filter drop-shadow-lg animate-bounce">{config.icon}</div>
        )}
        <div className={`${config.small ? 'text-8xl' : 'text-9xl'} font-black ${config.textColor} drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] tracking-tighter`}
             style={{ textShadow: '0 0 40px rgba(255,255,255,0.5)' }}>
          {config.text}
        </div>
        <div className={`text-4xl font-bold ${config.textColor} mt-6 tracking-[0.2em] uppercase drop-shadow-md`}>
          {config.subtext}
        </div>
      </div>
    </div>
  );
};

export default EventOverlay;
