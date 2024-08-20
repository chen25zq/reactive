import { reactive } from './reactive.js';
import { effect } from './effect/effect.js';

// 测试 2
const obj = {
  a: 1,
  b: 2,
};
const state = reactive(obj);
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
state.c = 2;
// state.b = 2;


// 测试 1
// const obj = {
//   a: 1,
//   b: 2,
// };
// const state = reactive(obj);
// function fn() {
//   console.log("fn");
//   state.a = state.a + 1;
// }
// effect(fn);
// state.a = 100;

// const obj = {
//     a: 1,
//     b: {
//         c: 2,
//     },
//     d: {
//         name: 'd',
//         age: 3,
//     }
// }

// const rst = reactive(obj);
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
// proxyArr.length = 2;

// proxyArr.push(4);