"use client";
import React, { useState } from 'react';
import { api } from '@/app/lib/api';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email,setEmail]=useState('test@example.com');
  const [password,setPassword]=useState('secret');
  const [err,setErr]=useState<string|null>(null);
  const r = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    try { await api.auth.login(email,password); r.push('/'); } 
    catch (e:any){ setErr(e.message); }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto p-4 grid gap-3">
      <input value={email} onChange={e=>setEmail(e.target.value)} className="border p-2" placeholder="Email" />
      <input value={password} onChange={e=>setPassword(e.target.value)} type="password" className="border p-2" placeholder="Password" />
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <button className="bg-black text-white px-3 py-2">Entrar</button>
    </form>
  );
}