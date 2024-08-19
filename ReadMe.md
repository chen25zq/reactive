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