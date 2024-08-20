import { TrackOPType, TriggerOPType, ITERATE_KEY } from '../utils.js';
import { activeEffect, targetMap } from "./effect.js";

/**
 * 事件触发器：用于在响应式数据写入数据操作的时候触发事件，通知依赖该数据的组件更新
 * 
 * 依赖收集一般是 get、has、iterate 等方法，在这些方法中收集依赖，并将依赖的组件添加到依赖列表中
 * 那么在派发更新这里的操作就是 add、set、delete 等方法，在这些方法中进行更新，但是这些在收集的依赖中是找不到的
 * 
 * 因此要有一个依赖和触发器的一个映射关系：需要建立一个设置行为和读取行为的映射关系，需要根据具体的行为来建立映射关系。从而找到依赖函数
 * set：get
 * add：get、iterate、has
 * delete：get、iterate、has
 * 
 */

// 依赖和触发器的映射关系
const triggerTypeMap = {
    [TriggerOPType.SET]: [TrackOPType.GET],
    [TriggerOPType.ADD]: [TrackOPType.GET, TrackOPType.ITERATE, TrackOPType.HAS],
    [TriggerOPType.DELETE]: [TrackOPType.GET, TrackOPType.ITERATE, TrackOPType.HAS]
}

// 根据 target、type 和 key 找到依赖函数
export default function(target, type, key) {
    // 要做的事情很简单，就是找到依赖，然后执行依赖
    const effectFns = getEffectFns(target, type, key);
    if (!effectFns) return;
    for (const effectFn of effectFns) {
        if (effectFn === activeEffect) continue;
        if (effectFn.options && effectFn.options.shcheduler) {
            // 说明用户传递了回调函数，用户期望自己来处理依赖的函数
            effectFn.options.shcheduler(effectFn);
        } else {
            // 执行依赖函数
            effectFn();
        }
    }
}

function getEffectFns(target, type, key) {
    const propMap = targetMap.get(target)
    if (!propMap) return;

    // 如果是新增或者删除，那触发遍历和 has 操作
    const keys = [key];
    if (type === TriggerOPType.ADD || type === TriggerOPType.DELETE) {
        keys.push(ITERATE_KEY);
    }

    const effectsFns = new Set(); // 依赖函数集合,set 去重

    for(let key in keys) {
        const typeMap = propMap.get(key);
        if (!typeMap) continue;

        const trackTypes = triggerTypeMap[type];
        for(let trackType in trackTypes) {
            const dep = typeMap.get(trackType);
            if (!dep) continue;

            for(let effect of dep) {
                effectsFns.add(effect);
            }
        }
    }
    return effectsFns;
}