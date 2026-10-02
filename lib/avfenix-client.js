/**
 * @avfenix/client - Cliente de Datos Tipado End-to-End para AVFenix Types
 * Conecta el frontend con las APIs del backend validando automáticamente los esquemas .schema.json
 */

class AVFenixClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || '';
    this.headers = options.headers || { 'Content-Type': 'application/json' };
    this.schemas = options.schemas || {};
    this.interceptors = {
      request: options.interceptors?.request || ((config) => config),
      response: options.interceptors?.response || ((res) => res),
      error: options.interceptors?.error || ((err) => Promise.reject(err))
    };
  }

  /**
   * Registra manifiestos JSON de esquemas compilados (.schema.json)
   */
  registerSchema(entityName, schemaManifest) {
    this.schemas[entityName] = schemaManifest;
  }

  /**
   * Valida un objeto de datos contra el esquema cargado
   */
  validate(entityName, data) {
    const schema = this.schemas[entityName];
    if (!schema) {
      console.warn(`[AVFenix Client] Esquema "${entityName}" no registrado. Omitiendo validación local.`);
      return { valid: true, errors: [] };
    }

    const errors = [];
    const fields = schema.fields || (schema.entities && schema.entities.fields) || {};

    for (const [fieldName, fieldInfo] of Object.entries(fields)) {
      const val = data[fieldName];
      const decorators = fieldInfo.decorators || {};
      const ui = decorators.ui || {};
      const validate = decorators.validate || {};

      // Validación de Requerido
      if (ui.required && (val === undefined || val === null || val === '')) {
        errors.push({ field: fieldName, message: `El campo "${ui.label || fieldName}" es obligatorio.` });
      }

      // Validaciones Numéricas (@validate)
      if (typeof val === 'number') {
        if (validate.min !== undefined && val < validate.min) {
          errors.push({ field: fieldName, message: `El campo "${fieldName}" debe ser mayor o igual a ${validate.min}.` });
        }
        if (validate.max !== undefined && val > validate.max) {
          errors.push({ field: fieldName, message: `El campo "${fieldName}" debe ser menor o igual a ${validate.max}.` });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Petición genérica HTTP Fetch con interceptores y validación
   */
  async request(endpoint, options = {}) {
    const { method = 'GET', body, entity, headers = {}, ...customOpts } = options;

    // Validar datos de envío si se especifica una entidad
    if (body && entity) {
      const validation = this.validate(entity, body);
      if (!validation.valid) {
        const errorMsg = `[AVFenix Client Validation Error] Errores en entidad "${entity}": ` +
          validation.errors.map(e => e.message).join(' | ');
        console.error(errorMsg, validation.errors);
        throw new Error(errorMsg);
      }
    }

    let config = {
      method,
      headers: { ...this.headers, ...headers },
      body: body ? JSON.stringify(body) : undefined,
      ...customOpts
    };

    // Interceptor de petición
    config = await this.interceptors.request(config);

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP Error ${response.status}`);
      }

      const data = await response.json();

      // Interceptor de respuesta
      return await this.interceptors.response(data);
    } catch (err) {
      return await this.interceptors.error(err);
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

/**
 * Fábrica para instanciar clientes de datos
 */
function createClient(options) {
  return new AVFenixClient(options);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AVFenixClient, createClient };
} else if (typeof window !== 'undefined') {
  window.AVFenixClient = AVFenixClient;
  window.createClient = createClient;
}
