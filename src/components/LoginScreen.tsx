import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Calculator, User, Lock } from 'lucide-react';
import { supabase } from '../utils/supabase';

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const cleanLogin = login.trim().toLowerCase();
    const cleanSenha = senha.trim();
    const email = cleanLogin.includes('@') ? cleanLogin : `${cleanLogin}@example.com`;

    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: cleanSenha,
        options: {
          data: {
            full_name: cleanLogin.split('@')[0],
          }
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
      } else {
        setError('Cadastro realizado! Verifique seu e-mail ou tente logar.');
        setIsLoading(false);
        setIsSignUp(false);
      }
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: cleanSenha,
      });

      if (authError) {
        setError('Credenciais inválidas. Verifique os dados ou cadastre-se.');
        setIsLoading(false);
      } else {
        localStorage.setItem('sf_session', 'active');
        onLogin();
      }
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
          <h1 className="text-3xl font-black tracking-tighter text-white">{isSignUp ? 'Criar Conta' : 'Bem-vindo'}</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-500/60">
            {isSignUp ? 'Cadastre-se para salvar suas simulações' : 'Acesse o Simulador de Parcelas'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 ml-1 text-white">E-mail ou Usuário</label>
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

          {error && <p className="text-[10px] font-bold text-emerald-400 text-center uppercase tracking-widest font-mono">{error}</p>}

          <div className="space-y-4">
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-5 rounded-2xl bg-emerald-500 text-zinc-950 font-black text-lg shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'Aguarde...' : (isSignUp ? 'Cadastrar' : 'Entrar')}
            </button>

            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-emerald-400 transition-colors"
            >
              {isSignUp ? 'Já tenho conta. Fazer Login' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
