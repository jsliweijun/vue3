const Shared = {};

export default Shared;

export function isObject(val: Object) {
    return typeof val === 'object' && val !== null;
}

export const extend = Object.assign;
