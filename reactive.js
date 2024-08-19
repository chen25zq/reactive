// 入口文件，提供 reactive API，接收一个对象，返回一个代理对象

import handlers from './handlers/index.js';

// 将对象转化成Proxy对象
export function reactive(target) {
    const proxy = new Proxy(target, handlers);
    return proxy;
}