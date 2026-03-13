import React, { useState } from 'react';
import { ParticleRing } from './ParticleRing';
import { LoginScreen } from './LoginScreen';
import { AnimatePresence, motion } from 'motion/react';

export const EntryFlow = ({ onAuthenticated }: { onAuthenticated: () => void }) => {
  const [stage, setStage] = useState<'intro' | 'tunnel' | 'login'>('intro');

  const handleStartTunnel = () => {
    setStage('tunnel');
  };

  const handleTunnelComplete = () => {
    setStage('login');
  };

  return (
    <div className="w-full h-screen bg-black relative">
      <AnimatePresence>
        {stage !== 'login' ? (
          <motion.div
            key="animation"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <ParticleRing 
              tunnelActive={stage === 'tunnel'} 
              onTunnelActive={handleStartTunnel}
              onTunnelComplete={handleTunnelComplete}
            />
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <LoginScreen onLogin={onAuthenticated} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
