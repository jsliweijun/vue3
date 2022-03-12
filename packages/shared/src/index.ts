const Shared = {};

export default Shared;

export function isObject(val: Object) {
    return typeof val === 'object' && val !== null;
}

export const extend = Object.assign;
export const isArray = Array.isArray;
export const isFunction = (value: any) => typeof value === 'function';
export const isNumber = (value: any) => typeof value === 'number';
export const isString = (value: any) => typeof value === 'string';

// 判断是否为整型key ，例如数组索引
export const isIntegerKey = (value: any) => parseInt(value) + '' === value;

// 判断对象是否有这个key
let hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOwn = (target: object, key: string) => hasOwnProperty.call(target, key);

//
export const hasChanged = (oldValue: any, value: any) => oldValue !== value;

export const isSymbol = (value: any) => typeof value === 'symbol';
