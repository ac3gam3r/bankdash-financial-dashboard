import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/Card";

type Account = { id:number; name:string; type:string; last4?:string; balance:number; institution?:string };

export default function AccountsPage() {
  const [rows, setRows] = useState<Account[]>([]);
  const [form, setForm] = useState<Partial<Account>>({ type:"checking", balance:0 });

  const load = async () => { const { data } = await api.get("/api/accounts"); setRows(data); };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (form.id) await api.put(`/api/accounts/${form.id}`, form);
    else await api.post("/api/accounts", form);
    setForm({ type:"checking", balance:0 });
    load();
  };
  const edit = (a: Account) => setForm(a);
  const del = async (id:number) => { await api.delete(`/api/accounts/${id}`); load(); };

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 bg-zinc-50">
        <header className="border-b bg-white px-6 py-3"><h1 className="text-lg font-semibold">Accounts</h1></header>
        <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
          <Card title="New / Edit Account">
            <div className="grid gap-3 md:grid-cols-5">
              <input className="rounded-lg border px-3 py-2 text-sm md:col-span-2" placeholder="Name" value={form.name ?? ""} onChange={e=>setForm({...form, name:e.target.value})}/>
              <select className="rounded-lg border px-3 py-2 text-sm" value={form.type} onChange={e=>setForm({...form, type:e.target.value})}>
                {["checking","savings","credit","investment"].map(t => <option key={t}>{t}</option>)}
              </select>
              <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Last4" value={form.last4 ?? ""} onChange={e=>setForm({...form, last4:e.target.value})}/>
              <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Institution" value={form.institution ?? ""} onChange={e=>setForm({...form, institution:e.target.value})}/>
              <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Balance" value={form.balance ?? 0} onChange={e=>setForm({...form, balance:Number(e.target.value)})}/>
            </div>
            <div className="mt-3">
              <button onClick={save} className="rounded-lg bg-black px-3 py-2 text-sm text-white">{form.id ? "Update" : "Create"}</button>
              {form.id && <button onClick={()=>setForm({ type:"checking", balance:0 })} className="ml-2 rounded-lg border px-3 py-2 text-sm">Cancel</button>}
            </div>
          </Card>

          <Card title="Accounts">
            <table className="w-full text-sm">
              <thead className="text-left text-zinc-500"><tr><th>Name</th><th>Type</th><th>Last4</th><th>Institution</th><th className="text-right">Balance</th><th></th></tr></thead>
              <tbody>
                {rows.map(a => (
                  <tr key={a.id} className="border-t">
                    <td className="py-2">{a.name}</td><td>{a.type}</td><td>{a.last4}</td><td>{a.institution}</td>
                    <td className={`text-right ${a.type==="credit"?"text-rose-600":"text-emerald-600"}`}>{a.balance.toLocaleString(undefined,{style:"currency",currency:"USD"})}</td>
                    <td className="text-right">
                      <button className="rounded-lg border px-2 py-1 mr-2" onClick={()=>edit(a)}>Edit</button>
                      <button className="rounded-lg border px-2 py-1" onClick={()=>del(a.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </main>
      </div>
    </div>
  );
}
