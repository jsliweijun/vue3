// 相应式 effect 三大特点：有标识，有类型标识，保留原来函数

import { TrackOpTypes } from './operators';

/**
 * 创建一个相应式的effect ，作用是 当数据变化时，这个effect能再执行
 * @param fn
 * @param options
 */
export function effect(fn: Function, options: any = {}) {
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
let activeEffect: any; // 保存当前执行的 effect ，做中间变量，让两个函数能共享它
let effectStack: any = [];
function createReactiveEffect(fn: Function, options: any) {
    const effect = function reactiveEffect() {
        // 一次渲染时，判断是否已添加了effect ，避免循环收集
        if (!effectStack.includes(effect)) {
            try {
                effectStack.push(effect);
                activeEffect = effect;
                return fn(); // 传入的cb，这函数里面调用 get方法，会之前 baseHandlers 中的get 方法
            } finally {
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
export function track(target: object, type: TrackOpTypes, key: string) {
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
