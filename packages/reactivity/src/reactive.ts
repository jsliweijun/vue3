// 对外提供四个 核心 API ， 对传入的对象实现相应式
// 是不是仅读，是不是深度， 克里化，通过参数判断。 统一实现响应式方法
// new Proxy(target,handler)

import { mutableHandlers, shallowReaconlyHandlers, shallowReactiveHandlers, readonlyHandlers } from './baseHandlers';

import { isObject } from '@vue/shared';

// 将代理配置对象封装到另外一个文件

export function reactive(target: any) {
    return createReactiveObject(target, false, mutableHandlers);
}
export function shallowReactive(target: any) {
    return createReactiveObject(target, false, shallowReactiveHandlers);
}
export function readonly(target: any) {
    return createReactiveObject(target, true, readonlyHandlers);
}
export function shallowReadonly(target: any) {
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
export function createReactiveObject(target: Object, isReadonly: Boolean, baseHandlers: Object) {
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
