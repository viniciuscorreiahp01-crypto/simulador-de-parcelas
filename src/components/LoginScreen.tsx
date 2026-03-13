import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Calculator, User, Lock } from 'lucide-react';

const MOCK_LOGIN = "admin";
const MOCK_SENHA = "123";

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    const cleanLogin = login.trim().toLowerCase();
    const cleanSenha = senha.trim();

    if (cleanLogin === MOCK_LOGIN && cleanSenha === MOCK_SENHA) {
      localStorage.setItem('sf_session', 'active');
      onLogin();
    } else {
      setError('Credenciais inválidas. Tente admin / 123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 font-sans bg-black">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="glass-card rounded-[2.5rem] p-10 w-full max-w-md space-y-8 bg-zinc-900/50 border border-emerald-500/10"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <Calculator size={32} className="text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white">Bem-vindo</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-500/60">Acesse o Simulador de Parcelas</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 ml-1 text-white">Usuário</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Ex: admin"
                className="input-field pl-12 bg-black/40 border-zinc-800 text-white w-full py-4 rounded-xl px-4 outline-none focus:border-emerald-500/50 transition-all font-mono"
                autoCapitalize="none"
                autoCorrect="off"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 ml-1 text-white">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••"
                className="input-field pl-12 bg-black/40 border-zinc-800 text-white w-full py-4 rounded-xl px-4 outline-none focus:border-emerald-500/50 transition-all font-mono"
                autoCapitalize="none"
                autoCorrect="off"
                required
              />
            </div>
          </div>

          {error && <p className="text-[10px] font-bold text-red-400 text-center uppercase tracking-widest font-mono">{error}</p>}

          <button 
            type="submit"
            className="w-full py-5 rounded-2xl bg-emerald-500 text-zinc-950 font-black text-lg shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all active:scale-95"
          >
            Entrar
          </button>
        </form>
      </motion.div>
    </div>
  );
}
