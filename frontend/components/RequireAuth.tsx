"use client";
import { useEffect, useState } from 'react';
import { api } from '@/app/lib/api';
import { useRouter } from 'next/navigation';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [ok,setOk]=useState(false);
  const r = useRouter();
  useEffect(() => {
    api.auth.me().then(()=>setOk(true)).catch(()=>r.replace('/auth/login'));
  }, [r]);
  if (!ok) return null;
  return <>{children}</>;
}