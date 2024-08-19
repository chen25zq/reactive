
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
    // console.log("原始对象: ", target);
    console.log(`track 依赖收集 ${key} 属性  ${type} 操作被拦截`);
}