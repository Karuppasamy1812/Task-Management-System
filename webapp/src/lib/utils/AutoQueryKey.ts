declare global {
  interface Function {
    key?: string;
  }
}

type ClassConstructor<T = object> = new (...args: any[]) => T;
const classProxyCache = new WeakMap<ClassConstructor, ClassConstructor>();
const methodProxyCache = new WeakMap<Function, Function>();

function createMethodProxy(fn: Function, className: string, methodName: string | symbol) {
  if (methodProxyCache.has(fn)) return methodProxyCache.get(fn);
  const methodProxy = new Proxy(fn, {
    get(_target: any, key: string | symbol) {
      if (key === 'key') return `${className}.${String(methodName)}`;
      return Reflect.get(fn, key);
    },
  });
  methodProxyCache.set(fn, methodProxy);
  return methodProxy;
}

function createProxy<T extends ClassConstructor>(constructor: T): T {
  if (classProxyCache.has(constructor)) return classProxyCache.get(constructor) as T;
  const proxy = new Proxy(constructor, {
    get(target: T, prop: string | symbol, receiver: any): any {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === 'function') return createMethodProxy(value, target.name, prop);
      return value;
    },
  });
  classProxyCache.set(constructor, proxy);
  return proxy;
}

export function AutoQueryKey(): <T extends ClassConstructor>(constructor: T) => T;
export function AutoQueryKey<T extends ClassConstructor>(constructor: T): T;
export function AutoQueryKey<T extends ClassConstructor>(constructor?: T): T | ((constructor: T) => T) {
  if (constructor) return createProxy(constructor);
  return (ctor: T) => createProxy(ctor);
}
