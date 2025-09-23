"use client";
import React, { useState } from 'react';
import { api } from '@/app/lib/api';
import { useRouter } from 'next/navigation';

export default function Register() {
  const r = useRouter();
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [name,setName]=useState('');
  const [err,setErr]=useState<string|null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    try {
      await api.auth.register({ email, password, name: name || undefined });
      // opcional: auto-login
      await api.auth.login(email, password);
      r.replace('/');
    } catch (e:any) {
      setErr(e.message || 'Error');
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto p-4 grid gap-3">
      <h1 className="text-xl">Crear cuenta</h1>
      <input className="border p-2" placeholder="Nombre (opcional)" value={name} onChange={e=>setName(e.target.value)} />
      <input className="border p-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="border p-2" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <button className="bg-black text-white px-3 py-2">Registrarme</button>
    </form>
  );
}