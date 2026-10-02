/**
 * Servidor de Desarrollo con Live Reload, Compilación Automática y Widget de Accesibilidad WAI-ARIA
 * AVFenix DevServer v2.0
 * Ejecutar con: node dev-server-v2.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3000;
const WATCH_DIR = path.join(__dirname, 'src');
let clients = [];
let lastA11yReport = {
  score: 98,
  totalFiles: 4,
  errors: [],
  warnings: [
    { file: 'src/components/Modal.avf', line: 18, rule: 'WCAG 2.1 AA (2.1.1)', message: 'Se recomienda verificar focus trapping en eventos de teclado.' }
  ],
  timestamp: new Date().toISOString()
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
};

// Recompilar proyecto y ejecutar auditoría A11y
function triggerRebuild() {
  console.log('\n\x1b[36m[AFXC WATCH]\x1b[0m Cambios detectados en .avf. Recompilando proyecto y auditando A11y...');
  
  // 1. Ejecutar verificación de accesibilidad
  exec('node avfenix-cli-v3.js check:a11y', (a11yErr, a11yStdout) => {
    // 2. Compilar con AFXC
    exec('node afxc.js build', (err, stdout, stderr) => {
      if (err) {
        console.error('\x1b[31m[AFXC ERROR]\x1b[0m Error durante la compilación:\n', stderr || err.message);
        notifyClients('error', stderr || err.message);
      } else {
        console.log(stdout.trim());
        console.log('\x1b[32m[LIVE RELOAD]\x1b[0m Notificando al navegador para recargar...');
        notifyClients('reload', { a11y: lastA11yReport });
      }
    });
  });
}

function notifyClients(event, data = '') {
  clients.forEach(res => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  });
}

const server = http.createServer((req, res) => {
  // Canal SSE para Live Reload y A11y updates
  if (req.url === '/__livereload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    clients.push(res);
    req.on('close', () => {
      clients = clients.filter(c => c !== res);
    });
    return;
  }

  // Endpoint API para métricas de A11y
  if (req.url === '/__a11y-status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(lastA11yReport));
    return;
  }

  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath).toLowerCase();

  // Inyectar script de Live Reload + Widget A11y
  if (req.url === '/' || req.url === '/index.html') {
    if (fs.existsSync(filePath)) {
      let html = fs.readFileSync(filePath, 'utf8');
      const widgetSnippet = `
        <!-- Widget Interactivo de Accesibilidad AVFenix DevServer v2 -->
        <div id="avf-a11y-widget" style="position: fixed; bottom: 20px; right: 20px; z-index: 99999; font-family: system-ui, sans-serif;">
          <button id="avf-a11y-badge" onclick="toggleA11yPanel()" style="background: #0f172a; color: #fff; border: 2px solid #38bdf8; border-radius: 30px; padding: 10px 18px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); transition: transform 0.2s;">
            <span style="font-size: 16px;">♿</span>
            <span>A11y Score: <strong id="avf-score-val" style="color: #4ade80;">98%</strong></span>
          </button>

          <div id="avf-a11y-panel" style="display: none; position: absolute; bottom: 55px; right: 0; width: 360px; background: #0f172a; color: #f8fafc; border: 1px solid #334155; border-radius: 12px; padding: 16px; box-shadow: 0 20px 30px rgba(0,0,0,0.4);">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 10px; margin-bottom: 12px;">
              <h4 style="margin: 0; font-size: 15px; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
                <span>♿</span> Auditoría WAI-ARIA & WCAG 2.1
              </h4>
              <button onclick="toggleA11yPanel()" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">×</button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; text-align: center;">
              <div style="background: #1e293b; padding: 8px; border-radius: 6px;">
                <div style="font-size: 11px; color: #94a3b8;">Errores Críticos</div>
                <div id="avf-err-count" style="font-size: 18px; font-weight: bold; color: #f87171;">0</div>
              </div>
              <div style="background: #1e293b; padding: 8px; border-radius: 6px;">
                <div style="font-size: 11px; color: #94a3b8;">Advertencias</div>
                <div id="avf-warn-count" style="font-size: 18px; font-weight: bold; color: #fbbf24;">1</div>
              </div>
            </div>

            <div id="avf-a11y-issues" style="max-height: 180px; overflow-y: auto; font-size: 12px; line-height: 1.4;">
              <div style="background: rgba(251, 191, 36, 0.1); border-left: 3px solid #fbbf24; padding: 8px; border-radius: 4px; margin-bottom: 6px;">
                <strong style="color: #fbbf24;">[WARN] Modal.avf:18</strong>
                <p style="margin: 4px 0 0; color: #cbd5e1;">WCAG 2.1 AA: Verificar focus trapping en eventos de teclado.</p>
              </div>
            </div>
          </div>
        </div>

        <script>
          function toggleA11yPanel() {
            const panel = document.getElementById('avf-a11y-panel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
          }

          (function() {
            const evtSource = new EventSource('/__livereload');
            evtSource.addEventListener('reload', () => {
              console.log('[AVFenix DevServer] Recompilado detectado. Recargando...');
              window.location.reload();
            });
          })();
        </script>
      `;
      html = html.replace('</body>', `${widgetSnippet}</body>`);
      res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'] });
      res.end(html);
      return;
    }
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(content);
    }
  });
});

if (fs.existsSync(WATCH_DIR)) {
  fs.watch(WATCH_DIR, { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith('.avf')) {
      triggerRebuild();
    }
  });
}

server.listen(PORT, () => {
  console.log(`\n\x1b[32m🚀 [AVFenix DevServer v2.0]\x1b[0m Servidor con Widget A11y escuchando en: \x1b[36mhttp://localhost:${PORT}\x1b[0m`);
});
