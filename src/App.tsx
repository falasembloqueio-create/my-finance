import { useState, useEffect } from "react";
import { Plus, Minus, Wallet, TrendingUp, TrendingDown, LogOut, Loader2, Trash2, Calendar, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { supabase } from "./supabase";

interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  categoria: string;
  created_at: string;
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  
  // Estados do Formulário
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("Geral");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (user) puxarTransacoes(); }, [user]);

  const puxarTransacoes = async () => {
    const { data, error } = await supabase
      .from("financas")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setTransacoes(data);
  };

  const adicionarTransacao = async (tipo: 'entrada' | 'saida') => {
    if (!descricao || !valor) {
      alert("Preencha descrição e valor!");
      return;
    }
    
    const { error } = await supabase.from("financas").insert([{
      descricao,
      valor: parseFloat(valor),
      tipo,
      categoria,
      user_id: user.id
    }]);

    if (!error) {
      setDescricao(""); 
      setValor("");
      puxarTransacoes();
    } else {
      alert("Erro ao salvar: " + error.message);
    }
  };

  const deletarTransacao = async (id: string) => {
    const { error } = await supabase.from("financas").delete().eq("id", id);
    if (!error) puxarTransacoes();
  };

  const totalEntradas = transacoes.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0);
  const totalSaidas = transacoes.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + t.valor, 0);
  const saldo = totalEntradas - totalSaidas;

  if (loading) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
      <Loader2 className="animate-spin text-violet-500" size={40} />
      <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Iniciando MyFinances</p>
    </div>
  );

  if (!user) return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="text-center space-y-4">
        <div className="bg-violet-500 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-violet-500/20">
          <Wallet className="text-white" size={32} />
        </div>
        <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">MyFinances</h1>
        <p className="text-slate-500 text-sm max-w-[250px]">Por favor, faça login no sistema para gerenciar suas economias.</p>
        <p className="text-xs text-violet-500 font-bold uppercase tracking-widest pt-4">Acesse via terminal/auth</p>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-lg mx-auto p-4 pb-20 md:pt-10">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-violet-600 p-2 rounded-xl shadow-lg shadow-violet-900/20"><Wallet size={20} /></div>
          <h1 className="text-lg font-black italic uppercase tracking-tighter text-white">MyFinances</h1>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-slate-500 hover:text-rose-500 transition-colors">
          <LogOut size={18} />
        </button>
      </header>

      <main className="space-y-6">
        {/* CARD DE SALDO PRINCIPAL */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={80} /></div>
          <p className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-[0.2em]">Saldo em Conta</p>
          <h2 className={`text-4xl font-black tracking-tighter ${saldo >= 0 ? 'text-white' : 'text-rose-500'}`}>
            R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h2>
          
          <div className="grid grid-cols-2 gap-6 mt-8 pt-6 border-t border-slate-800/50">
            <div className="flex items-center gap-3">
              <ArrowUpCircle className="text-emerald-500" size={20} />
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase">Entradas</p>
                <p className="text-sm font-bold text-emerald-500">+ {totalEntradas.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ArrowDownCircle className="text-rose-500" size={20} />
              <div>
                <p className="text-[8px] font-black text-slate-500 uppercase">Saídas</p>
                <p className="text-sm font-bold text-rose-500">- {totalSaidas.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* INPUT DE NOVA TRANSAÇÃO */}
        <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 space-y-4 shadow-xl">
          <input className="input-store" placeholder="O que você comprou/ganhou?" value={descricao} onChange={e => setDescricao(e.target.value)} />
          <div className="relative">
            <span className="absolute left-5 top-3.5 text-slate-600 font-bold text-sm">R$</span>
            <input className="input-store pl-12" type="number" placeholder="0,00" value={valor} onChange={e => setValor(e.target.value)} />
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button onClick={() => adicionarTransacao('entrada')} className="bg-emerald-600 hover:bg-emerald-500 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-900/20">
              <Plus size={16} /> Ganho
            </button>
            <button onClick={() => adicionarTransacao('saida')} className="bg-rose-600 hover:bg-rose-500 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-rose-900/20">
              <Minus size={16} /> Gasto
            </button>
          </div>
        </div>

        {/* HISTÓRICO */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Movimentações</p>
            <Calendar size={14} className="text-slate-700" />
          </div>
          
          <div className="space-y-2">
            {transacoes.length === 0 && <div className="text-center py-10 text-slate-700 text-xs italic">Nenhuma transação registrada.</div>}
            
            {transacoes.map(t => (
              <div key={t.id} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50 flex items-center justify-between group hover:bg-slate-900 hover:border-slate-700 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${t.tipo === 'entrada' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {t.tipo === 'entrada' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase text-slate-200 truncate">{t.descricao}</p>
                    <p className="text-[9px] font-bold text-slate-600">{new Date(t.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className={`font-black text-sm ${t.tipo === 'entrada' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {t.tipo === 'entrada' ? '+' : '-'} {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <button onClick={() => deletarTransacao(t.id)} className="p-2 text-slate-800 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}