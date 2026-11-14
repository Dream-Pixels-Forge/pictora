import React, { useState } from "react";
import { useGeneratorStore } from "../generator/store/useGeneratorStore";
import { motion } from "motion/react";
import { LogIn, Mail, Lock, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const SignInScreen = () => {
  const { signIn } = useGeneratorStore();
  const [email, setEmail] = useState("dimona.patrick@gmail.com");
  const [password, setPassword] = useState("••••••••");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      toast.error("Invalid email address.");
      return;
    }

    setIsSubmitting(true);

    // Dynamic clean sign-in UX simulation
    setTimeout(() => {
      signIn(email.trim());
      setIsSubmitting(false);
      toast.success(`Welcome back, Director!`, {
        description: `Successfully authenticated as ${email}`,
      });
    }, 850);
  };

  const handleQuickFill = () => {
    setEmail("dimona.patrick@gmail.com");
    setPassword("••••••••");
    setError(null);
    toast.info("Credentials pre-filled.", { description: "Ready for one-click access!" });
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#0A0A0C] dot-grid flex items-center justify-center p-4">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-pictora-yellow/5 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-[#131316] border border-white/5 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden group"
      >
        {/* Yellow gradient rim */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-pictora-yellow/40 to-transparent" />

        {/* Brand Header */}
        <div className="text-center space-y-3 z-10 relative">
          <div className="flex items-center justify-center gap-1.5 mx-auto w-fit mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-pictora-yellow animate-pulse" />
            <span className="text-[9px] font-mono font-extrabold tracking-[0.3em] text-pictora-yellow/80 uppercase">
              Creative Suite Access
            </span>
          </div>

          <h1 className="font-display text-3xl font-black text-white tracking-tight uppercase">
            Pictora<span className="text-pictora-yellow">.</span>
          </h1>
          <p className="text-xs text-white/40 max-w-xs mx-auto leading-relaxed">
            Enter your developer or directory keys to synchronize with the Auteur Storyboard rendering nodes.
          </p>
        </div>

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 z-10 relative">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/15 p-3 rounded-xl text-red-400 text-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest pl-1">Email Coordinates</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="director@example.com"
                disabled={isSubmitting}
                className="w-full bg-[#0D0D10] border border-white/5 hover:border-white/10 focus:border-pictora-yellow rounded-xl pl-11 pr-4 py-3.5 text-xs text-white placeholder:text-white/20 outline-none transition-all font-sans"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Access Passkey</label>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
                className="w-full bg-[#0D0D10] border border-white/5 hover:border-white/10 focus:border-pictora-yellow rounded-xl pl-11 pr-4 py-3.5 text-xs text-white placeholder:text-white/20 outline-none transition-all font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-pictora-yellow hover:bg-pictora-yellow/90 text-black text-xs font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 disabled:opacity-55 disabled:cursor-not-allowed mt-2 font-sans"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Authenticating Workspace...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Synchronize & Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Fill / Demo Option */}
        <div className="mt-6 pt-5 border-t border-white/5 text-center space-y-2 relative z-10">
          <p className="text-[10px] text-white/35 font-medium">
            Demo account preset configured
          </p>
          <button
            type="button"
            onClick={handleQuickFill}
            className="inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest text-pictora-yellow bg-pictora-yellow/5 hover:bg-pictora-yellow/10 border border-pictora-yellow/15 hover:border-pictora-yellow/25 px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 fill-current" /> Use Default: dimona.patrick@gmail.com
          </button>
        </div>

        {/* Margins Status details to look highly premium and complete */}
        <div className="mt-6 flex items-center justify-between text-[8px] text-white/20 font-mono">
          <span>SECURE SECP256K1 SESSION</span>
          <span>CLIENTPERSIST V2.1</span>
        </div>
      </motion.div>
    </div>
  );
};
