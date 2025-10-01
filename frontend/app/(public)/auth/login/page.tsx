"use client";
import React, { useState } from 'react';
import { api } from '@/app/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [email,setEmail]=useState("test@example.com");
  const [password,setPassword]=useState("secret");
  const [err,setErr]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);
  const r = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setLoading(true);
    try { await api.auth.login(email,password); r.push("/"); }
    catch (e:any){ setErr(e.message || "Error"); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto p-4 grid gap-3">
      <h1 className="text-xl">Entrar</h1>
      <input value={email} onChange={e=>setEmail(e.target.value)}
        className="border p-2" placeholder="Email" type="email" autoComplete="email" />
      <input value={password} onChange={e=>setPassword(e.target.value)}
        type="password" className="border p-2" placeholder="Password" autoComplete="current-password" />
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <button disabled={loading} className="bg-black text-white px-3 py-2 disabled:opacity-50">
        {loading ? "Ingresando..." : "Entrar"}
      </button>
      <p className="text-sm text-gray-600">
        ¿No tenés cuenta?{" "}
        <Link href="/auth/register" className="underline">Crear cuenta</Link>
      </p>
    </form>
  );
}