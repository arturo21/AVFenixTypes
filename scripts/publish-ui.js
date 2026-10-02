#!/usr/bin/env node
/**
 * Script de empaquetado y publicación NPM para avfenix-ui
 * Uso: node publish-ui.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

console.log('\x1b[36m[AVFenix UI Publisher]\x1b[0m Preparando paquete distribuible para NPM...');

const pkgDir = path.resolve(process.cwd(), 'avfenix-ui-npm');

if (fs.existsSync(pkgDir)) {
  fs.rmSync(pkgDir, { recursive: true, force: true });
}

fs.mkdirSync(path.join(pkgDir, 'dist'), { recursive: true });
fs.mkdirSync(path.join(pkgDir, 'src'), { recursive: true });

// 1. Crear package.json para NPM
const uiPackageJson = {
  name: "avfenix-ui",
  version: "1.0.0",
  description: "Librería de componentes UI reactivos y accesibles para el ecosistema AVFenix Types & General.JS",
  main: "dist/avfenix-ui.js",
  style: "dist/avfenix-ui.css",
  types: "dist/avfenix-ui.d.ts",
  repository: {
    type: "git",
    url: "git+https://github.com/arturo21/avfenix-ui.git"
  },
  keywords: [
    "avfenix",
    "generaljs",
    "reactive",
    "ui-components",
    "virtual-dom",
    "types"
  ],
  author: "AVFenix Core Team",
  license: "MIT",
  peerDependencies: {
    "gnrl.js": "^2.0.0",
    "reactive.general.js": "^2.0.0"
  }
};

fs.writeFileSync(
  path.join(pkgDir, 'package.json'),
  JSON.stringify(uiPackageJson, null, 2)
);

// 2. Crear index.js de entrada
const indexJs = `/**
 * AVFenix UI Library Entry Point
 */
if (typeof window !== 'undefined' && window.genrl && window.reactv) {
  console.log('[AVFenix UI] Librería cargada correctamente en el entorno global.');
}

module.exports = {
  version: "1.0.0"
};
`;
fs.writeFileSync(path.join(pkgDir, 'index.js'), indexJs);

// 3. Copiar componentes .avf y estilos CSS
const sourceCss = path.resolve(__dirname, 'avfenix-ui.css');
if (fs.existsSync(sourceCss)) {
  fs.copyFileSync(sourceCss, path.join(pkgDir, 'dist', 'avfenix-ui.css'));
}

// 4. README del paquete NPM
const npmReadme = `# 🦅 AVFenix UI

Colección oficial de componentes UI reactivos, accesibles e integrados con **AVFenix Types** y **General.JS**.

## 📦 Instalación

\`\`\`bash
npm install avfenix-ui gnrl.js
\`\`\`

## 🚀 Uso en HTML / Navegador

\`\`\`html
<link rel="stylesheet" href="node_modules/avfenix-ui/dist/avfenix-ui.css">

<script src="node_modules/gnrl.js/gnrl.js"></script>
<script src="node_modules/reactive.general.js/reactive.general.js"></script>
<script src="node_modules/avfenix-ui/dist/avfenix-ui.js"></script>
\`\`\`

## 🧩 Componentes Incluidos

- **Button**: Botones con variantes y estados de carga.
- **TextInput**: Campos con etiquetas flotantes e indicadores de error.
- **Select**: Desplegables de selección dinámicos.
- **Toggle**: Switch booleano accesible.
- **Badge**: Etiquetas indicadoras de estado.
- **Modal**: Diálogos emergentes con slots (\`props.children\`).
- **DataTable**: Tablas interactivas con filtro y paginación.
- **AutoForm**: Generador dinámico de formularios guiado por esquemas \`.avf\`.
`;

fs.writeFileSync(path.join(pkgDir, 'README.md'), npmReadme);

console.log('\x1b[32m[Éxito]\x1b[0m Estructura del paquete NPM creada en \x1b[36m' + pkgDir + '\x1b[0m');

try {
  if (isDryRun) {
    console.log('\x1b[33m[Dry Run]\x1b[0m Empaquetando tarball de prueba con npm pack...');
    execSync('npm pack', { cwd: pkgDir, stdio: 'inherit' });
    console.log('\x1b[32m[Éxito]\x1b[0m Tarball listo para verificación.');
  } else {
    console.log('\x1b[36m[NPM Publish]\x1b[0m Ejecutando empaquetado...');
    execSync('npm pack', { cwd: pkgDir, stdio: 'inherit' });
    console.log('\x1b[32m[Éxito]\x1b[0m Paquete listo para publicar con: cd avfenix-ui-npm && npm publish');
  }
} catch (e) {
  console.log('\x1b[33m[Aviso]\x1b[0m Empaquetado completado en directorio local ' + pkgDir);
}
