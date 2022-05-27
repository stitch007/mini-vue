'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function createDep(effects) {
    return new Set(effects);
}

const isObject = (val) => {
    return val !== null && typeof val === 'object';
};
const isArray = Array.isArray;
const extend = Object.assign;
const hasChange = (newValue, oldValue) => !Object.is(newValue, oldValue);

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
            cleanupEffect(this);
            return this.fn();
        }
        finally {
            activeEffect = this.parent;
            this.parent = undefined;
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
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
function stop(runner) {
    runner.effect.stop();
}
function track(target, key) {
    if (isTracking()) {
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
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect);
        activeEffect.deps.push(dep);
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
        if (effect !== activeEffect) {
            if (effect.scheduler) {
                effect.scheduler();
            }
            else {
                effect.run();
            }
        }
    });
}
function isTracking() {
    return activeEffect !== undefined;
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}

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
const toReactive = (value) => isObject(value) ? reactive(value) : value;
function toRaw(value) {
    if (!isObject(value)) {
        return value;
    }
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

function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep || (ref.dep = createDep()));
    }
}
function triggerRefValue(ref) {
    triggerEffect(new Set(ref.dep || []));
}
class RefImpl {
    constructor(value, __v_isShallow) {
        this.__v_isShallow = __v_isShallow;
        this.dep = undefined;
        this.__v_isRef = true;
        this._rawValue = this.__v_isShallow ? value : toRaw(value);
        this._value = this.__v_isShallow ? value : toReactive(value);
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        if (hasChange(newValue, this._rawValue)) {
            this._rawValue = newValue;
            this._value = this.__v_isShallow ? newValue : toReactive(newValue);
            triggerRefValue(this);
        }
    }
}
class ObjectRefImpl {
    constructor(_object, _key) {
        this._object = _object;
        this._key = _key;
        this.__v_isRef = true;
    }
    get value() {
        return this._object[this._key];
    }
    set value(newVal) {
        this._object[this._key] = newVal;
    }
}
function ref(value) {
    return createRef(value);
}
function shallowRef(value) {
    return createRef(value, true);
}
function createRef(value, shallow = false) {
    return new RefImpl(value, shallow);
}
function isRef(value) {
    return !!(value && value.__v_isRef === true);
}
function unref(value) {
    return isRef(value) ? value.value : value;
}
function toRef(object, key) {
    return new ObjectRefImpl(object, key);
}
function toRefs(object) {
    const result = isArray(object) ? new Array(object.length) : {};
    for (const key in object) {
        result[key] = toRef(object, key);
    }
    return result;
}
const shallowUnwrapHandlers = {
    get: (target, key, receiver) => unref(Reflect.get(target, key, receiver)),
    set: (target, key, value, receiver) => {
        const oldValue = target[key];
        if (isRef(oldValue) && !isRef(value)) {
            oldValue.value = value;
            return true;
        }
        else {
            return Reflect.set(target, key, value, receiver);
        }
    }
};
function proxyRefs(object) {
    return isReactive(object) ? object : new Proxy(object, shallowUnwrapHandlers);
}

exports.effect = effect;
exports.isProxy = isProxy;
exports.isReactive = isReactive;
exports.isReadonly = isReadonly;
exports.isRef = isRef;
exports.proxyRefs = proxyRefs;
exports.reactive = reactive;
exports.readonly = readonly;
exports.ref = ref;
exports.shallowReadonly = shallowReadonly;
exports.shallowRef = shallowRef;
exports.stop = stop;
exports.toRaw = toRaw;
exports.toRef = toRef;
exports.toRefs = toRefs;
exports.trackRefValue = trackRefValue;
exports.triggerRefValue = triggerRefValue;
exports.unref = unref;
//# sourceMappingURL=mini-vue.cjs.js.map
