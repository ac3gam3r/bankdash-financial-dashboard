import { useState } from "react";
import { api } from "@/lib/api";

export default function Login() {
  const [email, setEmail] = useState("demo@bankdash.app");
  const [password, setPassword] = useState("secret123");
  const [err, setErr] = useState<string | null>(null);

  const submit = async (path: "login" | "register") => {
    setErr(null);
    try {
      const { data } = await api.post(`/api/auth/${path}`, { email, password });
      localStorage.setItem("token", data.token);
      window.location.href = "/";
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? "Failed");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-zinc-50">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold">BankDash — Sign in</h1>
        <div className="mt-4 space-y-3">
          <input className="w-full rounded-lg border px-3 py-2 text-sm" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
          <input className="w-full rounded-lg border px-3 py-2 text-sm" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
          {err && <p className="text-sm text-rose-600">{err}</p>}
          <div className="flex gap-2">
            <button onClick={()=>submit("login")} className="rounded-lg bg-black px-3 py-2 text-sm text-white">Login</button>
            <button onClick={()=>submit("register")} className="rounded-lg border px-3 py-2 text-sm">Register</button>
          </div>
        </div>
      </div>
    </div>
  );
}
