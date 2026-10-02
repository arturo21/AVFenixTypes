/**
 * @avfenix/test-utils v1.0.0
 * Suite de Pruebas y Utilidades de Montaje para Componentes AVFenix (.avf)
 */

(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    global.AVFenixTestUtils = factory();
  }
}(this, (function () {
  'use strict';

  /**
   * Envoltorio de Componente para Inspección y Simulación de Eventos
   */
  class ComponentWrapper {
    constructor(componentInstance, container) {
      this.instance = componentInstance;
      this.container = container;
    }

    /**
     * Retorna el HTML renderizado en el contenedor
     */
    html() {
      return this.container.innerHTML.trim();
    }

    /**
     * Busca un elemento en el DOM del contenedor por selector CSS
     */
    find(selector) {
      const el = this.container.querySelector(selector);
      if (!el) {
        throw new Error(`[AVFenix TestUtils] Elemento no encontrado con selector: "${selector}"`);
      }
      return el;
    }

    /**
     * Busca múltiples elementos por selector CSS
     */
    findAll(selector) {
      return Array.from(this.container.querySelectorAll(selector));
    }

    /**
     * Simula la activación de un evento sobre un elemento (click, input, submit, etc.)
     */
    trigger(selector, eventName, eventInit = {}) {
      const el = typeof selector === 'string' ? this.find(selector) : selector;
      let event;
      
      if (typeof window !== 'undefined' && window.Event) {
        event = new Event(eventName, { bubbles: true, cancelable: true, ...eventInit });
      } else {
        event = { type: eventName, ...eventInit, preventDefault: () => {}, stopPropagation: () => {} };
      }

      if (el.dispatchEvent) {
        el.dispatchEvent(event);
      } else if (typeof el[`on${eventName}`] === 'function') {
        el[`on${eventName}`](event);
      }
      return this;
    }

    /**
     * Actualiza las props del componente montado
     */
    setProps(newProps) {
      if (this.instance && typeof this.instance.setProps === 'function') {
        this.instance.setProps(newProps);
      } else if (this.instance) {
        this.instance.props = { ...this.instance.props, ...newProps };
        if (typeof this.instance.render === 'function') {
          this.instance.render();
        }
      }
      return this;
    }

    /**
     * Desmonta el componente y limpia el nodo contenedor del DOM
     */
    destroy() {
      if (this.instance && typeof this.instance.onDestroy === 'function') {
        this.instance.onDestroy();
      }
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      this.container.innerHTML = '';
    }
  }

  /**
   * Monta un componente .avf en un contenedor DOM/JSDOM aislado
   */
  function mount(ComponentClass, props = {}, options = {}) {
    let container = options.attachTo;
    
    if (!container) {
      if (typeof document !== 'undefined') {
        container = document.createElement('div');
        container.setAttribute('data-avfenix-test-container', 'true');
        document.body.appendChild(container);
      } else {
        container = { innerHTML: '', querySelector: () => null, querySelectorAll: () => [] };
      }
    }

    let instance;
    if (typeof ComponentClass === 'function') {
      try {
        instance = new ComponentClass(props, container);
      } catch (e) {
        instance = ComponentClass(props);
      }
    } else {
      instance = ComponentClass;
    }

    return new ComponentWrapper(instance, container);
  }

  /**
   * Utilidad de aserciones liviana para pruebas sin dependencias externas
   */
  const assert = {
    equal(actual, expected, message = '') {
      if (actual !== expected) {
        throw new Error(`[Assert Failed] ${message} | Esperado: ${expected}, Obtenido: ${actual}`);
      }
    },
    contains(html, text, message = '') {
      if (!html.includes(text)) {
        throw new Error(`[Assert Failed] ${message} | El HTML no contiene el texto: "${text}"`);
      }
    },
    isTrue(condition, message = '') {
      if (!condition) {
        throw new Error(`[Assert Failed] ${message} | La condición no se cumple.`);
      }
    }
  };

  return {
    mount,
    assert
  };
})));
