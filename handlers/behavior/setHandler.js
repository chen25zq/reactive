import trigger from "../../effect/trigger.js";
import { TriggerOPType, hasChanged } from "../../utils.js"

export default function(target, key, value) {
    // console.log(`拦截到了${key}的设置行为, 将${value}设置到原始值上`);

    // 判断原对象上是否有该属性，如果有，则是设置属性，否则是新增属性
    const type = target.hasOwnProperty(key) ? TriggerOPType.SET : TriggerOPType.ADD;

    const oldValue = target[key];
    const oldLen = Array.isArray(target) ? target.length : undefined;

    // 触发更新前的钩子函数
    // 先进行设置操作
    const result = Reflect.set(target, key, value);

    if (hasChanged(oldValue, value)) {
        // 是否派发更新，要进行判断，如果设置的值一样，则不派发更新
        trigger(target, type, key);

        // 需要判断 length 是否发生变化。如果有，则需要触发 length 相关的更新
        if (Array.isArray(target) && oldLen !== target.length && key !== 'length') {
            trigger(target, TriggerOPType.SET, 'length');
        }
    }

    return result;
}