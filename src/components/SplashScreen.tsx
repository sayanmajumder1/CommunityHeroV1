import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, Server, MapPin, CheckCircle2, Cpu } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [statusText, setStatusText] = useState('Initializing Community Hero workspace...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const statuses = [
      'Loading local district maps...',
      'Setting up neighborhood geofences...',
      'Configuring Gemini civic intelligence...',
      'Syncing municipal department contacts...',
      'Preparing active resident dashboard...',
      'Ready'
    ];

    let currentStatusIndex = 0;
    const statusInterval = setInterval(() => {
      if (currentStatusIndex < statuses.length - 1) {
        currentStatusIndex++;
        setStatusText(statuses[currentStatusIndex]);
      }
    }, 550);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          clearInterval(statusInterval);
          setTimeout(() => {
            onComplete();
          }, 400);
          return 100;
        }
        return prev + 10;
      });
    }, 40);

    return () => {
      clearInterval(statusInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center text-neutral-900 select-none overflow-hidden font-sans">
      {/* Subtle Green Glow Effects */}
      <motion.div 
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_30%_30%,rgba(34,197,94,0.1),transparent_50%)] pointer-events-none"
      />

      <div className="relative z-10 flex flex-col items-center max-w-md px-8 text-center">
        {/* Shield Logo Container - Green */}
        <motion.div 
          initial={{ scale: 0.4, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 15, delay: 0.1 }}
          className="relative mb-6"
        >
          <div className="relative bg-gradient-to-tr from-green-500 to-green-700 p-5 rounded-[28px] shadow-2xl shadow-green-500/20 border border-green-400/20">
            <Shield className="w-12 h-12 text-white" />
          </div>
          
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="absolute -top-1 -right-1 bg-green-400 text-white rounded-full p-1.5 shadow-xl border border-white"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </motion.div>
        </motion.div>

        {/* Brand Typography */}
        <div className="space-y-1 mt-4">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-4xl font-black tracking-tight text-neutral-900 uppercase"
          >
            Community<span className="text-green-600">Hero</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, letterSpacing: '0.1em' }}
            animate={{ opacity: 1, letterSpacing: '0.2em' }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-[0.2em]"
          >
            Together We Build Better Communities
          </motion.p>
        </div>

        {/* Progress & Status Indicators */}
        <div className="w-full mt-10 space-y-4">
          <div className="relative pt-1">
            <div className="w-full bg-neutral-100 h-2 rounded-full border border-neutral-200 p-0.5 overflow-hidden">
              <div 
                className="bg-green-500 h-1 rounded-full transition-all duration-100 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="absolute -top-5 right-0 text-[10px] font-bold font-mono text-green-600">
              {progress}%
            </span>
          </div>

          {/* Active status text */}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-neutral-600 h-6">
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
            </span>
            <AnimatePresence mode="wait">
              <motion.span 
                key={statusText}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="font-bold text-neutral-500 uppercase tracking-wider text-[9px]"
              >
                {statusText}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
