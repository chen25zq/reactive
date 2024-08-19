import { reactive } from './reactive.js';

const obj = {
    a: 1,
    b: {
        c: 2,
    },
    d: {
        name: 'd',
        age: 3,
    }
}

const rst = reactive(obj);
// delete rst.a;
// for (let key in rst) {}
// "a" in rst;
// rst.e = 1;
// console.log(rst.b.c);

const arr = [1, 2, 3, obj];
const proxyArr = reactive(arr);

// 测试代理数组读取和写入行为：收集器和触发器是否正常

// 读取
// proxyArr[0];
// proxyArr.length;
// for(let key in proxyArr) {
//     proxyArr[key]
// }

// for(let i = 0; i < proxyArr.length; i++) {
//     proxyArr[i]
// }

// console.log(proxyArr.includes(obj)); 
// console.log(proxyArr);
// proxyArr.indexOf(obj);

// 写入
// proxyArr[0] = 2;

// proxyArr[5] = 100;
proxyArr.length = 2;