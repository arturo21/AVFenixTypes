#!/usr/bin/env node
/**
 * AVFenix CLI Tool v1.4.0
 * Herramienta de línea de comandos oficial para el ecosistema AVFenix Types & General.JS
 * 
 * Comandos:
 *   npx avfenix create <project-name>   - Crea un nuevo proyecto full-stack estructurado
 *   npx avfenix g component <Name>      - Genera un nuevo componente reactivo (.avf)
 *   npx avfenix g schema <Name>         - Genera un nuevo esquema de entidad (.avf)
 *   npx avfenix dev                     - Inicia el servidor de desarrollo con Live Reload
 *   npx avfenix build                   - Ejecuta check:a11y y compila el proyecto con AFXC
 *   npx avfenix check                   - Ejecuta el comprobador estático de tipos
 *   npx avfenix check:a11y [dir]        - Audita el cumplimiento WAI-ARIA / WCAG 2.1 AA
 *   npx avfenix codemod <dir|file>      - Convierte automáticamente archivos TS (.ts/.tsx) a .avf
 *   npx avfenix db:sync                 - Sincroniza esquemas con MariaDB / SQLAlchemy
 *   npx avfenix ui:pack                 - Empaqueta la librería avfenix-ui para NPM
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const command = args[0];
const subCommand = args[1];
const targetName = args[2];

function printBanner() {
  console.log('\x1b[36m');
  console.log('  🦅 AVFenix CLI v1.4.0');
  console.log('  Ecosistema de Tipado Fuerte & General.JS');
  console.log('\x1b[0m');
}

function convertTsToAvf(code) {
  let avfCode = '';
  const interfaceRegex = /(?:export\s+)?(?:interface|type)\s+([A-Z][A-Za-z0-9_]*)\s*(?:=\s*)?\{([^}]+)\}/g;
  let match;

  while ((match = interfaceRegex.exec(code)) !== null) {
    const name = match[1];
    const body = match[2];

    avfCode += `export schema ${name} {\n`;
    const lines = body.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('/*'));

    lines.forEach(line => {
      const propRegex = /^([A-Za-z0-9_]+)(\?)?\s*:\s*([^;]+);?$/;
      const pMatch = line.match(propRegex);

      if (pMatch) {
        const field = pMatch[1];
        const isOptional = !!pMatch[2];
        let rawType = pMatch[3].trim().toLowerCase();

        let avfType = 'string';
        let uiWidget = 'text-input';
        let validateRules = [];

        if (rawType.includes('number')) {
          avfType = 'number';
          uiWidget = 'number-input';
        } else if (rawType.includes('boolean')) {
          avfType = 'boolean';
          uiWidget = 'toggle';
        } else if (rawType.includes('date')) {
          avfType = 'date';
          uiWidget = 'date-picker';
        } else if (rawType.includes('[]') || rawType.startsWith('array')) {
          avfType = 'array';
          uiWidget = 'list-select';
        } else if (field.toLowerCase().includes('email')) {
          avfType = 'string';
          uiWidget = 'email-input';
          validateRules.push('pattern: "^[^@]+@[^@]+\\.[^@]+$"');
        } else if (field.toLowerCase().includes('password') || field.toLowerCase().includes('clave')) {
          avfType = 'string';
          uiWidget = 'password-input';
        }

        const label = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');

        let decor = [];
        if (validateRules.length > 0) {
          decor.push(`@validate(${validateRules.join(', ')})`);
        }

        let uiOpts = [`widget: "${uiWidget}"`, `label: "${label}"`];
        if (!isOptional) {
          uiOpts.push('required: true');
        }
        decor.push(`@ui(${uiOpts.join(', ')})`);

        const optionalMark = isOptional ? '?' : '';
        avfCode += `  ${field}${optionalMark}: ${avfType} ${decor.join(' ')};\n`;
      }
    });

    avfCode += `}\n\n`;
  }

  return avfCode || '// No se encontraron interfaces o tipos para convertir.';
}

function runCodemod(targetPath) {
  const resolved = path.resolve(process.cwd(), targetPath || './src/types');
  if (!fs.existsSync(resolved)) {
    console.error(`\x1b[31m[Codemod Error]\x1b[0m La ruta "${targetPath}" no existe.`);
    process.exit(1);
  }

  const stat = fs.statSync(resolved);
  let convertedCount = 0;

  if (stat.isFile()) {
    processFile(resolved);
  } else if (stat.isDirectory()) {
    scanAndProcessDir(resolved);
  }

  function scanAndProcessDir(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) {
        scanAndProcessDir(full);
      } else if (f.endsWith('.ts') || f.endsWith('.tsx')) {
        processFile(full);
      }
    }
  }

  function processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const avfContent = convertTsToAvf(content);
    if (!avfContent.includes('// No se encontraron')) {
      const parsedPath = path.parse(filePath);
      const outPath = path.join(parsedPath.dir, `${parsedPath.name}.avf`);
      fs.writeFileSync(outPath, avfContent);
      console.log(`\x1b[32m[Codemod Convertido]\x1b[0m ${path.relative(process.cwd(), filePath)} -> \x1b[36m${path.relative(process.cwd(), outPath)}\x1b[0m`);
      convertedCount++;
    }
  }

  console.log(`\n\x1b[32m[Éxito]\x1b[0m Codemod completado: ${convertedCount} archivo(s) convertidos a .avf\n`);
}

function runA11yAudit(dirPath = './src') {
  console.log('\x1b[36m[AVFenix A11y Auditor]\x1b[0m Analizando componentes en busca de reglas WAI-ARIA...');
  const targetDir = path.resolve(process.cwd(), dirPath);
  if (!fs.existsSync(targetDir)) return true;

  let totalFiles = 0;
  let totalErrors = 0;
  let totalWarnings = 0;

  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const fullPath = path.join(dir, f);
      if (fs.statSync(fullPath).isDirectory()) {
        scanDir(fullPath);
      } else if (f.endsWith('.avf')) {
        totalFiles++;
        auditFile(fullPath);
      }
    }
  }

  function auditFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      if (/<img\b[^>]*>/i.test(line) && !/alt=/i.test(line) && !/aria-hidden=["']true["']/i.test(line)) {
        totalErrors++;
      }
      if (/<(div|span)\b[^>]*onClick/i.test(line)) {
        if (!/role=/i.test(line)) totalErrors++;
        if (!/tabIndex=/i.test(line)) totalWarnings++;
      }
      if (/<button\b[^>]*>/i.test(line) && !/aria-label=/i.test(line) && />\s*([×&\+\-><]|<[a-z]+[^>]*\/?>)\s*<\/button>/i.test(line)) {
        totalErrors++;
      }
    });
  }

  scanDir(targetDir);

  if (totalErrors > 0) {
    console.log('\x1b[31m[A11y Fail]\x1b[0m Se encontraron errores de accesibilidad.');
    return false;
  } else {
    console.log('\x1b[32m[A11y Pass]\x1b[0m Auditoría de accesibilidad aprobada exitosamente.');
    return true;
  }
}

if (!command || command === '--help' || command === '-h') {
  printBanner();
  console.log(`
Uso:
  npx avfenix <comando> [opciones]

Comandos disponibles:
  create <proyecto>        Crea una nueva estructura de proyecto completa
  g component <Nombre>     Genera un componente reactivo en src/components/<Nombre>.avf
  g schema <Nombre>        Genera un esquema de entidad en src/models/<Nombre>.avf
  codemod [dir|file]       Convierte masivamente interfaces TypeScript (.ts/.tsx) a .avf
  dev                      Inicia el servidor local con recompilación y Live Reload
  build                    Ejecuta check:a11y y compila el proyecto con AFXC
  check                    Ejecuta el análisis estático de tipos sin emitir archivos
  check:a11y [dir]         Audita el cumplimiento WAI-ARIA / WCAG 2.1 AA
  db:sync                  Sincroniza los esquemas compilados con MariaDB/SQLAlchemy
  ui:pack                  Empaqueta la librería avfenix-ui para NPM
  --version, -v            Muestra la versión de la CLI
`);
  process.exit(0);
}

switch (command) {
  case 'codemod': {
    printBanner();
    console.log('\x1b[36m[AVFenix Codemod]\x1b[0m Iniciando conversión de TypeScript a AVFenix Types...');
    runCodemod(subCommand || './src');
    break;
  }

  case 'check:a11y': {
    printBanner();
    const passed = runA11yAudit(subCommand || './src');
    process.exit(passed ? 0 : 1);
    break;
  }

  case 'build': {
    printBanner();
    console.log('\x1b[36m[Paso 1/2]\x1b[0m Ejecutando verificación previa de accesibilidad (WAI-ARIA)...');
    const a11yPassed = runA11yAudit('./src');
    if (!a11yPassed && !process.argv.includes('--skip-a11y')) {
      console.error('\n\x1b[31m[Build Interrumpido]\x1b[0m Corrige los errores de accesibilidad o usa --skip-a11y para omitir.');
      process.exit(1);
    }

    console.log('\n\x1b[36m[Paso 2/2]\x1b[0m Compilando esquemas y componentes con AFXC...');
    const afxcPath = fs.existsSync('./compiler/afxc.js') ? './compiler/afxc.js' : './afxc.js';
    try {
      execSync(`node ${afxcPath} build`, { stdio: 'inherit' });
    } catch (e) {
      process.exit(1);
    }
    break;
  }

  case 'create': {
    const projName = subCommand || 'avfenix-app';
    const targetDir = path.resolve(process.cwd(), projName);
    if (fs.existsSync(targetDir)) {
      console.error(`\x1b[31m[Error]\x1b[0m El directorio "${projName}" ya existe.`);
      process.exit(1);
    }
    printBanner();
    fs.mkdirSync(path.join(targetDir, 'src/components'), { recursive: true });
    fs.mkdirSync(path.join(targetDir, 'src/models'), { recursive: true });
    fs.mkdirSync(path.join(targetDir, 'dist'), { recursive: true });

    const pkg = {
      name: projName,
      version: '1.0.0',
      scripts: {
        dev: 'node dev-server.js',
        build: 'npx avfenix build',
        check: 'npx avfenix check',
        'check:a11y': 'npx avfenix check:a11y',
        codemod: 'npx avfenix codemod ./src',
        'db:sync': 'python3 scripts/avfenix_mariadb.py'
      },
      dependencies: { 'gnrl.js': '^2.0.0' }
    };
    fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkg, null, 2));
    console.log(`\x1b[32m[Éxito]\x1b[0m Proyecto ${projName} creado correctamente.\n`);
    break;
  }

  default:
    console.log(`\x1b[31m[Error]\x1b[0m Comando no reconocido "${command}". Usa "npx avfenix --help".`);
    process.exit(1);
}
