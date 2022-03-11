// 创建 4 个 Proxy 到配置对象 new Proxy(target,handler)

import { extend, isObject } from '@vue/shared';
import { reactive, readonly } from './reactive';

//是不是仅读， 没有set 方法
// 是不是深度，

/**
 *
 * @param isReadonly
 * @param shallow
 * @returns
 */
function createGetter(isReadonly = false, shallow = false) {
    return function get(target: object, key: string, receiver: object) {
        const res = Reflect.get(target, key, receiver); // target[key]

        // 收集依赖
        if (!isReadonly) {
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

function createSetter(shallow = false) {}

const set = createSetter();
const shallowSet = createSetter(true);

export const mutableHandlers = { get };
export const shallowReactiveHandlers = { get: shollowGet };

let readonlyObj = {
    set: (target: object, key: string) => {
        console.warn(`set on key ${key}  failed`);
    }
};

export const readonlyHandlers = extend(
    {
        get: readonlyGet
    },
    readonlyObj
);
export const shallowReaconlyHandlers = extend({ get: showllowReadonlyGet }, readonlyObj);
