
export let activeEffect = null;
export const targetMap = new WeakMap(); // 用来存放对象和其属性的依赖关系
const effectStack = []; // 用来存放effect函数的栈

export function effect(fn) {
    const enviroment = () => {
        try {
            activeEffect = enviroment;
            effectStack.push(enviroment);
            cleanup(enviroment);
            return fn();
        } finally {
            effectStack.pop();
            activeEffect = effectStack[effectStack.length - 1];
        }
    }
    enviroment.deps = [];
    enviroment();
}

export function cleanup(enviroment) {
    const deps = enviroment.deps;
    if (deps.length) {
        deps.forEach(dep => {
            dep.delete(enviroment);
        });
        deps.length = 0;
    }
}