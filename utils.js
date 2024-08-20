
/**
 * 收集依赖的映射关系
 */
export const TrackOPType = {
    GET: 'get',
    HAS: 'has',
    ITERATE: 'iterate',
}

// 触发器相关的操作类型
export const TriggerOPType = {
    SET:'set',
    ADD: 'add',
    DELETE: 'delete',
}

export function isObject(val) {
    return typeof val === 'object' && val !== null
}

/**
 * 判断值是否改变
 * @param {any} oldVal 旧值
 * @param {any} newVal 新值
 * @returns {boolean} 是否改变
 */
export function hasChanged(oldVal, newVal) {
    // Object.is 来判断，可以规避些特殊情况：NaN === NaN 为 false，0 === -0 为 true
    return !Object.is(oldVal, newVal);
}

// 特殊标识
export const RAW = Symbol('RAW')

export const ITERATE_KEY = Symbol('iterate')