import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/Card";

type Bonus = { id:number; bank:string; title:string; amount:number; status:"planning"|"active"|"earned"; openedAt?:string; deadline?:string; notes?:string };

export default function BonusesPage() {
  const [rows, setRows] = useState<Bonus[]>([]);
  const [form, setForm] = useState<Partial<Bonus>>({ status:"planning", amount:0 });

  const load = async () => { const { data } = await api.get("/api/bonuses"); setRows(data); };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (form.id) await api.put(`/api/bonuses/${form.id}`, form);
    else await api.post("/api/bonuses", form);
    setForm({ status:"planning", amount:0 });
    load();
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 bg-zinc-50">
        <header className="border-b bg-white px-6 py-3"><h1 className="text-lg font-semibold">Bank Bonuses</h1></header>
        <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
          <Card title="Add / Edit">
            <div className="grid gap-3 md:grid-cols-6">
              <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Bank" value={form.bank ?? ""} onChange={e=>setForm({...form, bank:e.target.value})}/>
              <input className="rounded-lg border px-3 py-2 text-sm md:col-span-2" placeholder="Title" value={form.title ?? ""} onChange={e=>setForm({...form, title:e.target.value})}/>
              <select className="rounded-lg border px-3 py-2 text-sm" value={form.status} onChange={e=>setForm({...form, status: e.target.value as any})}>
                {["planning","active","earned"].map(s => <option key={s}>{s}</option>)}
              </select>
              <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Amount" value={form.amount ?? 0} onChange={e=>setForm({...form, amount:Number(e.target.value)})}/>
              <input type="date" className="rounded-lg border px-3 py-2 text-sm" value={form.openedAt ?? ""} onChange={e=>setForm({...form, openedAt:e.target.value})}/>
              <input type="date" className="rounded-lg border px-3 py-2 text-sm" value={form.deadline ?? ""} onChange={e=>setForm({...form, deadline:e.target.value})}/>
              <input className="rounded-lg border px-3 py-2 text-sm md:col-span-6" placeholder="Notes" value={form.notes ?? ""} onChange={e=>setForm({...form, notes:e.target.value})}/>
            </div>
            <div className="mt-3"><button onClick={save} className="rounded-lg bg-black px-3 py-2 text-sm text-white">{form.id?"Update":"Save"}</button></div>
          </Card>

          {(["planning","active","earned"] as const).map(status => (
            <Card key={status} title={status.toUpperCase()}>
              <div className="grid gap-3 md:grid-cols-3">
                {rows.filter(b => b.status===status).map(b => (
                  <div key={b.id} className="rounded-xl border p-3 text-sm">
                    <div className="font-medium">{b.bank} â€” {b.title}</div>
                    <div className="text-zinc-500">Amount: ${b.amount}</div>
                    {b.openedAt && <div className="text-zinc-500">Opened: {b.openedAt}</div>}
                    {b.deadline && <div className="text-zinc-500">Deadline: {b.deadline}</div>}
                    {b.notes && <div className="text-zinc-500">{b.notes}</div>}
                    <div className="mt-2 flex gap-2">
                      <button className="rounded-lg border px-2 py-1" onClick={()=>setForm(b)}>Edit</button>
                      <button className="rounded-lg border px-2 py-1" onClick={async()=>{ await api.put(`/api/bonuses/${b.id}`, { ...b, status: b.status==="active"?"earned":"active" }); load(); }}>
                        {b.status==="active" ? "Mark Earned" : "Activate"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </main>
      </div>
    </div>
  );
}
