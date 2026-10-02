/**
 * @avfenix/ssr v1.0.0
 * Motor de Server-Side Rendering (SSR) y Rehidratación para AVFenix Types y General.JS
 */

const fs = require('fs');
const path = require('path');

/**
 * Convierte un árbol VNode de reactive.general.js o un componente .avf en una cadena HTML estática.
 */
function renderToString(componentClassOrVNode, props = {}, initialState = {}) {
  // Si es un VNode simple
  if (typeof componentClassOrVNode === 'object' && componentClassOrVNode !== null && componentClassOrVNode.tag) {
    return vnodeToString(componentClassOrVNode);
  }

  // Si es una clase de Componente AVFenix / reactive.general.js
  if (typeof componentClassOrVNode === 'function') {
    const instance = new componentClassOrVNode(props);
    instance.props = props || {};
    instance.state = { ...(instance.state || {}), ...initialState };

    // Ejecutar lifecycle en SSR si existe (ej. onServerPrefetch)
    if (typeof instance.onServerPrefetch === 'function') {
      instance.onServerPrefetch();
    }

    const vnode = instance.template ? instance.template(instance.state) : null;
    const htmlContent = vnodeToString(vnode);

    // Generar script de rehidratación con el estado inicial
    const hydrationScript = `<script id="__AVFENIX_HYDRATION__">window.__AVFENIX_STATE__ = ${JSON.stringify(instance.state)}; window.__AVFENIX_PROPS__ = ${JSON.stringify(props)};</script>`;

    return `<div data-avfenix-ssr="true">${htmlContent}</div>${hydrationScript}`;
  }

  return '';
}

/**
 * Convierte un VNode en HTML string escapando valores
 */
function vnodeToString(vnode) {
  if (vnode === null || vnode === undefined || vnode === false) return '';
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return escapeHtml(String(vnode));
  }
  if (Array.isArray(vnode)) {
    return vnode.map(vnodeToString).join('');
  }

  const { tag, attrs, children } = vnode;
  if (!tag) return '';

  let attrsStr = '';
  if (attrs) {
    Object.keys(attrs).forEach(key => {
      // Ignorar manejadores de eventos en SSR (onClick, onChange, etc.)
      if (key.startsWith('on')) return;
      if (key === 'className' || key === 'class') {
        attrsStr += ` class="${escapeHtml(attrs[key])}"`;
      } else if (typeof attrs[key] === 'boolean') {
        if (attrs[key]) attrsStr += ` ${key}`;
      } else if (attrs[key] !== null && attrs[key] !== undefined) {
        attrsStr += ` ${key}="${escapeHtml(String(attrs[key]))}"`;
      }
    });
  }

  // Tags auto-cerrados
  const selfClosing = ['img', 'input', 'br', 'hr', 'meta', 'link'];
  if (selfClosing.includes(tag.toLowerCase())) {
    return `<${tag}${attrsStr} />`;
  }

  const innerHtml = children ? children.map(vnodeToString).join('') : '';
  return `<${tag}${attrsStr}>${innerHtml}</${tag}>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Script ejecutable en el cliente para rehidratación transparente
 */
const clientHydrationCode = `
(function() {
  window.AVFenixHydrate = function(ComponentClass, targetSelector) {
    const target = document.querySelector(targetSelector);
    if (!target) return;

    const state = window.__AVFENIX_STATE__ || {};
    const props = window.__AVFENIX_PROPS__ || {};

    // Rehidratación: reutilizar nodos del DOM existiendo y adjuntar manejadores
    const instance = new ComponentClass(props, target);
    instance.state = state;
    
    if (typeof instance.onMount === 'function') {
      instance.onMount();
    }
    console.log('[AVFenix SSR] Rehidratación completada exitosamente.');
  };
})();
`;

module.exports = {
  renderToString,
  clientHydrationCode
};
