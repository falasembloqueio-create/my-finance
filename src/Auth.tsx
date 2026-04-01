import { useState } from "react";
import { supabase } from "./supabase";
import { Lock, Mail, ArrowRight, Wallet } from "lucide-react";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Verifique seu e-mail para confirmar o cadastro!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#0f172a', padding: '40px', borderRadius: '30px', border: '1px solid #1e293b', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        
        <div style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', width: '70px', height: '70px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'white', boxShadow: '0 10px 20px rgba(124, 58, 237, 0.3)' }}>
          <Wallet size={35} />
        </div>

        <h2 style={{ color: 'white', fontSize: '26px', fontWeight: '900', marginBottom: '10px', letterSpacing: '-0.5px' }}>
          {isSignUp ? 'Criar Conta' : 'Finance PRO'}
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '35px', lineHeight: '1.5' }}>
          {isSignUp ? 'Comece sua jornada para a liberdade financeira.' : 'Gestão de elite para suas finanças pessoais.'}
        </p>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input 
              type="email" 
              placeholder="E-mail" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', padding: '16px 15px 16px 48px', borderRadius: '16px', color: 'white', outline: 'none', fontSize: '14px' }}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input 
              type="password" 
              placeholder="Senha" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', background: '#020617', border: '1px solid #1e293b', padding: '16px 15px 16px 48px', borderRadius: '16px', color: 'white', outline: 'none', fontSize: '14px' }}
              required
            />
          </div>

          <button 
            disabled={loading}
            style={{ width: '100%', background: '#7c3aed', color: 'white', padding: '16px', borderRadius: '16px', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px', transition: '0.3s' }}
          >
            {loading ? 'PROCESSANDO...' : (isSignUp ? 'CADASTRAR AGORA' : 'ENTRAR NO SISTEMA')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', marginTop: '25px', cursor: 'pointer', fontWeight: '500' }}
        >
          {isSignUp ? 'Já possui uma conta? Entrar' : 'Novo por aqui? Criar uma conta gratuita'}
        </button>
      </div>
    </div>
  );
}