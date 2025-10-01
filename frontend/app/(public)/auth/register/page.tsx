"use client";
import React, { useState } from 'react';
import { api } from '@/app/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const r = useRouter();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [name,setName]=useState("");
  const [err,setErr]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setLoading(true);
    try {
      await api.auth.register({ email, password, name: name || undefined });
      await api.auth.login(email, password); // auto-login
      r.replace("/");
    } catch (e:any) {
      setErr(e.message || "Error");
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto p-4 grid gap-3">
      <h1 className="text-xl">Crear cuenta</h1>
      <input className="border p-2" placeholder="Nombre (opcional)"
        value={name} onChange={e=>setName(e.target.value)} autoComplete="name" />
      <input className="border p-2" placeholder="Email" type="email"
        value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" />
      <input className="border p-2" placeholder="Password" type="password"
        value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" />
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <button disabled={loading} className="bg-black text-white px-3 py-2 disabled:opacity-50">
        {loading ? "Creando..." : "Registrarme"}
      </button>
      <p className="text-sm text-gray-600">
        ¿Ya tenés cuenta?{" "}
        <Link href="/auth/login" className="underline">Iniciá sesión</Link>
      </p>
    </form>
  );
}