export function reactive() {}
export function shallowReactive() {}

export function readonly() {}
export function shallowReadonly() {}

// 是不是仅读，是不是深度， 克里化，通过参数判断。 统一实现响应式方法
// new Proxy()
export function createReactiveObject() {}
