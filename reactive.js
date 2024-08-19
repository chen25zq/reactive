// 入口文件，提供 reactive API，接收一个对象，返回一个代理对象

import handlers from './handlers/index.js';
import { isObject } from './utils.js';

// 映射表: 用于存储原始对象和代理对象之间的映射关系
const proxyMap = new WeakMap();

// 将对象转化成Proxy对象
export function reactive(target) {
    // 判断target是否是一个对象
    if (!isObject(target)) {
        return target;
    }

    // 如果target本身就是一个Proxy对象，说明已经被代理过，则直接返回之前代理对象
    if (proxyMap.has(target)) {
        return proxyMap.get(target);
    }

    const proxy = new Proxy(target, handlers);
    proxyMap.set(target, proxy);
    
    return proxy;
}