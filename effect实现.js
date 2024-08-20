// effect 函数实现

let activeEffect = null; // 当前正在执行的 effect 函数
const depsMap = new Map(); // 存储依赖关系的 Map
const effectStack = []; // 用来记录 effect 函数执行栈

const track = (target, key) => {
    // 建立响应式数据和 effect 函数的依赖关系
    // 这里数据好获取，但是这个 effect 回调函数改如何获取呢？又如何确定是哪个 effect 函数呢？
    if (activeEffect) {
        let dep = depsMap.get(key); // 根据属性值获取依赖关系函数集合
        if (!dep) {
            dep = new Set(); // 属性值会关联到多个 effect 函数，因此用 Set 存储
            depsMap.set(key, dep);
        }
        // 将依赖的函数添加到集合中
        dep.add(activeEffect);
        activeEffect.deps.push(dep); // 将当前的依赖集合放入到函数的 deps 属性中
    }
    console.log('依赖收集成功', depsMap);
}

// 在改变响应式数据时，触发 éffect 所有函数的执行
// 当多个effect函数依赖同一个数据时，由于值被修改，会触发所有依赖该数据的effect函数的执行，因此会造成无限循环。
// 解决无限循环: 将要执行的依赖函数放入到 set 中，防止触发同一个依赖函数
const trigger = (target, key) => {
    const deps = depsMap.get(key);
    if (deps) {
        const effectToRun = new Set(deps);
        effectToRun.forEach(dep => dep()); // 执行所有依赖的函数
    }
}

const data = {
    a: 1,
    b: 2,
    c: 3
}

const state = new Proxy(data, {
    get(target, key) {
        track(target, key);
        return target[key];
    },
    set(target, key, value) {
        target[key] = value;
        trigger(target, key);
        return true;
    }
});

/**
 * 目的是让回调函数中的响应式数据和回调函数 fn 关联起来，当响应式数据发生变化时，触发 fn 的执行。
 * @param {*} fn 传入的回调函数 
 */
function effect(fn) {
    // 这里采用了一个闭包环境，将当前正在执行的 effect 函数保存起来，保证 activeEffect 有值，不会丢失依赖。但是会出现依赖没有删除的情况。
    const enviroment = () => {
        activeEffect = enviroment;
        effectStack.push(enviroment); // 记录当前的环境，模拟执行栈，解决effect嵌套问题：在 effect 函数后面的响应式无法收集到依赖关系。
        cleanup(enviroment); // 清除上一次的依赖关系
        fn();
        // activeEffect = null;
        effectStack.pop(); // 弹出当前的环境
        activeEffect = effectStack[effectStack.length - 1]; // 设置当前的 effect 函数
    }
    enviroment.deps = []; // 用来记录该环境函数在哪些集合里面
    enviroment();
}

function cleanup(enviroment) {
    let deps = enviroment.deps;
    if (deps.length) {
        deps.forEach(dep => {
            dep.delete(enviroment); // 删除该 effect 函数的依赖关系
            if (dep.size === 0) { // 如果集合为空，则删除该属性的依赖关系
                for (let [key, value] of depsMap) {
                    if (value === dep) {
                        depsMap.delete(key);
                    }
                }
            }
        })
        deps.length = 0; // 清空依赖关系集合
    }
}

// 问题：在哪儿建立联系？很明显，在收集依赖的时候，也就是 track 函数中，建立响应式数据的依赖关系。
// 所谓依赖收集就是建立响应式数据和 effect 函数的联系。
effect(() => {
    effect(() => {
        console.log(state.a);
        console.log(state.c);
        console.log('执行了函数2');
    });
    if (state.a === 1) {
        state.b;
    } else {
        state.c;
    }
    console.log('执行了函数1');
});

// state.a = 2; // 触发 effect 函数的执行