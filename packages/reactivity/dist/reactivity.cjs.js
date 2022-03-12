'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function isObject(val) {
    return typeof val === 'object' && val !== null;
}
const extend = Object.assign;
const isArray = Array.isArray;
// 判断是否为整型key ，例如数组索引
const isIntegerKey = (value) => parseInt(value) + '' === value;
// 判断对象是否有这个key
let hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (target, key) => hasOwnProperty.call(target, key);
//
const hasChanged = (oldValue, value) => oldValue !== value;
const isSymbol = (value) => typeof value === 'symbol';

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
    // console.log(target, key, activeEffect);
    // 映射关系 , weakMap
    // {
    //     target: {
    //         key:activeEffect;
    //     }
    // }
    //  console.log(key);
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
    // console.log(targetMap);
}
// 问题场景
// effect(()=>{
//     state.xxx++ // 数据一变，回调执行，这样会进行会无限循环，依赖不需要收集多次
// })
/**
 *
 * @param target
 * @param type   操作类型
 * @param key    属性， 数组就给 索引 index
 * @param newValue
 * @param oldValue
 *
 * depsMap = {属性 key，effect}
 */
function trigger(target, type, key, newValue, oldValue) {
    console.log(target, type, key, newValue, oldValue);
    // 如果这个属性没有 收集 effect ，不需要做任何操作
    const depsMap = targetMap.get(target);
    if (!depsMap) {
        return;
    }
    // 收集多个 effects ，去重，统一更新
    const effects = new Set();
    // 将多个effect 放在一起，统一执行
    // dep 使用数组，里面放着多个 effect
    const add = (effectToAdd) => {
        if (effectToAdd) {
            effectToAdd.forEach((effect) => effects.add(effect));
        }
    };
    //  判断场景
    // 修改的是不是数组长度
    if (key === 'length' && isArray(target)) {
        depsMap.forEach((dep, key, a) => {
            //console.log(typeof key);
            if (!isSymbol(key)) {
                //  {arr:[1,2,3]}
                // state.arr.length = 2;
                // 索引大于 新长度 的元素需要被处理 ,3 被移除掉
                if (key === 'length' || key > newValue) {
                    add(dep);
                }
            }
        });
        // let entries = depsMap.entries();
        // for (let i = 0; i < depsMap.size; i++) {
        //     let entry = entries.next().value;
        //     console.log(entry[0], entry[1]);
        // }
    }
    else {
        // 可能是对象
        if (key !== undefined) {
            add(depsMap.get(key));
        }
        // 修改数组中的索引，新索引，大值 state.arr[1000] = 2000;
        switch (type // 如果添加了一个索引就触发长度的更新
        ) {
            case 0 /* ADD */:
                if (isArray(target) && isIntegerKey(key)) {
                    add(depsMap.get('length'));
                }
        }
    }
    effects.forEach((effect) => effect());
}

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
            // 数组时，将 Symbol(Symbol.toPrimitive)  toString jion
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
/**
 * 实现 notify ，更新页面，执行 effect
 * set 要判断数据类型 ：object ，array
 * 做的操作是新增还是修改  add ，set
 *
 * @param shallow
 */
function createSetter(shallow = false) {
    return function set(target, key, value, receiver) {
        const oldValue = target[key]; // 获取老值
        // 是否有key . 判断是不是数组，是数组它的索引在不在里面， 判断是不是对象，有没有key
        let hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
        const result = Reflect.set(target, key, value, receiver); // target[key] = value
        if (!hadKey) {
            // 新增，
            trigger(target, 0 /* ADD */, key, value);
        }
        else if (hasChanged(oldValue, value)) {
            // 修改， 值需要不一样。
            trigger(target, 1 /* SET */, key, value, oldValue);
        }
        return result;
    };
}
const set = createSetter();
const shallowSet = createSetter(true);
const mutableHandlers = { get, set };
const shallowReactiveHandlers = { get: shollowGet, set: shallowSet };
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

exports.effect = effect;
exports.reactive = reactive;
exports.readonly = readonly;
exports.shallowReactive = shallowReactive;
exports.shallowReadonly = shallowReadonly;
//# sourceMappingURL=reactivity.cjs.js.map
