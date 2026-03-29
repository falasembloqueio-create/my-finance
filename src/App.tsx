import { useState, useEffect } from "react";
import { 
  Wallet, TrendingUp, TrendingDown, LogOut, Trash2, Tag, 
  ArrowUpCircle, ArrowDownCircle, PieChart, Lock, Mail, 
  LayoutGrid, List, Plus, Minus, BarChart3 
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
  const [abaAtiva, setAbaAtiva] = useState<'inicio' | 'extrato' | 'analise'>('inicio');
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoriaCadastro, setCategoriaCadastro] = useState("Geral");
  const [filtroAtivo, setFiltroAtivo] = useState("Todas");
  const [erro, setErro] = useState(false);

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

  const puxarTransacoes = async () => {
    const { data, error } = await supabase.from("financas").select("*").order("created_at", { ascending: false });
    if (!error && data) setTransacoes(data);
  };

  const handleAuth = async () => {
    setLoading(true);
    const { error } = isRegistering 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  const adicionarTransacao = async (tipo: 'entrada' | 'saida') => {
    if (!descricao || !valor || parseFloat(valor) <= 0) {
      setErro(true);
      setTimeout(() => setErro(false), 500);
      return;
    }
    const { error } = await supabase.from("financas").insert([{
      descricao, valor: parseFloat(valor), tipo, categoria: categoriaCadastro, user_id: user?.id
    }]);
    if (!error) { setDescricao(""); setValor(""); puxarTransacoes(); }
  };

  const deletarTransacao = async (id: string) => {
    if (!confirm("Remover este registro?")) return;
    const { error } = await supabase.from("financas").delete().eq("id", id);
    if (!error) puxarTransacoes();
  };

  const totalEntradas = transacoes.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0);
  const totalSaidas = transacoes.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + t.valor, 0);
  const saldo = totalEntradas - totalSaidas;
  const transacoesFiltradas = filtroAtivo === "Todas" ? transacoes : transacoes.filter(t => t.categoria === filtroAtivo);

  const gastosPorCategoria = CATEGORIAS.map(cat => {
    const total = transacoes
      .filter(t => t.tipo === 'saida' && t.categoria === cat)
      .reduce((acc, t) => acc + t.valor, 0);
    return { nome: cat, valor: total };
  }).filter(c => c.valor > 0).sort((a, b) => b.valor - a.valor);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950 text-violet-500 font-black animate-pulse text-[10px] uppercase tracking-widest">Sincronizando...</div>;

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 p-6">
        <div className="w-full max-w-sm space-y-8 bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="bg-violet-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg"><Wallet size={24} /></div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">MyFinances</h2>
          </div>
          <div className="space-y-4">
            <input className="input-store bg-slate-950" type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="input-store bg-slate-950" type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} />
            <button onClick={handleAuth} className="w-full bg-violet-600 h-14 rounded-2xl font-black uppercase text-[10px] text-white">Entrar</button>
          </div>
          <button onClick={() => setIsRegistering(!isRegistering)} className="w-full text-[9px] font-black uppercase text-slate-600 underline">Alternar Login/Cadastro</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full min-h-screen bg-slate-950 text-slate-200 font-sans pb-32">
      <div className="w-full max-w-md flex flex-col gap-6 p-6">
        
        <header className="flex justify-between items-center py-2">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 p-2 rounded-xl text-white shadow-lg"><Wallet size={20} /></div>
            <h1 className="text-sm font-bold text-white uppercase tracking-tighter">MyFinances</h1>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="p-2 text-slate-600 hover:text-rose-500 transition-all"><LogOut size={20} /></button>
        </header>

        {abaAtiva === 'inicio' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-[2rem] border shadow-lg" style={{ backgroundColor: '#0f172a', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                <p className="text-[9px] font-black uppercase text-slate-500 mb-1">Ganhos</p>
                <p className="text-lg font-black" style={{ color: '#10b981' }}>R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-5 rounded-[2rem] border shadow-lg" style={{ backgroundColor: '#0f172a', borderColor: 'rgba(244, 63, 94, 0.2)' }}>
                <p className="text-[9px] font-black uppercase text-slate-500 mb-1">Gastos</p>
                <p className="text-lg font-black" style={{ color: '#f43f5e' }}>R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 text-center shadow-2xl">
               <p className="text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest">Saldo Total</p>
               <h2 className="text-5xl font-black tracking-tighter" style={{ color: saldo >= 0 ? '#ffffff' : '#f43f5e' }}>
                 R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
               </h2>
            </div>

            <div className={`bg-slate-900 p-6 rounded-[2rem] border ${erro ? 'border-rose-500 animate-shake' : 'border-slate-800'} space-y-4 shadow-xl`}>
              <input className="input-store bg-slate-950 border-slate-800" placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <input className="input-store bg-slate-950 border-slate-800" type="number" placeholder="0.00" value={valor} onChange={e => setValor(e.target.value)} />
                <select className="input-store bg-slate-950 border-slate-800 text-[10px] font-black uppercase" value={categoriaCadastro} onChange={(e) => setCategoriaCadastro(e.target.value)}>
                  {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => adicionarTransacao('entrada')} className="bg-emerald-600 h-14 rounded-2xl font-black uppercase text-[10px] text-white shadow-lg active:scale-95 transition-all">Ganho</button>
                <button onClick={() => adicionarTransacao('saida')} className="bg-rose-600 h-14 rounded-2xl font-black uppercase text-[10px] text-white shadow-lg active:scale-95 transition-all">Gasto</button>
              </div>
            </div>
          </div>
        )}

        {abaAtiva === 'extrato' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {["Todas", ...CATEGORIAS].map(cat => (
                <button key={cat} onClick={() => setFiltroAtivo(cat)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase border transition-all ${filtroAtivo === cat ? 'bg-violet-600 border-violet-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>{cat}</button>
              ))}
            </div>
            <div className="grid gap-3">
              {transacoesFiltradas.map(t => (
                <div key={t.id} className="bg-slate-900/40 p-5 rounded-[1.5rem] border border-slate-800/50 flex justify-between items-center group hover:bg-slate-900 transition-all">
                  <div className="text-left flex items-center gap-4">
                    <div className="p-3 rounded-2xl" style={{ backgroundColor: t.tipo === 'entrada' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', color: t.tipo === 'entrada' ? '#10b981' : '#f43f5e' }}>
                      {t.tipo === 'entrada' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200 uppercase">{t.descricao}</p>
                      <p className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">{t.categoria}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-black text-sm tabular-nums" style={{ color: t.tipo === 'entrada' ? '#10b981' : '#f43f5e' }}>
                      {t.tipo === 'entrada' ? '+' : '-'} {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <button onClick={() => deletarTransacao(t.id)} className="text-slate-800 hover:text-rose-500 transition-all active:scale-75"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {abaAtiva === 'analise' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center px-2">
              <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-8">Raio-X de Gastos</h3>
              {gastosPorCategoria.length === 0 ? (
                <div className="py-20 flex flex-col items-center opacity-20"><PieChart size={40} /><p className="text-[10px] uppercase font-black mt-4">Sem dados</p></div>
              ) : (
                <div className="space-y-6">
                  {gastosPorCategoria.map(g => {
                    const perc = (g.valor / totalSaidas) * 100;
                    return (
                      <div key={g.nome} className="space-y-2 text-left">
                        <div className="flex justify-between items-end px-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{g.nome}</p>
                          <p className="text-[10px] font-black text-white">R$ {g.valor.toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className="h-full transition-all duration-1000" 
                            style={{ 
                              width: `${perc}%`,
                              background: 'linear-gradient(90deg, #7c3aed 0%, #d946ef 100%)' 
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-xs bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-2 rounded-3xl flex justify-between items-center shadow-2xl z-50">
          <button onClick={() => setAbaAtiva('inicio')} className={`flex-1 flex flex-col items-center py-2 rounded-2xl transition-all ${abaAtiva === 'inicio' ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-slate-500'}`}>
            <LayoutGrid size={20} /><span className="text-[8px] font-black uppercase mt-1">Início</span>
          </button>
          <button onClick={() => setAbaAtiva('extrato')} className={`flex-1 flex flex-col items-center py-2 rounded-2xl transition-all ${abaAtiva === 'extrato' ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-slate-500'}`}>
            <List size={20} /><span className="text-[8px] font-black uppercase mt-1">Extrato</span>
          </button>
          <button onClick={() => setAbaAtiva('analise')} className={`flex-1 flex flex-col items-center py-2 rounded-2xl transition-all ${abaAtiva === 'analise' ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-slate-500'}`}>
            <BarChart3 size={20} /><span className="text-[8px] font-black uppercase mt-1">Análise</span>
          </button>
        </nav>

      </div>
    </div>
  );
}