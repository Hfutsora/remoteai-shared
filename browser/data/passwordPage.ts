import type { Login } from './model';

interface PageOptions { action: 'install' | 'take' | 'fill'; login?: Login; native?: boolean; desktop?: boolean }
/** Serialized into an unprivileged page. Keep every helper inside this function. */
export function passwordPage(options: PageOptions): unknown {
  if (window.top !== window || location.protocol !== 'https:') return null;
  const page = window as Window & { __remoteaiLogin?: { installed: boolean; pending: Login | null };
    chrome?: { webview?: { postMessage: (value: unknown) => void } };
    ReactNativeWebView?: { postMessage: (value: string) => void } };
  const inputs = (form: HTMLFormElement) => Array.from(form.querySelectorAll<HTMLInputElement>('input'))
    .filter(input => !input.disabled && input.type !== 'hidden' && input.getClientRects().length > 0);
  const username = (fields: HTMLInputElement[]) => fields.find(input => input.autocomplete === 'username')
    ?? fields.find(input => input.type === 'email')
    ?? fields.find(input => ['text', 'tel'].includes(input.type));
  const safeForm = (form: HTMLFormElement) => new URL(form.action || location.href, location.href).origin === location.origin;
  if (options.action === 'install') {
    if (page.__remoteaiLogin?.installed) return true;
    page.__remoteaiLogin = { installed: true, pending: null };
    document.addEventListener('submit', event => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !event.isTrusted || !safeForm(form)) return;
      const fields = inputs(form), password = fields.find(input => input.type === 'password');
      if (!password?.value || password.value.length > 4096) return;
      const login = { origin: location.origin, username: username(fields)?.value.slice(0, 512) ?? '',
        password: password.value };
      if (options.native) page.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'browser-login', login }));
      // Wry's existing WebView2 listener expects string messages; preserve that shared bridge contract.
      else if (options.desktop && page.chrome?.webview) {
        page.chrome.webview.postMessage(JSON.stringify({ type: 'browser-login', login }));
      }
      else if (page.__remoteaiLogin) page.__remoteaiLogin.pending = login;
    }, true);
    return true;
  }
  if (options.action === 'take') {
    const login = page.__remoteaiLogin?.pending;
    if (page.__remoteaiLogin) page.__remoteaiLogin.pending = null;
    return login ?? null;
  }
  const login = options.login;
  if (!login || login.origin !== location.origin) return false;
  const form = Array.from(document.forms).find(form => safeForm(form)
    && inputs(form).some(input => input.type === 'password' && input.autocomplete !== 'new-password'));
  if (!form) return false;
  const fields = inputs(form), password = fields.find(input => input.type === 'password');
  const set = (input: HTMLInputElement | undefined, value: string) => {
    if (!input) return;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };
  set(username(fields), login.username); set(password, login.password);
  return true;
}
