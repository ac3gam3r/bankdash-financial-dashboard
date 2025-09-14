import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/Card";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { api.get("/api/dashboard").then(r=>setData(r.data)); }, []);
  if (!data) return <div className="p-6 text-sm text-zinc-600">Loadingâ€¦</div>;
  const fmt = (n:number) => n.toLocaleString(undefined, {style:"currency",currency:"USD"});

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 bg-zinc-50">
        <header className="sticky top-0 z-10 border-b bg-white px-6 py-3">
          <h1 className="text-lg font-semibold">Welcome Back!</h1>
          <p className="text-xs text-zinc-500">Overview of your finances</p>
        </header>
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card><p className="text-xs uppercase text-zinc-500">Net Worth</p><p className="mt-1 text-2xl font-semibold">{fmt(data.stats.netWorth)}</p></Card>
            <Card><p className="text-xs uppercase text-zinc-500">Total Assets</p><p className="mt-1 text-2xl font-semibold text-emerald-600">{fmt(data.stats.totalAssets)}</p></Card>
            <Card><p className="text-xs uppercase text-zinc-500">Credit Card Debt</p><p className="mt-1 text-2xl font-semibold text-rose-600">{fmt(data.stats.creditCardDebt)}</p></Card>
            <Card><p className="text-xs uppercase text-zinc-500">Accounts</p><p className="mt-1 text-2xl font-semibold">{data.stats.accountsCount}</p></Card>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Recent Transactions" className="lg:col-span-2">
              <table className="w-full text-sm">
                <thead className="text-left text-zinc-500"><tr><th className="py-2">Date</th><th>Description</th><th className="text-right">Amount</th></tr></thead>
                <tbody>
                  {data.transactions.map((t:any) => (
                    <tr key={t.id} className="border-t">
                      <td className="py-2">{t.date}</td>
                      <td>{t.description}</td>
                      <td className={`text-right ${t.amount<0?"text-rose-600":"text-emerald-600"}`}>{t.amount<0?"-":""}{fmt(Math.abs(t.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Card title="Quick Actions">
              <div className="grid grid-cols-2 gap-3">
                {["Transactions","Accounts","Bonuses"].map((a) => (
                  <a key={a} href={`/${a.toLowerCase()}`} className="rounded-xl border px-3 py-2 text-sm hover:bg-zinc-50">{a}</a>
                ))}
                <a href="/api/transactions/export.csv" className="rounded-xl border px-3 py-2 text-sm hover:bg-zinc-50">Export CSV</a>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}