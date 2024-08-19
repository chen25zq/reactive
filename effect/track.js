/**
 * 依赖收集核心
 * @param {*} target 收集对象
 * @param {*} type 操作的类型
 * @param {*} key 对象属性
 */
export default function(target, type, key) {
    // console.log("原始对象: ", target);
    console.log(`track 依赖收集 ${key} 属性  ${type} 操作被拦截`);
}