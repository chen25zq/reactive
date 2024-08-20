# 图解EFFECT

effect 方法的作用：就是将 **函数** 和 **数据** 关联起来。

回忆 watchEffect

```js
import { ref, watchEffect } from "vue";
const state = ref({ a: 1 });
const k = state.value;
const n = k.a;
// 这里就会整理出 state.value、state.value.a
watchEffect(() => {
  console.log("运行");
  state;
  state.value;
  state.value.a;
  n;
});
setTimeout(() => {
  state.value = { a: 3 }; // 要重新运行，因为是对 value 的写入操作
}, 500);
```



effect函数的设计：

```js
// 原始对象
const data = {
  a: 1,
  b: 2,
  c: 3,
};
// 产生一个代理对象
const state = new Proxy(data, { ... });
effect(() => {
  console.log(state.a);
});
```

在上面的代码中，向 effect 方法传入的回调函数中，访问了 state 的 a 成员，然后我们期望 a 这个成员和这个回调函数建立关联。

第一版实现如下：

```js
let activeEffect = null; // 记录当前的函数
const depsMap = new Map(); // 保存依赖关系

function track(target, key) {
  // 建立依赖关系
  if (activeEffect) {
    let deps = depsMap.get(key); // 根据属性值去拿依赖的函数集合
    if (!deps) {
      deps = new Set(); // 创建一个新的集合
      depsMap.set(key, deps); // 将集合存入 depsMap
    }
    // 将依赖的函数添加到集合里面
    deps.add(activeEffect);
  }
  console.log(depsMap);
}

function trigger(target, key) {
  // 这里面就需要运行依赖的函数
  const deps = depsMap.get(key);
  if (deps) {
    deps.forEach((effect) => effect());
  }
}

// 原始对象
const data = {
  a: 1,
  b: 2,
  c: 3,
};
// 代理对象
const state = new Proxy(data, {
  get(target, key) {
    track(target, key); // 进行依赖收集
    return target[key];
  },
  set(target, key, value) {
    target[key] = value;
    trigger(target, key); // 派发更新
    return true;
  },
});

/**
 *
 * @param {*} fn 回调函数
 */
function effect(fn) {
  activeEffect = fn;
  fn();
  activeEffect = null;
}

effect(() => {
  // 这里在访问 a 成员时，会触发 get 方法，进行依赖收集
  console.log('执行函数')
  console.log(state.a);
});
state.a = 10;

```

第一版实现，**每个属性对应一个 Set 集合**，该集合里面是所依赖的函数，所有属性与其对应的依赖函数集合形成一个 map 结构，如下图所示：

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-05-30-005612.png" alt="image-20240530085612443" style="zoom:50%;" />

activeEffect 起到一个中间变量的作用，临时存储这个回调函数，等依赖收集完成后，再将这个临时变量设置为空即可。

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-05-30-010642.png" alt="image-20240530090641942" style="zoom:50%;" />

**问题一**：每一次运行回调函数的时候，都应该确定新的依赖关系。

稍作修改：

```js
effect(() => {
  if (state.a === 1) {
    state.b;
  } else {
    state.c;
  }
  console.log("执行了函数");
});
```

在上面的代码中，两次运行回调函数，所建立的依赖关系应该是不一样的：

- 第一次：a、b
- 第二次：a、c

第一次运行依赖如下：

```js
Map(1) { 'a' => Set(1) { [Function (anonymous)] } }
Map(2) {
  'a' => Set(1) { [Function (anonymous)] },
  'b' => Set(1) { [Function (anonymous)] }
}
执行了函数
```

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-05-30-011134.png" alt="image-20240530091134221" style="zoom:50%;" />

执行 state.a = 100

依赖关系变为了：

```js
Map(1) { 'a' => Set(1) { [Function (anonymous)] } }
Map(2) {
  'a' => Set(1) { [Function (anonymous)] },
  'b' => Set(1) { [Function (anonymous)] }
}
执行了函数
Map(2) {
  'a' => Set(1) { [Function (anonymous)] },
  'b' => Set(1) { [Function (anonymous)] }
}
Map(2) {
  'a' => Set(1) { [Function (anonymous)] },
  'b' => Set(1) { [Function (anonymous)] }
}
执行了函数
```

当 a 的值修改为 100 后，依赖关系应该重新建立，也就是说：

- 第一次运行：建立 a、b 依赖
- 第二次运行：建立 a、c 依赖

那么现在 a 的值明明已经变成 100 了，为什么重新执行回调函数的时候，没有重新建立依赖呢？

原因也很简单，如下图所示：

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-05-30-012138.png" alt="image-20240530092137893" style="zoom:50%;" />

