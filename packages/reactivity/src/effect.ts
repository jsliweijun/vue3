// 相应式 effect 三大特点：有标识，有类型标识，保留原来函数

import { isArray, isIntegerKey, isSymbol } from '@vue/shared';
import { TrackOpTypes, TrackOrTypes } from './operators';

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
export function trigger(target: any, type: any, key?: any, newValue?: any, oldValue?: any) {
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
    const add = (effectToAdd: any) => {
        if (effectToAdd) {
            effectToAdd.forEach((effect: any) => effects.add(effect));
        }
    };

    //  判断场景
    // 修改的是不是数组长度
    if (key === 'length' && isArray(target)) {
        depsMap.forEach((dep: any, key: any, a: any) => {
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
    } else {
        // 可能是对象
        if (key !== undefined) {
            add(depsMap.get(key));
        }

        // 修改数组中的索引，新索引，大值 state.arr[1000] = 2000;
        switch (
            type // 如果添加了一个索引就触发长度的更新
        ) {
            case TrackOrTypes.ADD:
                if (isArray(target) && isIntegerKey(key)) {
                    add(depsMap.get('length'));
                }
        }
    }

    effects.forEach((effect: any) => effect());
}
