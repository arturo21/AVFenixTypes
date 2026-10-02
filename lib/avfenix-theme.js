/**
 * AVFenix Theme & Design System Engine v1.0.0
 * Gestor de Tematización, Modo Oscuro/Claro y Tokens de Diseño para avfenix-ui
 */

class AVFenixThemeProvider {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'avfenix-theme';
    this.defaultTheme = options.defaultTheme || 'system';
    this.listeners = new Set();

    // Paletas de tokens por defecto (CSS Variables)
    this.tokens = {
      light: {
        '--avf-bg-primary': '#ffffff',
        '--avf-bg-secondary': '#f8fafc',
        '--avf-bg-card': '#ffffff',
        '--avf-text-primary': '#0f172a',
        '--avf-text-secondary': '#475569',
        '--avf-border-color': '#e2e8f0',
        '--avf-brand-primary': '#2563eb',
        '--avf-brand-hover': '#1d4ed8',
        '--avf-accent-success': '#16a34a',
        '--avf-accent-danger': '#dc2626',
        '--avf-accent-warning': '#d97706',
        '--avf-shadow': '0 4px 6px -1px rgba(0,0,0,0.1)'
      },
      dark: {
        '--avf-bg-primary': '#0f172a',
        '--avf-bg-secondary': '#1e293b',
        '--avf-bg-card': '#1e293b',
        '--avf-text-primary': '#f8fafc',
        '--avf-text-secondary': '#94a3b8',
        '--avf-border-color': '#334155',
        '--avf-brand-primary': '#3b82f6',
        '--avf-brand-hover': '#60a5fa',
        '--avf-accent-success': '#22c55e',
        '--avf-accent-danger': '#ef4444',
        '--avf-accent-warning': '#f59e0b',
        '--avf-shadow': '0 4px 6px -1px rgba(0,0,0,0.5)'
      }
    };

    if (options.customTokens) {
      this.registerTokens(options.customTokens);
    }

    this.init();
  }

  init() {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(this.storageKey) : null;
    const initialTheme = saved || this.defaultTheme;
    this.setTheme(initialTheme, false);

    // Escuchar preferencia del sistema
    if (typeof window !== 'undefined' && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (this.currentTheme === 'system') {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  registerTokens(themeName, tokenObject) {
    if (typeof themeName === 'object') {
      Object.assign(this.tokens, themeName);
    } else {
      this.tokens[themeName] = { ...this.tokens.light, ...tokenObject };
    }
  }

  setTheme(themeName, persist = true) {
    this.currentTheme = themeName;
    if (persist && typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, themeName);
    }

    let resolvedTheme = themeName;
    if (themeName === 'system') {
      const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolvedTheme = prefersDark ? 'dark' : 'light';
    }

    this.applyTheme(resolvedTheme);
    this.notifyListeners(themeName, resolvedTheme);
  }

  applyTheme(themeName) {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.setAttribute('data-theme', themeName);

    const themeVars = this.tokens[themeName] || this.tokens.light;
    Object.keys(themeVars).forEach(key => {
      root.style.setProperty(key, themeVars[key]);
    });
  }

  toggleTheme() {
    const resolved = this.getResolvedTheme();
    const nextTheme = resolved === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  getResolvedTheme() {
    if (this.currentTheme !== 'system') return this.currentTheme;
    return (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(rawTheme, resolvedTheme) {
    this.listeners.forEach(fn => fn({ rawTheme, resolvedTheme }));
  }
}

// Instancia singleton predeterminada
export const themeProvider = new AVFenixThemeProvider();
export { AVFenixThemeProvider };
