const API = process.env.NEXT_PUBLIC_API_URL;
let access: string | null = null;
export const setAccess = (t: string | null) => (access = t);

const qs = (q: Record<string,string|number|boolean>) =>
  new URLSearchParams(Object.fromEntries(Object.entries(q).map(([k,v])=>[k,String(v)])));

async function call(path: string, init: RequestInit = {}, retry = true) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
      ...(init.headers || {}),
    },
    credentials: 'include', // usa cookie refresh del backend
  });
  if (res.status === 401 && retry) {
    const r = await fetch(`${API}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (r.ok) {
      const { access: a } = await r.json();
      setAccess(a);
      return call(path, init, false);
    }
  }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  auth: {
    register: (d: { email: string; password: string; name?: string }) =>
      call('/auth/register', { method: 'POST', body: JSON.stringify(d) }),
    login: (email: string, password: string) =>
      call('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
        .then(({ access }) => { setAccess(access); return true; }),
    me: () => call('/auth/me'),
    logout: () => call('/auth/logout', { method: 'POST' }).finally(() => setAccess(null)),
  },
  currencies: { list: () => call('/currencies') },
  accounts: {
    list: () => call('/accounts'),
    create: (d: { name: string; currencyCode: string }) =>
      call('/accounts', { method: 'POST', body: JSON.stringify(d) }),
    update: (id: string, d: { name?: string; currencyCode?: string }) =>
      call(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
    remove: (id: string) =>
      call(`/accounts/${id}`, { method: 'DELETE' }),
  },
  categories: {
    list: () => call('/categories'),
    create: (d: { name: string; type: 'INCOME'|'EXPENSE' }) =>
      call('/categories', { method: 'POST', body: JSON.stringify(d) }),
    update: (id: string, d: Partial<{ name: string; type: 'INCOME'|'EXPENSE' }>) =>
      call(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
    remove: (id: string) => call(`/categories/${id}`, { method: 'DELETE' }),
  },
  budgets: {
    list: (q: Record<string,string> = {}) =>
      call(`/budgets?${new URLSearchParams(q)}`),
    create: (d: { categoryId: string; period: string; amount: number }) =>
      call('/budgets', { method: 'POST', body: JSON.stringify(d) }),
    update: (id: string, d: Partial<{ period: string; amount: number }>) =>
      call(`/budgets/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
    remove: (id: string) => call(`/budgets/${id}`, { method: 'DELETE' }),
  },
  transactions: {
    list: async (q: Record<string, string|number|boolean> = {}) => {
      const res = await call(`/transactions?${new URLSearchParams(q as any)}`);
      return Array.isArray(res) ? res : (res?.items ?? []); // <- normaliza a []
    },
    create: (d: { accountId: string; categoryId: string; date: string; amount: number; note?: string }) =>
      call('/transactions', { method: 'POST', body: JSON.stringify(d) }),
    update: (id: string, d: Partial<{ accountId: string; categoryId: string; date: string; amount: number; note?: string }>) =>
      call(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
    remove: (id: string) => call(`/transactions/${id}`, { method: 'DELETE' }),
  },
  reports: {
    summary: (q: Record<string,string>) => call(`/reports/summary?${new URLSearchParams(q)}`),
    cashflow: (q: Record<string,string|number|boolean>) => call(`/reports/cashflow?${qs(q)}`),
    top:      (q: Record<string,string|number|boolean>) => call(`/reports/top-categories?${qs(q)}`),
  },
  imports: {
    preview: async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);

      const doReq = () =>
        fetch(`${API}/imports/preview`, {
          method: 'POST',
          body: fd,
          credentials: 'include',
          headers: access ? { Authorization: `Bearer ${access}` } : {},
        });

      let res = await doReq();

      if (res.status === 401) {
        const r = await fetch(`${API}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (r.ok) {
          const { access: a } = await r.json();
          setAccess(a);
          res = await doReq();
        }
      }

      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },

    confirm: (d: any) =>
      call('/imports/confirm', { method: 'POST', body: JSON.stringify(d) }),
  },
};