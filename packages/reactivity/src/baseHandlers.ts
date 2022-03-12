// 创建 4 个 Proxy 到配置对象 new Proxy(target,handler)

import { extend, hasChanged, hasOwn, isArray, isIntegerKey, isObject } from '@vue/shared';
import { track, trigger } from './effect';
import { TrackOpTypes, TrackOrTypes } from './operators';
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
            // 收集依赖，数据更新后更新视图,收集属性对应的 effect
            // 数组时，将 Symbol(Symbol.toPrimitive)  toString jion
            track(target, TrackOpTypes.GET, key);
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
    return function set(target: any, key: any, value: any, receiver: any) {
        const oldValue = target[key]; // 获取老值

        // 是否有key . 判断是不是数组，是数组它的索引在不在里面， 判断是不是对象，有没有key
        let hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);

        const result = Reflect.set(target, key, value, receiver); // target[key] = value

        if (!hadKey) {
            // 新增，
            trigger(target, TrackOrTypes.ADD, key, value);
        } else if (hasChanged(oldValue, value)) {
            // 修改， 值需要不一样。
            trigger(target, TrackOrTypes.SET, key, value, oldValue);
        }

        return result;
    };
}

const set = createSetter();
const shallowSet = createSetter(true);

export const mutableHandlers = { get, set };
export const shallowReactiveHandlers = { get: shollowGet, set: shallowSet };

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
