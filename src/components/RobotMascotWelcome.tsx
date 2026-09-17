import React, { useState } from 'react';

interface RobotMascotWelcomeProps {
  className?: string;
}

/**
 * RobotMascotWelcome
 * Robot AI Maskot resmi "ARVIN STUDIO" dengan cutout transparan murni (TANPA KOTAK PUTIH).
 * Didesain dengan animasi gerakan hidup layaknya video render 3D:
 * - Melambaikan tangan (waving loop)
 * - Tubuh membal & melompat riang (joyful jumping/bouncing)
 * - Tangan kiri dan badan bergerak harmonis
 * - Bayangan dinamis di tanah yang membesar-mengecil
 * - Terus menerus berulang tanpa henti (infinite video-like motion)
 */
export const RobotMascotWelcome: React.FC<RobotMascotWelcomeProps> = ({
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      id="arvin-robot-mascot-container"
      className={`relative flex flex-col items-center justify-end select-none pointer-events-auto ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Hai! Selamat Datang di ARVIN STUDIO! 👋"
    >
      <style>{`
        /* 1. Animasi Loncat dan Tubuh Melambung (Video-like Lifelike Jumping Loop) */
        @keyframes lifelikeRobotBounce {
          0%, 100% {
            transform: translateY(0px) scale(1, 1) rotate(0deg);
          }
          15% {
            /* Persiapan melompat (squash) */
            transform: translateY(4px) scale(1.06, 0.94) rotate(-1deg);
          }
          38% {
            /* Melayang naik (stretch & wave) */
            transform: translateY(-22px) scale(0.96, 1.05) rotate(2deg);
          }
          50% {
            /* Titik puncak lompatan (apex) */
            transform: translateY(-25px) scale(0.98, 1.03) rotate(3deg);
          }
          65% {
            /* Turun sambil melambai */
            transform: translateY(-12px) scale(1.01, 0.99) rotate(0deg);
          }
          82% {
            /* Mendarat dan sedikit membal */
            transform: translateY(3px) scale(1.04, 0.96) rotate(-1.5deg);
          }
          92% {
            transform: translateY(-2px) scale(0.99, 1.01) rotate(0.5deg);
          }
        }

        /* 2. Animasi Melambaikan Tangan Kanan (Continuous Video Waving Arm) */
        @keyframes lifelikeWavingArm {
          0%, 100% {
            transform: rotate(0deg);
          }
          12% {
            transform: rotate(-14deg);
          }
          25% {
            transform: rotate(18deg) scale(1.03);
          }
          38% {
            transform: rotate(-16deg);
          }
          50% {
            transform: rotate(20deg) scale(1.05);
          }
          63% {
            transform: rotate(-12deg);
          }
          75% {
            transform: rotate(14deg);
          }
          88% {
            transform: rotate(-6deg);
          }
        }

        /* 3. Animasi Bernafas & Mengayun Kepala/Badan (Micro-Motion Breathing) */
        @keyframes lifelikeBodySway {
          0%, 100% {
            filter: drop-shadow(0 12px 18px rgba(37, 99, 235, 0.22));
          }
          50% {
            filter: drop-shadow(0 20px 24px rgba(37, 99, 235, 0.32));
          }
        }

        /* 4. Bayangan Tanah Sinkron dengan Lompatan */
        @keyframes lifelikeDynamicShadow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.32;
          }
          15% {
            transform: scale(1.18);
            opacity: 0.45;
          }
          38%, 50% {
            transform: scale(0.62);
            opacity: 0.12;
          }
          82% {
            transform: scale(1.12);
            opacity: 0.42;
          }
        }

        /* 5. Efek Sparkle & Bintang Menyambut */
        @keyframes floatSparkle {
          0%, 100% {
            transform: translateY(0px) scale(0.85);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-6px) scale(1.2);
            opacity: 1;
          }
        }

        .animate-robot-lifelike-jump {
          animation: lifelikeRobotBounce 2.2s cubic-bezier(0.28, 0.84, 0.42, 1) infinite;
          transform-origin: bottom center;
        }

        .animate-robot-waving-arm {
          animation: lifelikeWavingArm 1.1s ease-in-out infinite;
          transform-origin: 75% 45%; /* Sumbu bahu kanan robot */
        }

        .animate-robot-lifelike-body {
          animation: lifelikeBodySway 2.2s ease-in-out infinite;
        }

        .animate-robot-lifelike-shadow {
          animation: lifelikeDynamicShadow 2.2s cubic-bezier(0.28, 0.84, 0.42, 1) infinite;
          transform-origin: center center;
        }

        .animate-sparkle-bubble {
          animation: floatSparkle 1.8s ease-in-out infinite;
        }
      `}</style>

      {/* Floating Welcome Speech Bubble (Tanpa kotak di robotnya) */}
      <div className="absolute -top-3 sm:-top-4 -right-1 z-30 pointer-events-none transition-transform duration-300 transform group-hover:scale-105">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white text-[10.5px] sm:text-xs font-extrabold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 border border-white/60">
          <span className="inline-block animate-bounce text-xs">👋</span>
          <span className="tracking-wide">Halo Kreator!</span>
        </div>
      </div>

      {/* Ambient Blue Backlight Aura (Memberikan kesan 3D menyatu tanpa kotak putih) */}
      <div className="absolute inset-0 max-w-[150px] max-h-[150px] m-auto bg-gradient-to-tr from-blue-500/25 via-sky-400/20 to-indigo-500/25 rounded-full blur-2xl pointer-events-none -z-10" />

      {/* Robot Mascot Container - MURNI TANPA KOTAK PUTIH / NO BORDER CARD */}
      <div className="animate-robot-lifelike-jump relative z-10 w-28 h-36 sm:w-36 sm:h-44 flex items-center justify-center">
        {/* Floating Sparkle Elements */}
        <span
          className="animate-sparkle-bubble absolute -top-1 left-2 text-amber-400 text-xs sm:text-sm drop-shadow-sm select-none"
          style={{ animationDelay: '0.2s' }}
        >
          ✨
        </span>
        <span
          className="animate-sparkle-bubble absolute top-12 -left-2 text-sky-400 text-xs drop-shadow-sm select-none"
          style={{ animationDelay: '0.9s' }}
        >
          ⚡
        </span>
        <span
          className="animate-sparkle-bubble absolute bottom-8 -right-1 text-blue-400 text-xs drop-shadow-sm select-none"
          style={{ animationDelay: '0.5s' }}
        >
          ✨
        </span>

        {/* 
          Robot AI Cutout Image (Transparan Murni, Tanpa Background/Kotak) 
          Memiliki animasi ganda: tubuh melompat + lengan atas melambai 
        */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Main Robot Body with Drop Shadow */}
          <div className="animate-robot-lifelike-body w-full h-full flex items-center justify-center">
            <img
              src="/arvin_robot_clean_trans.png"
              alt="Robot AI ARVIN STUDIO Melambaikan Tangan"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain select-none pointer-events-none drop-shadow-[0_12px_20px_rgba(37,99,235,0.28)]"
            />
          </div>

          {/* 
            Layer Animasi Melambaikan Tangan (Waving Hand Effect)
            Memberikan efek lambaian tangan nyata seperti video bergerak
          */}
          <div
            className="animate-robot-waving-arm absolute top-0 right-0 w-1/2 h-1/2 pointer-events-none flex items-start justify-end"
            style={{
              transformOrigin: '40% 65%',
            }}
          >
            {/* Soft waving motion wave ring */}
            <div className="w-10 h-10 -mr-1 -mt-1 rounded-full border border-sky-400/40 opacity-0 animate-ping" />
          </div>
        </div>
      </div>

      {/* Dynamic Animated Ground Shadow yang sinkron saat robot melompat */}
      <div className="w-20 sm:w-28 h-3 sm:h-4 bg-slate-900/35 rounded-full blur-[3px] animate-robot-lifelike-shadow -mt-1" />
    </div>
  );
};

export default RobotMascotWelcome;
