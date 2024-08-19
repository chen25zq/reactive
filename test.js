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
for (let key in rst) {}
// "a" in rst;
// rst.e = 1;
// console.log(rst.b.c);