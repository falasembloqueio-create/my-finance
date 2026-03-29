import { useState, useEffect } from "react";
import { Plus, Minus, Wallet, TrendingUp, TrendingDown, LogOut, Loader2, Trash2, Tag, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
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
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoriaCadastro, setCategoriaCadastro] = useState("Geral");
  const [filtroAtivo, setFiltroAtivo] = useState("Todas");

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

  const adicionarTransacao = async (tipo: 'entrada' | 'saida') => {
    if (!descricao || !valor) return;
    const { error } = await supabase.from("financas").insert([{
      descricao,
      valor: parseFloat(valor),
      tipo,
      categoria: categoriaCadastro,
      user_id: user?.id
    }]);
    if (!error) { 
      setDescricao(""); 
      setValor(""); 
      setCategoriaCadastro("Geral"); 
      puxarTransacoes(); 
    }
  };

  const deletarTransacao = async (id: string) => {
    const { error } = await supabase.from("financas").delete().eq("id", id);
    if (!error) puxarTransacoes();
  };

  const totalEntradas = transacoes.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0);
  const totalSaidas = transacoes.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + t.valor, 0);
  const saldo = totalEntradas - totalSaidas;
  const porcentagemGasto = totalEntradas > 0 ? Math.min((totalSaidas / totalEntradas) * 100, 100) : 0;

  const transacoesFiltradas = filtroAtivo === "Todas" 
    ? transacoes 
    : transacoes.filter(t => t.categoria === filtroAtivo);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950 gap-4 text-violet-500">
      <Loader2 className="animate-spin" size={40} />
      <span className="text-[10px] font-black uppercase tracking-widest">Carregando...</span>
    </div>
  );

  if (!user) return <div className="h-screen flex items-center justify-center bg-slate-950 text-white font-bold">Acesse sua conta para continuar.</div>;

  return (
    <div className="flex justify-center w-full min-h-screen bg-slate-950 text-slate-200">
      <div className="w-full max-w-md p-6 flex flex-col gap-6">
        
        <header className="flex justify-between items-center py-2">
          <div className="flex items-center gap-2">
            <div className="bg-violet-600 p-2 rounded-lg text-white shadow-lg shadow-violet-900/40"><Wallet size={20} /></div>
            <h1 className="text-xl font-black italic uppercase tracking-tighter">MyFinances</h1>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-slate-600 hover:text-rose-500 transition-all active:scale-90">
            <LogOut size={20} />
          </button>
        </header>

        <div className="bg-slate-900 p-7 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-6">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Saldo Total</p>
            <h2 className={`text-4xl font-black tracking-tight ${saldo >= 0 ? 'text-white' : 'text-rose-500'}`}>
              R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h2>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-black uppercase text-slate-500 px-1">
              <span>Saúde Financeira</span>
              <span>{porcentagemGasto.toFixed(0)}%</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div className={`h-full transition-all duration-1000 ${porcentagemGasto > 80 ? 'bg-rose-500' : 'bg-violet-500'}`} style={{ width: `${porcentagemGasto}%` }} />
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="text-emerald-500" size={16} />
              <p className="text-sm font-bold text-emerald-500">+{totalEntradas.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-rose-500">-{totalSaidas.toFixed(2)}</p>
              <ArrowDownCircle className="text-rose-500" size={16} />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-xl space-y-4">
          <input className="input-store" placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input-store" type="number" placeholder="Valor" value={valor} onChange={e => setValor(e.target.value)} />
            <select className="input-store bg-slate-950 text-slate-300" value={categoriaCadastro} onChange={(e) => setCategoriaCadastro(e.target.value)}>
              {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => adicionarTransacao('entrada')} className="bg-emerald-600 h-12 rounded-xl font-black uppercase text-[10px] text-white flex items-center justify-center gap-2 active:scale-95 transition-all">
              <Plus size={14} /> Ganho
            </button>
            <button onClick={() => adicionarTransacao('saida')} className="bg-rose-600 h-12 rounded-xl font-black uppercase text-[10px] text-white flex items-center justify-center gap-2 active:scale-95 transition-all">
              <Minus size={14} /> Gasto
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {["Todas", ...CATEGORIAS].map(cat => (
            <button key={cat} onClick={() => setFiltroAtivo(cat)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase whitespace-nowrap transition-all border ${filtroAtivo === cat ? 'bg-violet-600 border-violet-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-3 pb-10">
          {transacoesFiltradas.length === 0 && <p className="text-center py-10 text-slate-700 text-[10px] font-black uppercase italic">Vazio em {filtroAtivo}</p>}
          
          {transacoesFiltradas.map(t => (
            <div key={t.id} className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 flex items-center justify-between group hover:bg-slate-900 transition-all">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${t.tipo === 'entrada' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  {t.tipo === 'entrada' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold uppercase text-slate-200">{t.descricao}</p>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Tag size={10} />
                    <p className="text-[9px] font-black uppercase">{t.categoria}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className={`font-black text-sm tabular-nums ${t.tipo === 'entrada' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {t.tipo === 'entrada' ? '+' : '-'} {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <button onClick={() => deletarTransacao(t.id)} className="text-slate-800 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 active:scale-75">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}