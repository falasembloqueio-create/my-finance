import { useState, useEffect } from "react";
import { 
  Wallet, TrendingUp, TrendingDown, LogOut, 
  LayoutGrid, List, BarChart3, Pencil, User, Download
} from "lucide-react";
import { supabase } from "./supabase";

interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  categoria: string;
  created_at: string;
}

const CATEGORIAS = ["Geral", "Comida", "Lazer", "Contas", "Saúde", "Trabalho", "Investimento"];

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'inicio' | 'extrato' | 'analise'>(
    (localStorage.getItem('minhaAba') as any) || 'inicio'
  );
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual] = useState(new Date().getFullYear());

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoriaCadastro, setCategoriaCadastro] = useState("Geral");
  const [erro, setErro] = useState(false);

  const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (user) puxarTransacoes(); }, [user]);
  useEffect(() => { localStorage.setItem('minhaAba', abaAtiva); }, [abaAtiva]);

  const puxarTransacoes = async () => {
    const { data, error } = await supabase.from("financas").select("*").order("created_at", { ascending: false });
    if (!error && data) setTransacoes(data);
  };

  const exportarCSV = () => {
    const cabecalho = "Data,Descricao,Valor,Tipo,Categoria\n";
    const linhas = transacoes.map(t => `${new Date(t.created_at).toLocaleDateString()},${t.descricao},${t.valor},${t.tipo},${t.categoria}`).join("\n");
    const blob = new Blob([cabecalho + linhas], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `meu-caixa.csv`);
    link.click();
  };

  const salvarTransacao = async (tipo?: 'entrada' | 'saida') => {
    if (!descricao || !valor || parseFloat(valor) <= 0) {
      setErro(true);
      setTimeout(() => setErro(false), 500);
      return;
    }
    if (idEditando) {
      await supabase.from("financas").update({ descricao, valor: parseFloat(valor), categoria: categoriaCadastro }).eq('id', idEditando);
      setIdEditando(null); setDescricao(""); setValor(""); puxarTransacoes();
    } else {
      await supabase.from("financas").insert([{ descricao, valor: parseFloat(valor), tipo, categoria: categoriaCadastro, user_id: user?.id }]);
      setDescricao(""); setValor(""); puxarTransacoes();
    }
  };

  const transacoesDoMes = transacoes.filter(t => {
    const d = new Date(t.created_at);
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  });

  const totalEntradas = transacoesDoMes.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0);
  const totalSaidas = transacoesDoMes.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + t.valor, 0);
  const saldo = totalEntradas - totalSaidas;

  if (loading) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: '#8b5cf6', fontWeight: '900'}}>SINCRONIZANDO...</div>;

  if (!user) {
    return (
      <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', padding: '20px'}}>
        <div style={{width: '100%', maxWidth: '350px', background: '#0f172a', padding: '30px', borderRadius: '30px', border: '1px solid #1e293b', textAlign: 'center'}}>
          <div style={{background: '#7c3aed', width: '60px', height: '60px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'white'}}><Wallet size={30} /></div>
          <h2 style={{color: 'white', fontWeight: '900', fontStyle: 'italic', marginBottom: '20px'}}>MYFINANCES</h2>
          <input style={{width: '100%', height: '50px', background: '#020617', border: '1px solid #1e293b', borderRadius: '12px', padding: '0 15px', color: 'white', marginBottom: '10px'}} type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
          <input style={{width: '100%', height: '50px', background: '#020617', border: '1px solid #1e293b', borderRadius: '12px', padding: '0 15px', color: 'white', marginBottom: '20px'}} type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} />
          <button onClick={() => { setLoading(true); isRegistering ? supabase.auth.signUp({email, password}).then(() => setLoading(false)) : supabase.auth.signInWithPassword({email, password}).then(() => setLoading(false)) }} style={{width: '100%', height: '50px', background: '#7c3aed', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 'bold', cursor: 'pointer'}}>{isRegistering ? 'CRIAR CONTA' : 'ENTRAR'}</button>
          <p onClick={() => setIsRegistering(!isRegistering)} style={{color: '#64748b', fontSize: '10px', marginTop: '15px', cursor: 'pointer', textDecoration: 'underline'}}>{isRegistering ? 'JÁ TENHO CONTA' : 'QUERO ME CADASTRAR'}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight: '100vh', background: '#020617', color: '#e2e8f0', display: 'flex', justifyContent: 'center', paddingBottom: '100px'}}>
      <div style={{width: '100%', maxWidth: '400px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px'}}>
        
        <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
             <div style={{background: '#0f172a', padding: '10px', borderRadius: '50%', border: '1px solid #1e293b', color: '#8b5cf6'}}><User size={20} /></div>
             <h1 style={{fontSize: '14px', fontWeight: 'bold', color: 'white'}}>@{user.email.split('@')[0]}</h1>
          </div>
          <div style={{display: 'flex', gap: '10px'}}>
            <button onClick={exportarCSV} style={{background: '#0f172a', border: '1px solid #1e293b', padding: '10px', borderRadius: '12px', color: '#10b981', cursor: 'pointer'}}><Download size={18} /></button>
            <button onClick={() => supabase.auth.signOut()} style={{background: '#0f172a', border: '1px solid #1e293b', padding: '10px', borderRadius: '12px', color: '#f43f5e', cursor: 'pointer'}}><LogOut size={18} /></button>
          </div>
        </header>

        <div style={{background: '#0f172a', padding: '15px', borderRadius: '20px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
           <button onClick={() => setMesAtual(mesAtual === 0 ? 11 : mesAtual - 1)} style={{background: 'none', border: 'none', color: '#64748b', cursor: 'pointer'}}><TrendingDown size={20} style={{transform: 'rotate(90deg)'}}/></button>
           <div style={{color: '#a78bfa', fontWeight: '900', fontSize: '12px', letterSpacing: '1px'}}>{mesesNomes[mesAtual].toUpperCase()} {anoAtual}</div>
           <button onClick={() => setMesAtual(mesAtual === 11 ? 0 : mesAtual + 1)} style={{background: 'none', border: 'none', color: '#64748b', cursor: 'pointer'}}><TrendingUp size={20} style={{transform: 'rotate(90deg)'}}/></button>
        </div>

        {abaAtiva === 'inicio' && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
              <div style={{background: '#0f172a', padding: '20px', borderRadius: '25px', border: '1px solid rgba(16,185,129,0.3)'}}>
                <p style={{color: '#10b981', fontSize: '10px', fontWeight: 'bold', marginBottom: '5px'}}>GANHOS</p>
                <p style={{fontSize: '18px', fontWeight: '900', color: 'white'}}>R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div style={{background: '#0f172a', padding: '20px', borderRadius: '25px', border: '1px solid rgba(244,63,94,0.3)'}}>
                <p style={{color: '#f43f5e', fontSize: '10px', fontWeight: 'bold', marginBottom: '5px'}}>GASTOS</p>
                <p style={{fontSize: '18px', fontWeight: '900', color: 'white'}}>R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div style={{background: '#0f172a', padding: '40px 20px', borderRadius: '40px', border: '1px solid #1e293b', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}}>
               <p style={{color: '#64748b', fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px'}}>SALDO DISPONÍVEL</p>
               <h2 style={{fontSize: '36px', fontWeight: '900', color: saldo >= 0 ? '#10b981' : '#f43f5e', margin: '15px 0'}}>R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
               <div style={{color: saldo >= 0 ? '#10b981' : '#f43f5e', fontSize: '10px', fontWeight: 'bold', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '10px', display: 'inline-block'}}>{saldo >= 0 ? 'NO AZUL! 🚀' : 'ATENÇÃO! ⚠️'}</div>
            </div>

            <div style={{background: '#0f172a', padding: '25px', borderRadius: '35px', border: `2px solid ${erro ? '#f43f5e' : '#1e293b'}`, display: 'flex', flexDirection: 'column', gap: '15px'}}>
              <p style={{fontSize: '10px', fontWeight: 'bold', color: '#64748b'}}>{idEditando ? '✏️ EDITAR REGISTRO' : '➕ NOVO REGISTRO'}</p>
              <input style={{width: '100%', height: '50px', background: '#020617', border: '1px solid #1e293b', borderRadius: '15px', padding: '0 15px', color: 'white', outline: 'none'}} placeholder="O que você comprou?" value={descricao} onChange={e => setDescricao(e.target.value)} />
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                <input style={{width: '100%', height: '50px', background: '#020617', border: '1px solid #1e293b', borderRadius: '15px', padding: '0 15px', color: 'white', outline: 'none'}} type="number" placeholder="Valor R$" value={valor} onChange={e => setValor(e.target.value)} />
                <select style={{width: '100%', height: '50px', background: '#020617', border: '1px solid #1e293b', borderRadius: '15px', padding: '0 10px', color: 'white', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase'}} value={categoriaCadastro} onChange={(e) => setCategoriaCadastro(e.target.value)}>{CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
              </div>
              <div style={{display: 'flex', gap: '10px', marginTop: '5px'}}>
                {idEditando ? (
                   <button onClick={() => salvarTransacao()} style={{flex: 1, height: '55px', background: 'white', color: 'black', borderRadius: '16px', fontWeight: '900', border: 'none', cursor: 'pointer'}}>SALVAR ALTERAÇÃO</button>
                ) : (
                  <>
                    <button onClick={() => salvarTransacao('entrada')} style={{flex: 1, height: '55px', background: '#10b981', color: 'white', borderRadius: '16px', fontWeight: '900', border: 'none', cursor: 'pointer'}}>RECEITA</button>
                    <button onClick={() => salvarTransacao('saida')} style={{flex: 1, height: '55px', background: '#f43f5e', color: 'white', borderRadius: '16px', fontWeight: '900', border: 'none', cursor: 'pointer'}}>DESPESA</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {abaAtiva === 'extrato' && (
           <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {transacoesDoMes.length === 0 ? (
                <p style={{textAlign: 'center', color: '#475569', fontSize: '12px', marginTop: '50px'}}>Nada encontrado este mês.</p>
              ) : (
                transacoesDoMes.map(t => (
                  <div key={t.id} style={{background: '#0f172a', padding: '18px', borderRadius: '20px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                        <div style={{background: t.tipo === 'entrada' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', padding: '10px', borderRadius: '12px', color: t.tipo === 'entrada' ? '#10b981' : '#f43f5e'}}>
                          {t.tipo === 'entrada' ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}
                        </div>
                        <div>
                          <div style={{fontWeight: 'bold', fontSize: '14px', color: 'white', textTransform: 'uppercase'}}>{t.descricao}</div>
                          <div style={{fontSize: '10px', color: '#64748b', fontWeight: 'bold'}}>{t.categoria}</div>
                        </div>
                    </div>
                    <div style={{textAlign: 'right', display: 'flex', alignItems: 'center', gap: '15px'}}>
                        <div style={{fontWeight: '900', color: t.tipo === 'entrada' ? '#10b981' : '#f43f5e', fontSize: '14px'}}>
                          {t.tipo === 'entrada' ? '+' : '-'} R$ {t.valor.toLocaleString()}
                        </div>
                        <button onClick={() => { setIdEditando(t.id); setDescricao(t.descricao); setValor(t.valor.toString()); setAbaAtiva('inicio'); }} style={{background: 'none', border: 'none', color: '#475569', cursor: 'pointer'}}><Pencil size={16}/></button>
                    </div>
                  </div>
                ))
              )}
           </div>
        )}

        <nav style={{position: 'fixed', bottom: '25px', left: '50%', transform: 'translateX(-50%)', width: '92%', maxWidth: '380px', background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(15px)', border: '1px solid #1e293b', borderRadius: '30px', padding: '8px', display: 'flex', justifyContent: 'space-around', zIndex: 1000, boxShadow: '0 20px 50px rgba(0,0,0,0.6)'}}>
           <button onClick={() => setAbaAtiva('inicio')} style={{background: abaAtiva === 'inicio' ? '#7c3aed' : 'none', border: 'none', color: 'white', padding: '12px 25px', borderRadius: '22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer', transition: '0.3s'}}><LayoutGrid size={22}/><span style={{fontSize: '9px', fontWeight: '900'}}>INÍCIO</span></button>
           <button onClick={() => setAbaAtiva('extrato')} style={{background: abaAtiva === 'extrato' ? '#7c3aed' : 'none', border: 'none', color: 'white', padding: '12px 25px', borderRadius: '22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer', transition: '0.3s'}}><List size={22}/><span style={{fontSize: '9px', fontWeight: '900'}}>EXTRATO</span></button>
           <button onClick={() => setAbaAtiva('analise')} style={{background: abaAtiva === 'analise' ? '#7c3aed' : 'none', border: 'none', color: 'white', padding: '12px 25px', borderRadius: '22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer', transition: '0.3s'}}><BarChart3 size={22}/><span style={{fontSize: '9px', fontWeight: '900'}}>ANÁLISE</span></button>
        </nav>

      </div>
    </div>
  );
}