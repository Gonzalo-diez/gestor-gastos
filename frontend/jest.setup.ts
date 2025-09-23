import '@testing-library/jest-dom';
import 'whatwg-fetch';

process.env.NEXT_PUBLIC_API_URL = 'http://localhost';

let server: any;
beforeAll(async () => {
  ({ server } = await import('./test/msw/server'));
  server.listen();
});
afterEach(() => server?.resetHandlers());
afterAll(() => server?.close());

(global as any).ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};