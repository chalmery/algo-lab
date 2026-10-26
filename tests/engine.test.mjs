import test from 'node:test';
import assert from 'node:assert/strict';
import { sortTrace, binaryTrace, structureTrace, bstTrace, bfsTrace, parseNumbers, parseGraph, inorder } from '../src/engine.js';
import { algorithms, graphPresets } from '../src/catalog.js';
const last = array => array.at(-1);

for (const id of ['bubble','quick','merge']) {
  test(`${id}：边界、重复值、有序与随机数据均正确排序`, () => {
    let seed = 123;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed % 100; };
    const inputs = [[],[0],[99,0],[5,5,5],[1,2,3,4],[4,3,2,1],...Array.from({length:50}, () => Array.from({length:random()%16+1}, random))];
    for (const input of inputs) {
      const original = [...input], frames = sortTrace(id,input), final = last(frames);
      assert.deepEqual(final.data,[...input].sort((a,b)=>a-b));
      assert.deepEqual(input,original);
      assert.ok(final.complete);
      assert.deepEqual(frames[0].data,original);
      if (frames.length>1 && frames[1].data.length) { const value=frames[1].data[0]; frames[0].data[0]=999; assert.equal(frames[1].data[0],value); }
    }
  });
}
test('二分查找：找到、找不到、重复值及空数组', () => {
  const values = [8,1,6,4,4,2];
  for (const target of [0,1,2,3,4,6,8,9]) {
    const frames = binaryTrace(values,target), final = last(frames);
    assert.equal(final.complete,true);
    if (values.includes(target)) assert.equal(final.data[final.found],target);
    else assert.equal(final.found,-1);
  }
  assert.equal(last(binaryTrace([],1)).found,-1);
  assert.deepEqual(values,[8,1,6,4,4,2]);
});
test('栈：后进先出与空栈、满栈保护', () => {
  const input = { data:[10,20] };
  assert.deepEqual(last(structureTrace('stack',input,'add',30)).data,[10,20,30]);
  const popped = last(structureTrace('stack',input,'remove'));
  assert.equal(popped.removed,20); assert.deepEqual(popped.data,[10]);
  assert.equal(last(structureTrace('stack',{data:[]},'remove')).rejected,true);
  assert.equal(last(structureTrace('stack',{data:Array(12).fill(1)},'add',2)).rejected,true);
  assert.deepEqual(input.data,[10,20]);
});
test('循环队列：先进先出、跨边界复用、空和满', () => {
  let model = { data:[], head:0 };
  for(let i=0;i<12;i++) model=last(structureTrace('queue',model,'add',i));
  assert.equal(model.vars.tail,0);
  assert.equal(last(structureTrace('queue',model,'add',99)).rejected,true);
  for(let i=0;i<8;i++) { model=last(structureTrace('queue',model,'remove')); assert.equal(model.removed,i); }
  for(let i=12;i<20;i++) model=last(structureTrace('queue',model,'add',i));
  assert.deepEqual(model.data,Array.from({length:12},(_,i)=>i+8));
  assert.equal(model.head,8); assert.equal(model.vars.tail,8);
  for(let i=8;i<20;i++) { model=last(structureTrace('queue',model,'remove')); assert.equal(model.removed,i); }
  assert.equal(last(structureTrace('queue',model,'remove')).rejected,true);
});
function verifyBST(node, min=-Infinity, max=Infinity) {
  if(!node) return;
  assert.ok(node.value>min && node.value<max);
  verifyBST(node.left,min,node.value); verifyBST(node.right,node.value,max);
}
test('BST：插入、查找、拒绝重复、空树插入', () => {
  const input=[50,30,70,20,40,60,80];
  const added=last(bstTrace(input,'add',35)); verifyBST(added.tree); assert.ok(added.data.includes(35));
  assert.equal(last(bstTrace(input,'add',30)).rejected,true);
  assert.equal(last(bstTrace(input,'find',40)).foundValue,40);
  assert.equal(last(bstTrace(input,'find',99)).foundValue,undefined);
  assert.deepEqual(last(bstTrace([],'add',1)).data,[1]);
});
test('BST：删除叶子、单子节点、双子节点、根、缺失值', () => {
  for(const input of [[50,30,70,20,40,60,80],[50,30,70,60],[1],[1,2,3,4]]) {
    for(const value of [...input,99]) {
      const frames=bstTrace(input,'remove',value), final=last(frames);
      verifyBST(final.tree);
      assert.deepEqual(inorder(final.tree),input.filter(v=>v!==value).sort((a,b)=>a-b));
      assert.deepEqual([...frames[0].data].sort((a,b)=>a-b),[...input].sort((a,b)=>a-b));
    }
  }
});
test('BFS：环、不连通、队列去重、最短距离', () => {
  const graph={nodes:['A','B','C','D','E'],edges:[['A','B'],['A','C'],['B','D'],['C','D']]};
  const final=last(bfsTrace(graph,'A'));
  assert.deepEqual(final.visited,['A','B','C','D']);
  assert.deepEqual(final.distance,{A:0,B:1,C:1,D:2,E:null});
  assert.equal(new Set(final.visited).size,final.visited.length);
  assert.equal(final.treeEdges.length,3);
  assert.deepEqual(last(bfsTrace(graph,'E')).visited,['E']);
  assert.deepEqual(last(bfsTrace(graphPresets.network,'A')).visited,['A','B','C','D','E','F','G']);
});
test('数字与图输入：校验边界、中文逗号、空结构、孤立节点', () => {
  assert.deepEqual(parseNumbers('0, 99，5 12'),[0,99,5,12]);
  assert.deepEqual(parseNumbers('',12,true),[]);
  for(const text of ['', '-1','100','1.5','<script>']) assert.throws(()=>parseNumbers(text));
  assert.throws(()=>parseNumbers('1,2,3',2));
  assert.deepEqual(parseGraph('a-b, B-A，C'),{nodes:['A','B','C'],edges:[['A','B']]});
  for(const text of ['', 'A-A','A-Z','<img>']) assert.throws(()=>parseGraph(text));
});
test('所有演示的代码高亮索引与目录一致', () => {
  for(const a of algorithms) {
    const frames=a.kind==='sort'?sortTrace(a.id,a.default):a.kind==='search'?binaryTrace(a.default,42):a.kind==='tree'?bstTrace(a.default,'remove',50):a.kind==='graph'?bfsTrace(graphPresets.network,'A'):structureTrace(a.kind,{data:a.default},'add',42);
    for(const f of frames) assert.ok(f.line===-1 || f.line>=0 && f.line<a.code.length,`${a.id}: ${f.line}`);
  }
});
