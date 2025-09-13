import { Link, useLocation } from "react-router-dom";

const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/transactions", label: "Transactions" },
  { to: "/accounts", label: "Accounts" },
  { to: "/bonuses", label: "Bonuses" },
];

export default function Sidebar() {
  const loc = useLocation();
  return (
    <aside className="hidden md:flex w-64 flex-col gap-1 border-r bg-white p-3">
      <div className="px-2 py-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">BankDash</div>
      {nav.map(n => {
        const active = loc.pathname === n.to;
        return (
          <Link key={n.to} to={n.to}
            className={`rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 ${active ? "bg-zinc-100 font-medium" : ""}`}>
            {n.label}
          </Link>
        );
      })}
      <button onClick={()=>{ localStorage.removeItem("token"); window.location.href="/login";}}
        className="mt-auto rounded-lg border px-3 py-2 text-sm">Logout</button>
    </aside>
  );
}
