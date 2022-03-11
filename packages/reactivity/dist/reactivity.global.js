var VueReactivity = (function (exports) {
    'use strict';

    function isObject(val) {
        return typeof val === 'object' && val !== null;
    }
    const extend = Object.assign;

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

    exports.reactive = reactive;
    exports.readonly = readonly;
    exports.shallowReactive = shallowReactive;
    exports.shallowReadonly = shallowReadonly;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=reactivity.global.js.map
