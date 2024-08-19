/**
 * 事件触发器：用于在响应式数据写入数据操作的时候触发事件，通知依赖该数据的组件更新
 */

export default function(target, type, key) {
    console.log(`事件触发器原对象：`, target);
    console.log(`触发的 ${key} 属性 ${type} 操作被拦截`);
}