#!/usr/bin/env node
/**
 * TS to AVF Codemod Tool (ts-to-avf.js)
 * Convierte automáticamente interfaces y tipos de TypeScript (.ts) a esquemas de AVFenix Types (.avf)
 * 
 * Uso:
 *   node ts-to-avf.js <archivo.ts> [archivo_salida.avf]
 *   npx avfenix codemod <archivo.ts>
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const inputFile = args[0];
const outputFile = args[1];

if (!inputFile || inputFile === '--help' || inputFile === '-h') {
  console.log(`
🦅 AVFenix Codemod: Convertidor de TypeScript a AVFenix Types (.avf)

Uso:
  node ts-to-avf.js <archivo.ts> [archivo_salida.avf]

Ejemplo:
  node ts-to-avf.js src/types/Usuario.ts src/models/Usuario.avf
`);
  process.exit(0);
}

const inputPath = path.resolve(process.cwd(), inputFile);
if (!fs.existsSync(inputPath)) {
  console.error(`\x1b[31m[Error]\x1b[0m Archivo no encontrado: ${inputFile}`);
  process.exit(1);
}

const tsContent = fs.readFileSync(inputPath, 'utf8');

function convertTsToAvf(code) {
  let avfCode = '';

  // Buscar interfaces o types
  const interfaceRegex = /(?:export\s+)?(?:interface|type)\s+([A-Z][A-Za-z0-9_]*)\s*(?:=\s*)?\{([^}]+)\}/g;
  let match;

  while ((match = interfaceRegex.exec(code)) !== null) {
    const name = match[1];
    const body = match[2];

    avfCode += `export schema ${name} {\n`;

    const lines = body.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('/*'));

    lines.forEach(line => {
      // Parsear propiedad: campo?: tipo;
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
          validateRules.push('pattern: "^[^@]+@[^@]+\\\\.[^@]+$"');
        } else if (field.toLowerCase().includes('password') || field.toLowerCase().includes('clave')) {
          avfType = 'string';
          uiWidget = 'password-input';
        }

        // Generar label amigable
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

  return avfCode || '// No se encontraron interfaces o tipos válidos para convertir.';
}

const resultAvf = convertTsToAvf(tsContent);

if (outputFile) {
  const outputPath = path.resolve(process.cwd(), outputFile);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, resultAvf);
  console.log(`\x1b[32m[Éxito]\x1b[0m Esquema AVFenix guardado en: \x1b[36m${outputPath}\x1b[0m`);
} else {
  console.log('\x1b[32m[Resultado de Conversión AVFenix Types]\x1b[0m\n');
  console.log(resultAvf);
}