**第一次建立依赖关系的时候，是将依赖函数赋值给 activeEffect，最终是通过 activeEffect 这个中间变量将依赖函数添加进依赖列表的**。依赖函数执行完毕后，activeEffect 就设置为了 null，之后 a 成员的值发生改变，重新运行的是回调函数，但是 activeEffect 的值依然是 null，这就会导致 track 中依赖收集的代码根本进不去：

```js
function track(target, key) {
  if (activeEffect) {
    // ...
  }
}
```

怎么办呢？也很简单，**我们在收集依赖的时候，不再是仅仅收集回调函数，而是收集一个包含 activeEffect 的环境**，继续改造 effect：

```js
function effect(fn) {
  const environment = () => {
    activeEffect = environment;
    fn();
    activeEffect = null;
  };
  environment();
}
```

这里 activeEffect 对应的值，不再是像之前那样是回调函数，而是一整个 environment 包含环境信息的函数，这样当重新执行依赖的函数的时候，执行的也就是这个环境函数，而环境函数的第一行就是 activeEffect 赋值，这样就能够正常的进入到依赖收集环节。

如下图所示：

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-05-30-012752.png" alt="image-20240530092751730" style="zoom:50%;" />

**问题二：**旧的依赖没有删除

解决方案：在执行 fn 方法之前，先调用了一个名为 cleanup 的方法，该方法的作用就是用来清除依赖。

该方法代码如下：

```js
function cleanup(environment) {
  let deps = environment.deps; // 拿到当前环境函数的依赖（是个数组）
  if (deps.length) {
    deps.forEach((dep) => {
      dep.delete(environment);
      if (dep.size === 0) {
        for (let [key, value] of depsMap) {
          if (value === dep) {
            depsMap.delete(key);
          }
        }
      }
    });
    deps.length = 0;
  }
}
```

具体结构如下图所示：

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-05-30-014306.png" alt="image-20240530094306251" style="zoom:50%;" />



**测试多个依赖函数**

```js
effect(() => {
  if (state.a === 1) {
    state.b;
  } else {
    state.c;
  }
  console.log("执行了函数1");
});
effect(() => {
  console.log(state.c);
  console.log("执行了函数2");
});
state.a = 2;
```

```js
effect(() => {
  if (state.a === 1) {
    state.b;
  } else {
    state.c;
  }
  console.log("执行了函数1");
});
effect(() => {
  console.log(state.a);
  console.log(state.c);
  console.log("执行了函数2");
});
state.a = 2;
```

解决无限循环问题：

在 track 函数中，每次 state.a 被访问时，都会重新添加当前的 activeEffect 到依赖集合中。而在 trigger 函数中，当 state.a 被修改时，会触发所有依赖 state.a 的 effect 函数，这些 effect 函数中又会重新访问 state.a，从而导致了无限循环。具体来讲：

1. 初始执行 effect 时，state.a 的值为 1，因此第一个 effect 会访问 state.b，第二个 effect 会访问 state.a 和 state.c。 
2. state.a 被修改为 2 时，trigger 函数会触发所有依赖 state.a 的 effect 函数。 
3. 第二个 effect 函数被触发后，会访问 state.a，这时 track 函数又会把当前的 activeEffect 添加到 state.a 的依赖集合中。 
4. 因为 state.a 的值被修改，会再次触发 trigger，导致第二个 effect 函数再次执行，如此循环往复，导致无限循环。

要解决这个问题，可以在 trigger 函数中添加一些机制来防止重复触发同一个 effect 函数，比如使用一个 Set 来记录已经触发过的 effect 函数：

```js
function trigger(target, key) {
  const deps = depsMap.get(key);
  if (deps) {
    const effectsToRun = new Set(deps); // 复制一份集合，防止在执行过程中修改原集合
    effectsToRun.forEach((effect) => effect());
  }
}
```



**测试嵌套函数**

```js
effect(() => {
  effect(() => {
    state.a
    console.log("执行了函数2");
  });
  state.b;
  console.log("执行了函数1");
});
```

会发现所建立的依赖又不正常了：

```js
Map(1) { 'a' => Set(1) { [Function: environment] { deps: [Array] } } }
执行了函数2
Map(1) { 'a' => Set(1) { [Function: environment] { deps: [Array] } } }
执行了函数1
```

究其原因，是目前的函数栈有问题，当执行到内部的 effect 函数时，会将 activeEffect 设置为 null，如下图所示：

<img src="https://xiejie-typora.oss-cn-chengdu.aliyuncs.com/2024-05-30-023612.png" alt="image-20240530103611905" style="zoom:50%;" />

解决方案：模拟函数栈的形式。

---

-EOF-

