import track, { pauseTrack, resumeTrack } from "../../effect/track.js";
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
});

// 处理数组的 push、pop、shift、unshift、splice 方法的拦截器, 重写这四个方法
// 这几个方法在调用的时候暂停依赖收集，当调用完成的时候恢复依赖收集
["push", "pop", "shift", "unshift", "splice"].forEach(key => {
    arrayInstrumentations[key] = function(...args) {
        pauseTrack();
        const rst = Array.prototype[key].apply(this, args);
        resumeTrack();
        return rst;
    }
});

export default function(target, key) {
    // console.log(`拦截到了${key}的读取行为, 将值返回`);

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
