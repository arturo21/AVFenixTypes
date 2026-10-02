# 🦅 AVFenix Types & General.JS Ecosystem `v2.0`

[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue?style=for-the-badge&logo=githubactions)](https://github.com/arturo21/generaljs)
[![NPM Version](https://img.shields.io/badge/NPM-v1.4.0-red?style=for-the-badge&logo=npm)](https://www.npmjs.com)
[![WAI-ARIA Compliance](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA%2098%25-brightgreen?style=for-the-badge&logo=w3c)](https://www.w3.org/TR/WCAG21/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B%20%7C%20v20%2B%20%7C%20v22%2B-green?style=for-the-badge&logo=node.js)](https://nodejs.org)

**AVFenix Types** es una plataforma de desarrollo full-stack y ecosistema de tipado fuerte diseñado sobre la arquitectura reactiva de **General.JS** (`gnrl.js`, `reactive.general.js` y `routing.general.js`).

A diferencia de los entornos tradicionales con eliminación de tipos (*Type Erasure*), **AVFenix** ofrece **Persistencia de Esquema Dual**: un único archivo `.avf` compila simultáneamente un **Manifiesto de Entidades JSON** para el backend/CMS/Base de Datos y un **Bundle JavaScript de Cliente** optimizado con **AST Static Hoisting** para el Virtual DOM.

---

## 📐 Tabla de Contenidos

1. [🌟 Módulos y Arquitectura del Ecosistema v2.0](#-módulos-y-arquitectura-del-ecosistema-v20)
2. [⚡ Comparativa: AVFenix vs React vs Vue](#-comparativa-avfenix-vs-react-vs-vue)
3. [📁 Estructura del Proyecto Pro](#-estructura-del-proyecto-pro)
4. [🚀 Guía de Inicio Rápido](#-guía-de-inicio-rápido)
5. [📖 Especificación y Sintaxis del Lenguaje `.avf`](#-especificación-y-sintaxis-del-lenguaje-avf)
   * [1. Esquemas CMS y Base de Datos (`export schema`)](#1-esquemas-cms-y-base-de-datos-export-schema)
   * [2. Componentes Reactivos (`export component`)](#2-componentes-reactivos-export-component)
   * [3. Renderizado en Servidor y Rehidratación (`@avfenix/ssr`)](#3-renderizado-en-servidor-y-rehidratación-avfenixssr)
   * [4. Estado Global y Signals (`@avfenix/store`)](#4-estado-global-y-signals-avfenixstore)
   * [5. Tokens de Diseño y Temas (`@avfenix/theme`)](#5-tokens-de-diseño-y-temas-avfenixtheme)
   * [6. Cliente HTTP Tipado (`@avfenix/client`)](#6-cliente-http-tipado-avfenixclient)
   * [7. Pruebas Unitarias Aisladas (`@avfenix/test-utils`)](#7-pruebas-unitarias-aisladas-avfenixtest-utils)
6. [♿ Auditoría de Accesibilidad WAI-ARIA & WCAG 2.1 AA](#-auditoría-de-accesibilidad-wai-aria--wcag-21-aa)
7. [🔄 Migración Automática desde TypeScript (`codemod`)](#-migración-automática-desde-typescript-codemod)
8. [📊 Integración con MariaDB, Flask y SQLAlchemy](#-integración-con-mariadb-flask-y-sqlalchemy)
9. [🤖 Automatización CI/CD y Publicación NPM](#-automatización-cicd-y-publicación-npm)
10. [📜 Licencia y Licenciamiento](#-licencia-y-licenciamiento)

---

## 🌟 Módulos y Arquitectura del Ecosistema v2.0

El ecosistema **AVFenix** está compuesto por herramientas modulares e interconectadas:

```
                                  ┌───────────────────────────┐
                                  │   Archivos de Origen      │
                                  │ .avf / TypeScript (.ts)   │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │   AFXC Compiler v10.0     │
                                  │   AST Static Hoisting     │
                                  └──────┬─────────────┬──────┘
                                         │             │
                    ┌────────────────────┘             └────────────────────┐
                    ▼                                                       ▼
      ┌───────────────────────────┐                           ┌───────────────────────────┐
      │   Manifiesto de Entidades │                           │  Bundle Cliente JS (V-DOM)│
      │   [Nombre].schema.json    │                           │  [Nombre].js + Source Maps│
      └─────────────┬─────────────┘                           └─────────────┬─────────────┘
                    │                                                       │
  ┌─────────────────┴─────────────────┐                   ┌─────────────────┴─────────────────┐
  │ Integraciones Backend / ORM       │                   │ Módulos de Aplicación Cliente     │
  │ • MariaDB & SQLAlchemy (Alembic) │                   │ • @avfenix/ssr (Rehidratación)    │
  │ • Validador HTTP de Backend       │                   │ • @avfenix/store (State & Signals)│
  │ • Generación Form UI CMS Dynamic  │                   │ • @avfenix/theme (Dark/Light)     │
  └───────────────────────────────────┘                   │ • @avfenix/client (Typed Fetch)   │
                                                          │ • @avfenix/test-utils (Unit VDOM) │
                                                          └───────────────────────────────────┘
```

| Módulo / Herramienta | Descripción y Funcionalidad Principal |
| :--- | :--- |
| **`AFXC` (`compiler/afxc.js`)** | Compilador con lexer AST, resolución de grafos de dependencia, static hoisting para VDOM y emisor dual. |
| **`AVFenix CLI` (`bin/avfenix-cli.js`)** | Herramienta CLI v1.4.0 (`create`, `g`, `dev`, `build`, `check`, `check:a11y`, `codemod`, `db:sync`, `ui:pack`). |
| **`@avfenix/ssr` (`lib/avfenix-ssr.js`)** | Motor SSR para renderizar HTML estático (`renderToString`) y rehidratar en navegador (`AVFenixHydrate`). |
| **`@avfenix/store` (`lib/avfenix-store.js`)** | Gestor de estado global con apoyo para Proxies, mutaciones, *Time-Travel Debugging* y *Signals* atómicos. |
| **`@avfenix/theme` (`lib/avfenix-theme.js/.css`)** | Sistema de diseño con Design Tokens como variables CSS, gestión de temas claro/oscuro y persistencia. |
| **`@avfenix/client` (`lib/avfenix-client.js`)** | Cliente HTTP tipado que intercepta y valida peticiones contra esquemas `.schema.json` antes de enviarlas. |
| **`@avfenix/test-utils` (`lib/avfenix-test-utils.js`)** | Suite de pruebas unitarias para montar componentes `.avf`, simular eventos VDOM y realizar aserciones. |
| **`Codemod TS` (`lib/ts-to-avf.js`)** | Convertidor estático de interfaces y tipos de TypeScript (`.ts`) a esquemas nativos `.avf`. |
| **`DevServer` (`dev-server.js`)** | Servidor local con recompilación al instante, SSE Live Reload y **Widget Flotante de Accesibilidad en Vivo**. |

---

## ⚡ Comparativa: AVFenix vs React vs Vue

| Característica / Capacidad | React + Next.js | Vue 3 + Nuxt | **AVFenix Ecosistema v2.0** |
| :--- | :--- | :--- | :--- |
| **Manejo de Tipos** | Eliminación en compilación (*Type Erasure*) | Eliminación en compilación (*Type Erasure*) | **Persistencia Dual** (`.schema.json` + `.js`) |
| **Optimización VDOM** | React Compiler (experimental) | Compiler-informed Virtual DOM | **AST Static Hoisting nativo en AFXC** |
| **Validación Backend/DB** | Requiere Prisma, Zod o Yup adicionales | Requiere ORMs/Zod adicionales | **Sincronización nativa MariaDB & Alembic** |
| **Auditoría Accesibilidad** | Plugins ESLint o AXE externos | Plugins ESLint externos | **Integrada en CLI (`check:a11y`) y Widget DevServer** |
| **Tamaño de Librería Base** | ~130 KB (React + React-DOM) | ~50 KB (Vue Core) | **< 15 KB (General.JS + Reactive Core)** |

---

## 📁 Estructura del Proyecto Pro

Al inicializar un proyecto con `npx avfenix create mi-app` o utilizar `avfenix-template-pro.zip`:

```text
mi-app/
├── bin/
│   └── avfenix-cli.js               # CLI v1.4.0 ejecutable
├── compiler/
│   └── afxc.js                      # Compilador AFXC v10.0
├── lib/
│   ├── avfenix-ssr.js               # Módulo de Server-Side Rendering
│   ├── avfenix-store.js             # Módulo de Estado Global & Signals
│   ├── avfenix-theme.js             # Motor JS de Tematización
│   ├── avfenix-theme.css            # Design Tokens en CSS Variables
│   ├── avfenix-client.js            # Cliente HTTP con validación pre-flight
│   ├── avfenix-test-utils.js        # Utilidades de Pruebas Unitarias
│   └── ts-to-avf.js                 # Codemod TypeScript -> AVF
├── src/
│   ├── components/
│   │   ├── HeaderBar.avf            # Componentes reactivos UI
│   │   └── ThemeToggle.avf
│   ├── models/
│   │   └── Usuario.avf              # Esquemas de datos con @ui y @validate
│   ├── stores/
│   │   └── appStore.js              # Stores globales
│   └── App.avf                      # Componente raíz
├── dist/                            # Artefactos compilados (.js, .schema.json, .map)
├── index.html                       # HTML principal
├── dev-server.js                    # Servidor local con Widget A11y SSE
├── afxc.config.json                 # Configuración del proyecto
└── package.json                     # Scripts y dependencias
```

---

## 🚀 Guía de Inicio Rápido

### 1. Requisitos Previos
* **Node.js** v18.0.0 o superior.
* Gestor de paquetes `npm` o `npx`.

### 2. Crear un Nuevo Proyecto Full-Stack
```bash
npx avfenix create mi-aplicacion
cd mi-aplicacion
```

### 3. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
Navega a `http://localhost:3000`. El servidor monitorizará los archivos `.avf` dentro de `src/`, recompilará automáticamente e inyectará el **Widget de Accesibilidad en vivo** en el navegador.

### 4. Verificar Tipos y Accesibilidad WAI-ARIA
```bash
# Verificación estática de tipos
npm run check

# Auditoría estática de accesibilidad WCAG 2.1 AA
npm run check:a11y
```

### 5. Compilación para Producción
```bash
npm run build
```

---

## 📖 Especificación y Sintaxis del Lenguaje `.avf`

### 1. Esquemas CMS y Base de Datos (`export schema`)
Define estructuras de datos con soporte para atributos de interfaz (`@ui`), reglas de validación (`@validate`) y relaciones relacionales (`@link`):

```typescript
export schema Usuario {
  id: string @ui(widget: "text-input", label: "Identificador", required: true);
  nombre: string @ui(widget: "text-input", label: "Nombre Completo", required: true);
  email: string @validate(pattern: "^[^@]+@[^@]+\.[^@]+$") @ui(widget: "email-input", label: "Correo Electrónico", required: true);
  edad?: number @validate(min: 18, max: 99) @ui(widget: "number-input", label: "Edad");
  rol: string @ui(widget: "select", options: ["Admin", "Editor", "Usuario"]);
  activo: boolean @ui(widget: "toggle", label: "Estado Activo");
}
```

### 2. Componentes Reactivos (`export component`)
Componentes visuales con estado encapsulado (`this.state`), ciclo de vida, slots dinámicos (`this.props.children`) y sintaxis JSX:

```typescript
import { Usuario } from "../models/Usuario.avf";

export component TarjetaUsuario {
  state = { expanded: false };

  onMount() {
    console.log("Tarjeta de usuario montada.");
  }

  toggleExpand() {
    this.setState({ expanded: !this.state.expanded });
  }

  template(state) {
    return (
      <div class="avf-card" role="region" aria-label="Información de Usuario">
        <header class="avf-card-header">
          <h3>{this.props.usuario.nombre}</h3>
          <button 
            class="avf-btn" 
            aria-label="Expandir detalles de usuario"
            aria-expanded={state.expanded ? "true" : "false"}
            onClick={() => this.toggleExpand()}
          >
            {state.expanded ? "Ocultar" : "Detalles"}
          </button>
        </header>

        {state.expanded && (
          <div class="avf-card-body">
            <p><strong>Email:</strong> {this.props.usuario.email}</p>
            <p><strong>Rol:</strong> {this.props.usuario.rol}</p>
            {this.props.children}
          </div>
        )}
      </div>
    );
  }
}
```

### 3. Renderizado en Servidor y Rehidratación (`@avfenix/ssr`)
Renderiza componentes `.avf` a cadenas HTML estáticas en el servidor Node.js o Express y rehidrata en el cliente:

```javascript
// Servidor Express
const { renderToString } = require('./lib/avfenix-ssr.js');
const { App } = require('./dist/App.js');

app.get('/', async (req, res) => {
  const htmlStr = renderToString(App, { user: 'Carlos' });
  res.send(`
    <div id="app-root">${htmlStr}</div>
    <script src="/gnrl.js"></script>
    <script src="/reactive.general.js"></script>
    <script src="/dist/App.js"></script>
    <script>AVFenixHydrate(App, '#app-root');</script>
  `);
});
```

### 4. Estado Global y Signals (`@avfenix/store`)
Módulos de estado global reactivos con soporte para mutaciones, acciones asíncronas y *time-travel*:

```javascript
import { createStore, createSignal } from './lib/avfenix-store.js';

// 1. Store Centralizado
export const authStore = createStore({
  name: 'AuthStore',
  state: { usuario: null, autenticado: false },
  mutations: {
    SET_USUARIO(state, user) {
      state.usuario = user;
      state.autenticado = !!user;
    }
  }
});

// 2. Signal Atómico
export const contadorSignal = createSignal(0);
```

### 5. Tokens de Diseño y Temas (`@avfenix/theme`)
Gestión dinámica del modo claro/oscuro y variables CSS semánticas:

```javascript
import { themeProvider } from './lib/avfenix-theme.js';

// Cambiar tema
themeProvider.setTheme('dark'); // 'light' | 'dark' | 'system'
themeProvider.toggleTheme();
```

### 6. Cliente HTTP Tipado (`@avfenix/client`)
Intercepta y valida peticiones contra manifiestos `.schema.json` antes de enviarlas por la red:

```javascript
import { createClient } from './lib/avfenix-client.js';
import usuarioSchema from './dist/Usuario.schema.json';

const api = createClient({
  baseUrl: '/api/v1',
  schemas: { Usuario: usuarioSchema }
});

// Valida automáticamente los datos de 'nuevoUsuario' contra Usuario.schema.json
await api.post('/usuarios', nuevoUsuario, { entity: 'Usuario' });
```

### 7. Pruebas Unitarias Aisladas (`@avfenix/test-utils`)
Pruebas de componentes sobre el Virtual DOM en Node.js (JSDOM / HappyDOM):

```javascript
const { mount, assert } = require('./lib/avfenix-test-utils.js');
const { TarjetaUsuario } = require('./dist/TarjetaUsuario.js');

describe('TarjetaUsuario.avf', () => {
  it('debe expandir el panel al hacer clic en el botón', () => {
    const wrapper = mount(TarjetaUsuario, {
      usuario: { nombre: 'Ana', email: 'ana@ejemplo.com', rol: 'Admin' }
    });

    assert.contains(wrapper.html(), 'Ana');
    wrapper.trigger('button', 'click');
    assert.contains(wrapper.html(), 'ana@ejemplo.com');
    wrapper.destroy();
  });
});
```

---

## ♿ Auditoría de Accesibilidad WAI-ARIA & WCAG 2.1 AA

El compilador y la CLI auditan los componentes `.avf` para garantizar el estándar WCAG 2.1 AA:

* 🖼️ **Imágenes Accesibles:** Exige `alt` o `aria-hidden="true"` en elementos `<img>`.
* ⌨️ **Navegación por Teclado:** Requiere `tabIndex={0}` y `role` explícito (`role="button"`) en elementos interactivos personalizados (`<div onClick>`).
* 🏷️ **Botones Simbólicos:** Exige `aria-label` en botones con contenido únicamente de icono o símbolo (`×`, `+`, `<`).
* 📑 **Campos de Formulario:** Verifica la vinculación de etiquetas `<label>` o atributos `aria-label` en entradas.

### Exportación de Reportes
```bash
# Consola / CLI
npx avfenix check:a11y

# Formato JSON para CI/CD
npx avfenix check:a11y --json > a11y-report.json

# Formato Markdown para Pull Requests
npx avfenix check:a11y --md > a11y-report.md
```

---

## 🔄 Migración Automática desde TypeScript (`codemod`)

Migra carpetas enteras de tipos o interfaces `.ts` / `.tsx` existentes a esquemas nativos `.avf`:

```bash
# Convertir carpeta completa
npx avfenix codemod ./src/types

# Convertir archivo individual
npx avfenix codemod ./src/types/Producto.ts
```

---

## 📊 Integración con MariaDB, Flask y SQLAlchemy

Sincroniza los esquemas `.avf` compilados directamente con la base de datos MariaDB y genera archivos de migración de **Alembic / SQLAlchemy** para entornos Python/Flask:

```bash
# Sincronización de esquemas con MariaDB
npx avfenix db:sync
```

O ejecuta el script generador de migraciones en Python:
```bash
python3 scripts/avfenix_alembic.py
```

---

## 🤖 Automatización CI/CD y Publicación NPM

El repositorio incluye el archivo `.github/workflows/release.yml` preconfigurado. Cada vez que creas y subes un *tag* de versión (`git tag v1.0.0 && git push origin v1.0.0`), GitHub Actions:

1. Ejecuta la suite de pruebas unitarias (`npm test`).
2. Verifica la auditoría de accesibilidad WAI-ARIA.
3. Ejecuta `publish-ui.js` para compilar la librería.
4. Publica la versión automáticamente en el registro público de **NPM**.

---

## 📜 Licencia y Licenciamiento

**AVFenix Types** y el ecosistema **General.JS** están licenciados bajo la Licencia [MIT](LICENSE). Libre para uso comercial y personal.

---

<p center="align">
  <i>Ecosistema AVFenix Types v2.0 • Diseñado para el máximo rendimiento, tipado robusto y accesibilidad universal.</i>
</p>
