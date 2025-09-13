import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/Card";

type Tx = { id:number; accountId:number; date:string; description:string; amount:number; categoryId?:number; notes?:string };

export default function TransactionsPage() {
  const [rows, setRows] = useState<Tx[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [min, setMin] = useState<string>("");
  const [max, setMax] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const qs = useMemo(() => ({ search, categoryId, min, max, from, to, page, pageSize }), [search,categoryId,min,max,from,to,page,pageSize]);

  useEffect(() => {
    const p = new URLSearchParams(Object.entries(qs).filter(([,_v])=>String(_v)));
    api.get(`/api/transactions?${p.toString()}`).then(r => { setRows(r.data.rows); setTotal(r.data.total); });
  }, [qs]);

  const fmt = (n:number) => n.toLocaleString(undefined, { style:"currency", currency:"USD" });

  const importCsv = async (file: File) => {
    const text = await file.text();
    await api.post("/api/transactions/import.csv", { csv: text });
    setPage(1);
    const p = new URLSearchParams(Object.entries(qs).filter(([,_v])=>String(_v)));
    api.get(`/api/transactions?${p.toString()}`).then(r => { setRows(r.data.rows); setTotal(r.data.total); });
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 bg-zinc-50">
        <header className="border-b bg-white px-6 py-3">
          <h1 className="text-lg font-semibold">Transactions</h1>
        </header>
        <main className="mx-auto max-w-7xl space-y-4 px-4 py-6">
          <Card title="Filters">
            <div className="grid gap-3 md:grid-cols-6">
              <input className="rounded-lg border px-3 py-2 text-sm md:col-span-2" placeholder="Search description…" value={search} onChange={e=>{setSearch(e.target.value); setPage(1);}} />
              <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Category ID" value={categoryId} onChange={e=>{setCategoryId(e.target.value); setPage(1);}} />
              <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Min $" value={min} onChange={e=>{setMin(e.target.value); setPage(1);}} />
              <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Max $" value={max} onChange={e=>{setMax(e.target.value); setPage(1);}} />
              <input type="date" className="rounded-lg border px-3 py-2 text-sm" value={from} onChange={e=>{setFrom(e.target.value); setPage(1);}} />
              <input type="date" className="rounded-lg border px-3 py-2 text-sm" value={to} onChange={e=>{setTo(e.target.value); setPage(1);}} />
            </div>
          </Card>

          <Card title="Actions">
            <div className="flex flex-wrap gap-3">
              <a className="rounded-lg border px-3 py-2 text-sm" href="/api/transactions/export.csv">Export CSV</a>
              <label className="rounded-lg border px-3 py-2 text-sm cursor-pointer">
                Import CSV<input type="file" accept=".csv,text/csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) importCsv(f); }} />
              </label>
            </div>
          </Card>

          <Card title="Results">
            <table className="w-full text-sm">
              <thead className="text-left text-zinc-500">
                <tr><th className="py-2">Date</th><th>Description</th><th>Account</th><th className="text-right">Amount</th></tr>
              </thead>
              <tbody>
                {rows.map(t => (
                  <tr key={t.id} className="border-t">
                    <td className="py-2">{t.date}</td>
                    <td>{t.description}</td>
                    <td>{t.accountId}</td>
                    <td className={`text-right ${t.amount<0?"text-rose-600":"text-emerald-600"}`}>{t.amount<0?"-":""}{fmt(Math.abs(t.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span>Total: {total.toLocaleString()}</span>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border px-2 py-1" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button>
                <span>Page {page}</span>
                <button className="rounded-lg border px-2 py-1" disabled={rows.length<pageSize} onClick={()=>setPage(p=>p+1)}>Next</button>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
