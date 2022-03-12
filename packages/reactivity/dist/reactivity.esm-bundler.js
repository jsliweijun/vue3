function isObject(val) {
    return typeof val === 'object' && val !== null;
}
const extend = Object.assign;

// 相应式 effect 三大特点：有标识，有类型标识，保留原来函数
/**
 * 创建一个相应式的effect ，作用是 当数据变化时，这个effect能再执行
 * @param fn
 * @param options
 */
function effect(fn, options = {}) {
    // 这里做数据格式化，创建 effect 用另外一个函数
    const effect = createReactiveEffect(fn, options);
    // 根据参数作用后面的操作
    if (!options.lazy) {
        // 默认 effect 会执行
        effect();
    }
    return effect;
}
let uid = 0;
let activeEffect; // 保存当前执行的 effect ，做中间变量，让两个函数能共享它
let effectStack = [];
function createReactiveEffect(fn, options) {
    const effect = function reactiveEffect() {
        // 一次渲染时，判断是否已添加了effect ，避免循环收集
        if (!effectStack.includes(effect)) {
            try {
                effectStack.push(effect);
                activeEffect = effect;
                return fn(); // 传入的cb，这函数里面调用 get方法，会之前 baseHandlers 中的get 方法
            }
            finally {
                effectStack.pop();
                activeEffect = effectStack[effectStack.length - 1];
            }
        }
    };
    // 相应式 effect 三大特点：有标识，有类型标识，保留原来函数
    effect.id = uid;
    effect._isEffect = true;
    effect.raw = fn;
    effect.options = options;
    return effect;
}
/**
 * 收集依赖，数据对应的 effect ，收集 effect ，使用栈结构，保证对应上
 * 让属性收集对应的 effect
 * effect 对应 watcher
 */
const targetMap = new WeakMap();
function track(target, type, key) {
    console.log(target, key, activeEffect);
    // 映射关系 , weakMap
    // {
    //     target: {
    //         key:activeEffect;
    //     }
    // }
    if (activeEffect === undefined) {
        return;
    }
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }
    let dep = depsMap.get(key);
    if (!dep) {
        depsMap.set(key, (dep = new Set()));
    }
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect);
    }
    console.log(targetMap);
}
// 问题场景
// effect(()=>{
//     state.xxx++ // 数据一变，回调执行，这样会进行会无限循环，依赖不需要收集多次
// })

// 创建 4 个 Proxy 到配置对象 new Proxy(target,handler)
//是不是仅读， 没有set 方法
// 是不是深度，
/**
 *
 * @param isReadonly
 * @param shallow
 * @returns
 */
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key, receiver) {
        const res = Reflect.get(target, key, receiver); // target[key]
        // 收集依赖
        if (!isReadonly) {
            // 收集依赖，数据更新后更新视图,收集属性对应的 effect
            track(target, 0 /* GET */, key);
        }
        if (shallow) {
            return res;
        }
        // 返回值是否为对象，要进行深层代理, 这是懒代理。
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
const get = createGetter();
const shollowGet = createGetter(false, true);
const readonlyGet = createGetter(true);
const showllowReadonlyGet = createGetter(true, true);
const mutableHandlers = { get };
const shallowReactiveHandlers = { get: shollowGet };
let readonlyObj = {
    set: (target, key) => {
        console.warn(`set on key ${key}  failed`);
    }
};
const readonlyHandlers = extend({
    get: readonlyGet
}, readonlyObj);
const shallowReaconlyHandlers = extend({ get: showllowReadonlyGet }, readonlyObj);

// 对外提供四个 核心 API ， 对传入的对象实现相应式
// 将代理配置对象封装到另外一个文件
function reactive(target) {
    return createReactiveObject(target, false, mutableHandlers);
}
function shallowReactive(target) {
    return createReactiveObject(target, false, shallowReactiveHandlers);
}
function readonly(target) {
    return createReactiveObject(target, true, readonlyHandlers);
}
function shallowReadonly(target) {
    return createReactiveObject(target, true, shallowReaconlyHandlers);
}
const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();
/**
 *
 * @param target 目标对象
 * @param isReadonly  是否只读
 * @param baseHandlers Proxy 的配置对象 get/set
 */
function createReactiveObject(target, isReadonly, baseHandlers) {
    // target 只能是对象
    if (!isObject(target)) {
        return target;
    }
    // 记录对象是否被代理过,代理过就不被代理
    const proxyMap = isReadonly ? readonlyMap : reactiveMap;
    const existProxy = proxyMap.get(target);
    if (existProxy) {
        return existProxy;
    }
    // 创建代理对象，并记录
    const p = new Proxy(target, baseHandlers);
    proxyMap.set(target, p);
    return p;
}

export { effect, reactive, readonly, shallowReactive, shallowReadonly };
//# sourceMappingURL=reactivity.esm-bundler.js.map
