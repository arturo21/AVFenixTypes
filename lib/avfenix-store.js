/**
 * @avfenix/store v1.0.0
 * Sistema de Gestión de Estado Global y Signals para AVFenix Types & General.JS
 */

class Store {
  constructor(options = {}) {
    this.name = options.name || 'Store';
    this.history = [];
    this.subscribers = new Set();
    this.isMuted = false;

    const initialState = options.state || {};
    this.mutations = options.mutations || {};
    this.actions = options.actions || {};

    // Proxy para reactividad profunda
    this.state = this._createReactiveProxy(initialState);
    
    // Guardar estado inicial en el historial
    this._recordHistory('INIT', JSON.parse(JSON.stringify(initialState)));
  }

  _createReactiveProxy(target, path = []) {
    const self = this;
    return new Proxy(target, {
      get(obj, prop) {
        const val = Reflect.get(obj, prop);
        if (typeof val === 'object' && val !== null) {
          return self._createReactiveProxy(val, [...path, prop]);
        }
        return val;
      },
      set(obj, prop, value) {
        const oldValue = Reflect.get(obj, prop);
        if (oldValue === value) return true;

        const res = Reflect.set(obj, prop, value);
        if (!self.isMuted) {
          self._recordHistory(`UPDATE:${[...path, prop].join('.')}`, JSON.parse(JSON.stringify(self.state)));
          self.notify();
        }
        return res;
      }
    });
  }

  _recordHistory(type, snapshot) {
    this.history.push({
      timestamp: new Date().toISOString(),
      type,
      state: snapshot
    });
    if (this.history.length > 50) this.history.shift();
  }

  commit(mutationName, payload) {
    if (this.mutations[mutationName]) {
      this.mutations[mutationName](this.state, payload);
      this._recordHistory(`MUTATION:${mutationName}`, JSON.parse(JSON.stringify(this.state)));
      this.notify();
    } else {
      console.warn(`[AVFenix Store] La mutación "${mutationName}" no existe.`);
    }
  }

  async dispatch(actionName, payload) {
    if (this.actions[actionName]) {
      return await this.actions[actionName]({
        state: this.state,
        commit: this.commit.bind(this),
        dispatch: this.dispatch.bind(this)
      }, payload);
    } else {
      console.warn(`[AVFenix Store] La acción "${actionName}" no existe.`);
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    this.subscribers.forEach(cb => cb(this.state));
  }

  timeTravel(index) {
    if (index >= 0 && index < this.history.length) {
      const targetSnapshot = this.history[index].state;
      this.isMuted = true;
      Object.assign(this.state, JSON.parse(JSON.stringify(targetSnapshot)));
      this.isMuted = false;
      this.notify();
      console.log(`[AVFenix Store] Time-travel ejecutado al paso #${index}:`, this.history[index].type);
    }
  }
}

class Signal {
  constructor(initialValue) {
    this._value = initialValue;
    this.subscribers = new Set();
  }

  get value() {
    return this._value;
  }

  set value(newValue) {
    if (this._value !== newValue) {
      this._value = newValue;
      this.notify();
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this._value);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    this.subscribers.forEach(cb => cb(this._value));
  }
}

function createStore(options) {
  return new Store(options);
}

function createSignal(initialValue) {
  return new Signal(initialValue);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Store, Signal, createStore, createSignal };
}
