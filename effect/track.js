import { activeEffect, targetMap } from "./effect.js";
import { TrackOPType, ITERATE_KEY } from "../utils.js";

let shoudTrack = true; // 是否开启依赖收集

// 暂停收集
export function pauseTrack() {
    shoudTrack = false;
}

// 恢复收集
export function resumeTrack() {
    shoudTrack = true;
}

/**
 * 依赖收集核心
 * @param {*} target 收集对象
 * @param {*} type 操作的类型
 * @param {*} key 对象属性
 */
export default function(target, type, key) {
    if (!shoudTrack) return; // 无须收集
    
    // 这里要做的任务就是一层层找，找到依赖就存储起来
    let propMap = targetMap.get(target);
    if (!propMap) {
        propMap = new Map();
        targetMap.set(target, propMap);
    }

    // 对key进行参数归一化
    if (key === TrackOPType.ITERATE) {
        // 处理遍历时，key为undefined，因此要给一个特定的值
        key = ITERATE_KEY;
    }

    let typeMap = propMap.get(key);
    if (!typeMap) {
        typeMap = new Map();
        propMap.set(key, typeMap);  
    }

    // 根据 type 值找对应的依赖
    let depSet = typeMap.get(type);
    if (!depSet) {
        depSet = new Set();
        typeMap.set(type, depSet);
    }

    // 找到 set 集合，将 activeEffect 存入依赖
    if(!depSet.has(activeEffect)) {
        depSet.add(activeEffect);
        activeEffect.deps.push(depSet); // 将集合存储到 deps 中
    }
}