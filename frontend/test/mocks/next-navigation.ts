const push = jest.fn();
const replace = jest.fn();
const back = jest.fn();
const redirect = jest.fn();

let pathname = '/';
export const __nav = {
  push, replace, back, redirect,
  setPath: (p: string) => { pathname = p; },
  reset: () => { push.mockReset(); replace.mockReset(); back.mockReset(); redirect.mockReset(); pathname = '/'; }
};

export const useRouter = () => ({ push, replace, back, prefetch: jest.fn() });
export const usePathname = () => pathname;
export { redirect };