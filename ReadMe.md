# 实现响应式系统

**核心要素**

要实现一个响应式系统，最为核心的有两个部分：

1. 监听数据的读写
2. 关联数据和函数

只要把这两个部分完成了，那么整个响应式系统也就基本成型了。

**监听数据读写**

- 数据：在 JS 中，能够拦截读写的方式，要么 Object.defineProperty，要么就是 Proxy，这两个方法针对的目标是对象，因此我们这里考虑对对象类型进行监听,采用 Proxy 方式进行监听。
- 读写：虽然说是监听读写，但是细分下来要监听的行为如下：
  - 获取属性：读取
  - 设置属性：写入
  - 新增属性：写入
  - 删除属性：写入
  - 是否存在某个属性：读取
  - 遍历属性：读取


## 核心实现

```js
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
```

- 注意： package.json 文件中配置了 "type": "module" 
目的：为了让 JS 能够识别 import 语法，否则会报错。

主要效果是告诉Node.js，这个项目中的所有 .js 文件都应该被视为ES模块（ES Module），而不是传统的CommonJS模块。


#### handlers

```js
import getHandler from "./behavior/getHandler.js";
import setHandler from "./behavior/setHandler.js";
import deleteHandler from "./behavior/deleteHandler.js";
import hasHandler from "./behavior/hasHandler.js";
import ownKeysHandler from "./behavior/ownKeysHandler.js";

export default {
    get: getHandler,
    set: setHandler,
    deleteProperty: deleteHandler, // 删除属性 delete rst.a;
    has: hasHandler, // 判断对象是否拥有某个属性 "a" in rst;
    ownKeys: ownKeysHandler // 遍历 for (let key in rst) {}
}
```

#### 读取行为

```js
import track from "../../effect/track.js";
import { TrackOPType, isObject } from "../../utils.js";
import { reactive } from "../../reactive.js";

export default function(target, key) {
    console.log(`拦截到了${key}的读取行为, 将值返回`);
    // 针对读取行为，要做依赖收集
    track(target, TrackOPType.GET, key);

    const result = Reflect.get(target, key);    
    // 获取到的成员可能是对象，需要递归处理，转换成响应式对象
    if (isObject(result)) {
        return reactive(result);
    }
    return result;
}
```

#### 写入行为

```js
import trigger from "../../effect/trigger.js";
import { TriggerOPType, hasChanged } from "../../utils.js"

export default function(target, key, value) {
    // console.log(`拦截到了${key}的设置行为, 将${value}设置到原始值上`);

    // 判断原对象上是否有该属性，如果有，则是设置属性，否则是新增属性
    const type = target.hasOwnProperty(key) ? TriggerOPType.SET : TriggerOPType.ADD;
    const oldValue = target[key];
    // 先进行设置操作
    const result = Reflect.set(target, key, value);

    if (hasChanged(oldValue, value)) {
        // 是否派发更新，要进行判断，如果设置的值一样，则不派发更新
        trigger(target, type, key);
    }

    return result;
}
```


#### 删除行为

```js
import trigger from "../../effect/trigger.js";
import { TriggerOPType } from "../../utils.js";

export default function(target, key) {

    // 先判断是否有对应的属性才能删除
    const hasKey = target.hasOwnProperty(key);
    // 进行删除行为
    const rst = Reflect.deleteProperty(target, key);
    // 先判断是否有对应的属性才能触发更新
    if (hasKey && rst) {
        trigger(target, TriggerOPType.DELETE, key);
    }
    return rst;
}
```

#### 依赖收集

```js
/**
 * 依赖收集核心
 * @param {*} target 收集对象
 * @param {*} type 操作的类型
 * @param {*} key 对象属性
 */
export default function(target, type, key) {
    console.log("原始对象: ", target);
    console.log(`track 依赖收集 ${key} 属性  ${type} 操作被拦截`);
}
```

#### 触发更新

```js
/**
 * 事件触发器：用于在响应式数据写入数据操作的时候触发事件，通知依赖该数据的组件更新
 */

export default function(target, type, key) {
    console.log(`事件触发器原对象：`, target);
    console.log(`触发的 ${key} 属性 ${type} 操作被拦截`);
}
```


## 数组中查找对象出现找不到问题

在代理对象的时候，是进行递归代理的，因此如果对象成员中包含了对象，也会被代理，这也就导致数组中出现对象，而这个对象被代理过了，因此再使用 console.log(proxyArr.includes(obj)); // false ?的时候会发现不存在

原因是obj 是原始对象，而proxyArr对于这个对象已经代理过了，因此代理对象和原始对象不相同，所以找不到

解决方案：先正常找，如果找不到就去原始对象上找

```js
import track from "../../effect/track.js";
import { TrackOPType, isObject, RAW } from "../../utils.js";
import { reactive } from "../../reactive.js";

const arrayInstrumentations = {};
// 数组的includes、indexOf、lastIndexOf方法的拦截器, 重写这三个方法
['includes', 'indexOf', 'lastIndexOf'].forEach(key => {
    arrayInstrumentations[key] = function(...args) {
        // 正常找，此时 this 指向代理对象
        const rst = Array.prototype[key].apply(this, args);
        // 找不到: 返回 -1 或者 includes 返回false
        if (rst === -1 || rst === false) {
            // 此时拦截器返回原始对象
            return Array.prototype[key].apply(this[RAW], args);
        }
        return res;
    }
})


export default function(target, key) {
    // 处理数组的includes、indexOf、lastIndexOf方法加的特殊标识符
    if (key === RAW) { // 这个标识不能和已有属性重复，所以使用 symobl 作为标识符
        return target; // 原始对象直接返回
    }

    // 针对读取行为，要做依赖收集
    track(target, TrackOPType.GET, key);

    // 如果是数组的某些方法，需要对这些方法进行重写，因为原始对象已经变成了代理对象，所以找不到
    if (Array.isArray(target) && arrayInstrumentations.hasOwnProperty(key)) {
        return arrayInstrumentations[key];
    }

    const result = Reflect.get(target, key);    
    // 获取到的成员可能是对象，需要递归处理，转换成响应式对象
    if (isObject(result)) {
        return reactive(result);
    }
    return result;
}

```
