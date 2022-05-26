'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function createDep(effects) {
    return new Set(effects);
}

let shouldTrack = false;
let activeEffect;
const targetMap = new WeakMap();
class ReactiveEffect {
    constructor(fn, scheduler = null) {
        this.fn = fn;
        this.scheduler = scheduler;
        this.active = true;
        this.deps = [];
        this.parent = undefined;
    }
    run() {
        if (!this.active) {
            this.fn();
        }
        try {
            this.parent = activeEffect;
            activeEffect = this;
            shouldTrack = true;
            return this.fn();
        }
        finally {
            activeEffect = this.parent;
            this.parent = undefined;
            shouldTrack = false;
        }
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            this.onStop && this.onStop();
            this.active = false;
        }
    }
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn);
    Object.assign(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
function stop(runner) {
    runner.effect.stop();
}
function track(target, key) {
    if (shouldTrack && activeEffect) {
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()));
        }
        let dep = depsMap.get(key);
        if (!dep) {
            depsMap.set(key, (dep = createDep()));
        }
        trackEffects(dep);
    }
}
function trackEffects(dep) {
    if (shouldTrack) {
        if (!dep.has(activeEffect)) {
            dep.add(activeEffect);
            activeEffect.deps.push(dep);
        }
    }
}
function trigger(target, key) {
    const deps = [];
    const effects = [];
    const depsMap = targetMap.get(target);
    if (!depsMap) {
        return;
    }
    deps.push(depsMap.get(key));
    deps.forEach((dep) => {
        dep && effects.push(...dep);
    });
    triggerEffect(createDep(effects));
}
function triggerEffect(dep) {
    dep.forEach((effect) => {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    });
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}

const isObject = (val) => {
    return val !== null && typeof val === 'object';
};

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true, false);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key, receiver) {
        if (key === "__v_isReactive") {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly") {
            return isReadonly;
        }
        else if (key === "__v_raw") {
            return target;
        }
        const result = Reflect.get(target, key, receiver);
        if (!isReadonly) {
            track(target, key);
        }
        if (shallow) {
            return result;
        }
        if (isObject(result)) {
            return isReadonly ? readonly(result) : reactive(result);
        }
        return result;
    };
}
function createSetter() {
    return function set(target, key, value, receiver) {
        const res = Reflect.set(target, key, value, receiver);
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = { get, set };
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
        console.warn(`Set operation on key "${key}" failed: target is readonly.`, target);
        return true;
    }
};
const shallowReadonlyHandlers = {
    get: shallowReadonlyGet,
    set(target, key) {
        console.warn(`Set operation on key "${key}" failed: target is readonly.`, target);
        return true;
    },
};

const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();
const shallowReadonlyMap = new WeakMap();
var ReactiveFlags;
(function (ReactiveFlags) {
    ReactiveFlags["IS_REACTIVE"] = "__v_isReactive";
    ReactiveFlags["IS_READONLY"] = "__v_isReadonly";
    ReactiveFlags["IS_RAW"] = "__v_raw";
})(ReactiveFlags || (ReactiveFlags = {}));
function reactive(target) {
    return createReactiveObject(target, reactiveMap, mutableHandlers);
}
function readonly(target) {
    return createReactiveObject(target, readonlyMap, readonlyHandlers);
}
function shallowReadonly(target) {
    return createReactiveObject(target, shallowReadonlyMap, shallowReadonlyHandlers);
}
function isReactive(value) {
    return !!value["__v_isReactive"];
}
function isReadonly(value) {
    return !!value["__v_isReadonly"];
}
function isProxy(value) {
    return isReactive(value) || isReadonly(value);
}
function toRaw(value) {
    if (!value["__v_raw"]) {
        return value;
    }
    return value["__v_raw"];
}
function createReactiveObject(target, proxyMap, baseHandlers) {
    const existingProxy = proxyMap.get(target);
    if (existingProxy) {
        return existingProxy;
    }
    const proxy = new Proxy(target, baseHandlers);
    proxyMap.set(target, proxy);
    return proxy;
}

exports.effect = effect;
exports.isProxy = isProxy;
exports.isReactive = isReactive;
exports.isReadonly = isReadonly;
exports.reactive = reactive;
exports.readonly = readonly;
exports.shallowReadonly = shallowReadonly;
exports.stop = stop;
exports.toRaw = toRaw;
//# sourceMappingURL=mini-vue.cjs.js.map
