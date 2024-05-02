/*
 * Copyright Â© 2023 Free Term Of Use bc ConMaster2112
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software. You must include and keep this
 * copyright notice in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
const isVec3Symbol = Symbol("isVec3");
export function Vec3(x = 0, y = 0, z = 0){
    if(new.target){
        this.x=Number(x);
        this.y=Number(y);
        this.z=Number(z);
    } else return {x:Number(x),y:Number(y),z:Number(z), __proto__:Vec3.prototype};
}
Vec3.magnitude = function magnitude(vec){return Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);}
Vec3.normalize = function normalize(vec){const l = Vec3.magnitude(vec); return {x:vec.x/l, y:vec.y/l, z:vec.z/l,__proto__:Vec3.prototype}; }
Vec3.cross=function crossProduct(a, b) {return {x:a.y * b.z - a.z * b.y, y:a.x * b.z - a.z * b.x,z:a.x * b.y - a.y * b.x,__proto__:Vec3.prototype};}
Vec3.dot=function dot(a, b){return a.x * b.x + a.y * b.y + a.z * b.z;}
Vec3.angleBetween = function angleBetween(a,b){return Math.acos(Vec3.dot(a,b)/(Vec3.magnitude(a)*Vec3.magnitude(b)));}
Vec3.subtract = function subtract(a, b){return {x:a.x-b.x,y:a.y-b.y,z:a.z-b.z,__proto__:Vec3.prototype}};
Vec3.add = function add(a, b){return {x:a.x+b.x,y:a.y+b.y,z:a.z+b.z,__proto__:Vec3.prototype}};
Vec3.multiply = function multiply(vec,num){
    if(typeof num == "number") return {x:vec.x*num,y:vec.y*num,z:vec.z*num,__proto__:Vec3.prototype};
    else return {x:vec.x*num.x,y:vec.y*num.y,z:vec.z*num.z,__proto__:Vec3.prototype};
}
Vec3.isVec3 = function isVec3(vec){return vec[isVec3Symbol] === true;}
Vec3.floor = function floor(vec){return {x:Math.floor(vec.x),y:Math.floor(vec.y),z:Math.floor(vec.z),__proto__:Vec3.prototype};}
Vec3.projection = function projection(a,b){return Vec3.multiply(b,Vec3.dot(a,b)/((b.x * b.x + b.y * b.y + b.z * b.z)**2));}
Vec3.rejection = function rejection(a,b){return Vec3.subtract(a,Vec3.projection(a,b));}
Vec3.reflect = function reflect(v, n) {return Vec3.subtract(v, Vec3.multiply(n, 2 * Vec3.dot(v, n)));}
Vec3.lerp = function lerp(a, b, t) {return Vec3.multiply(a, 1 - t).add(Vec3.multiply(b,t));}
Vec3.distance = function distance(a,b){return Vec3.magnitude(Vec3.subtract(a,b));}
Vec3.from = function from(object){
    if(Vec3.isVec3(object)) return object;
    if(Array.isArray(object)) return Vec3(object[0],object[1],object[2]);
    const {x=0,y=0,z=0} = object??{};
    return {x:Number(x),y:Number(y),z:Number(z),__proto__:Vec3.prototype};
}
Vec3.sort = function sort(vec1, vec2){
    const [x1,x2] = vec1.x<vec2.x?[vec1.x,vec2.x]:[vec2.x,vec1.x];
    const [y1,y2] = vec1.y<vec2.y?[vec1.y,vec2.y]:[vec2.y,vec1.y];
    const [z1,z2] = vec1.z<vec2.z?[vec1.z,vec2.z]:[vec2.z,vec1.z];
    return [{x:x1,y:y1,z:z1,__proto__:Vec3.prototype},{x:x2,y:y2,z:z2,__proto__:Vec3.prototype}];
}
Vec3.up = {x:0,y:1,z:0, __proto__:Vec3.prototype};
Vec3.down = {x:0,y:1,z:0, __proto__:Vec3.prototype};
Vec3.right = {x:1,y:0,z:0, __proto__:Vec3.prototype};
Vec3.left = {x:-1,y:0,z:0, __proto__:Vec3.prototype};
Vec3.forward = {x:0,y:0,z:1, __proto__:Vec3.prototype};
Vec3.backward = {x:0,y:0,z:-1, __proto__:Vec3.prototype};
Vec3.zero = {x:0,y:0,z:0, __proto__:Vec3.prototype};
Vec3.prototype = {
    distance(vec){return Vec3.distance(this,vec);},
    lerp(vec,t){return Vec3.lerp(this,vec,t);},
    projection(vec){return Vec3.projection(this,vec);},
    reflect(vec){return Vec3.reflect(this,vec);},
    rejection(vec){return Vec3.rejection(this,vec);},
    cross(vec){return Vec3.cross(this,vec);},
    dot(vec){return Vec3.dot(this,vec);},
    floor(){return Vec3.floor(this);},
    add(vec){return Vec3.add(this,vec);},
    subtract(vec){return Vec3.subtract(this,vec);},
    multiply(num){return Vec3.multiply(this,num);},
    get length(){return Vec3.magnitude(this);},
    get normalized(){return Vec3.normalize(this);},
    x: 0,
    y: 0,
    z: 0,
    [isVec3Symbol]:true,
    toString(){return `<${this.x}, ${this.y}, ${this.z}>`;}
}