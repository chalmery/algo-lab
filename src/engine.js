// 算法只生成不可变快照，播放和回退不改变算法状态。
const copy = value => structuredClone(value);
function recorder(initial) {
  const frames = [];
  const state = { data: [...initial], order: initial.map((_,i) => i), active: [], sorted: [], pivot: -1, line: 0, comparisons: 0, writes: 0, vars: {}, message: '数据已就绪，点击播放开始观察。' };
  const emit = (patch = {}) => { Object.assign(state, patch); frames.push(copy(state)); };
  return { state, frames, emit };
}

export function sortTrace(id, input) {
  const { state: s, frames, emit } = recorder(input);
  const a = s.data;
  const done = new Set();
  emit();
  const swap = (i, j) => { if (i !== j) { [a[i], a[j]] = [a[j], a[i]]; [s.order[i],s.order[j]] = [s.order[j],s.order[i]]; s.writes += 2; } };
  if (id === 'bubble') {
    for (let end = a.length - 1; end > 0; end--) {
      let swapped = false;
      emit({ line: 1, vars: { '未排序末尾': end }, message: `开始一轮冒泡，检查下标 0 到 ${end}。` });
      for (let j = 0; j < end; j++) {
        s.comparisons++;
        emit({ active: [j, j + 1], line: 3, vars: { j, end }, message: `比较 ${a[j]} 与 ${a[j + 1]}。` });
        if (a[j] > a[j + 1]) {
          const old = [a[j], a[j + 1]];
          swap(j, j + 1); swapped = true;
          emit({ line: 4, message: `${old[0]} > ${old[1]}，交换相邻元素。` });
        } else emit({ line: 3, message: `${a[j]} ≤ ${a[j + 1]}，保持顺序。` });
      }
      done.add(end);
      emit({ active: [], sorted: [...done], line: 6, message: `${a[end]} 已到达最终位置。` });
      if (!swapped) { emit({ line: 7, message: '本轮没有交换，剩余区间已经有序，提前结束。' }); break; }
    }
  } else if (id === 'quick') {
    function quick(left, right) {
      if (left >= right) { if (left === right) done.add(left); return; }
      const pivot = a[right]; let i = left;
      emit({ active: [], sorted: [...done], pivot: right, range: [left, right], line: 2, vars: { left, right, '基准': pivot, i }, message: `在区间 [${left}, ${right}] 选择末尾的 ${pivot} 作为基准。` });
      for (let j = left; j < right; j++) {
        s.comparisons++;
        emit({ active: [j], line: 4, vars: { left, right, i, j, '基准': pivot }, message: `比较 ${a[j]} 与基准 ${pivot}。` });
        if (a[j] <= pivot) {
          const value = a[j]; swap(i, j);
          emit({ active: [...new Set([i,j])], line: 5, message: `${value} ≤ ${pivot}，放入左侧分区${i === j ? '，无需交换' : ''}。` });
          i++;
        } else emit({ line: 4, message: `${a[j]} > ${pivot}，留在右侧分区。` });
      }
      swap(i, right); done.add(i);
      emit({ active: [i], pivot: i, sorted: [...done], line: 6, vars: { '基准位置': i }, message: `基准 ${pivot} 归位到下标 ${i}，两侧继续排序。` });
      quick(left, i - 1); quick(i + 1, right);
    }
    quick(0, a.length - 1);
  } else if (id === 'merge') {
    function merge(left, right) {
      if (left >= right) return;
      const mid = Math.floor((left + right) / 2);
      emit({ active: [], range: [left, right], line: 2, vars: { left, mid, right }, message: `把区间 [${left}, ${right}] 拆成 [${left}, ${mid}] 和 [${mid+1}, ${right}]。`, buffer: [] });
      merge(left, mid); merge(mid + 1, right);
      const first = a.slice(left, mid + 1), second = a.slice(mid + 1, right + 1), buffer = [];
      const firstIds = s.order.slice(left, mid+1), secondIds = s.order.slice(mid+1, right+1), bufferIds = [];
      let i = 0, j = 0;
      while (i < first.length || j < second.length) {
        const active = [];
        if (i < first.length) active.push(left + i);
        if (j < second.length) active.push(mid + 1 + j);
        if (i < first.length && j < second.length) s.comparisons++;
        const takeLeft = j === second.length || (i < first.length && first[i] <= second[j]);
        bufferIds.push(takeLeft ? firstIds[i] : secondIds[j]);
        const value = takeLeft ? first[i++] : second[j++]; buffer.push(value); s.writes++;
        emit({ active, line: 5, range: [left, right], buffer: [...buffer], vars: { left, mid, right, '辅助区长度': buffer.length }, message: `从${takeLeft ? '左' : '右'}侧取出 ${value}，追加到辅助数组。` });
      }
      for (let k = 0; k < buffer.length; k++) {
        a[left + k] = buffer[k]; s.order[left+k] = bufferIds[k]; s.writes++;
        emit({ active: [left + k], line: 6, message: `把辅助数组的 ${buffer[k]} 写回下标 ${left + k}。` });
      }
      emit({ active: [], line: 7, message: `区间 [${left}, ${right}] 归并完成。` });
    }
    merge(0, a.length - 1);
  } else throw new Error('未知排序算法');
  emit({ active: [], sorted: a.map((_, i) => i), pivot: -1, range: null, buffer: [], line: -1, vars: { '元素数量': a.length }, message: '排序完成！所有元素已按从小到大排列。', complete: true });
  return frames;
}

export function binaryTrace(input, target) {
  const sorted = [...input].sort((a, b) => a - b);
  const { state: s, frames, emit } = recorder(sorted);
  let left = 0, right = sorted.length - 1;
  emit({ range: [left, right], vars: { left, right, '目标': target }, message: `数组已升序排列，查找目标 ${target}。` });
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2); s.comparisons++;
    emit({ active: [mid], range: [left, right], line: 2, vars: { left, mid, right, '目标': target }, message: `取中点 ${mid}，比较 ${sorted[mid]} 与目标 ${target}。` });
    if (sorted[mid] === target) {
      emit({ active: [], sorted: [mid], found: mid, line: 3, message: `找到目标 ${target}！它位于下标 ${mid}（第 ${mid + 1} 个位置）。`, complete: true });
      return frames;
    }
    if (sorted[mid] < target) { left = mid + 1; emit({ active: [], range: [left, right], line: 4, vars: { left, right, '目标': target }, message: `${sorted[mid]} < ${target}，排除中点及左半区间。` }); }
    else { right = mid - 1; emit({ active: [], range: [left, right], line: 5, vars: { left, right, '目标': target }, message: `${sorted[mid]} > ${target}，排除中点及右半区间。` }); }
  }
  emit({ active: [], range: [left, right], line: 6, found: -1, message: `查找区间为空，数组中没有 ${target}。`, complete: true });
  return frames;
}

export function structureTrace(kind, model, action, value) {
  const { state: s, frames, emit } = recorder(model.data);
  const capacity = 12;
  s.head = model.head ?? 0;
  const vars = () => kind === 'queue' ? { head: s.head, tail: (s.head + s.data.length) % capacity, size: s.data.length, capacity } : { top: s.data.length - 1, size: s.data.length, capacity };
  emit({ vars: vars(), message: `${kind === 'stack' ? '栈' : '队列'}已就绪，选择操作来观察变化。`, line: -1 });
  if (!action) return frames;
  const isAdd = action === 'add';
  if (isAdd && s.data.length >= capacity) { emit({ line: 1, message: '容量已满，无法继续添加。请先移除元素。', complete: true, rejected: true }); return frames; }
  if (!isAdd && !s.data.length) { emit({ line: 6, message: `当前为空，无法${kind === 'stack' ? '出栈' : '出队'}。`, complete: true, rejected: true }); return frames; }
  if (isAdd) {
    emit({ line: 0, message: `准备将 ${value} ${kind === 'stack' ? '压入栈顶' : '写入队尾'}。` });
    s.data.push(value); s.writes++;
    emit({ active: [s.data.length - 1], line: 2, message: `写入 ${value}，更新${kind === 'stack' ? '栈顶' : '队尾索引'}。` });
    emit({ active: [s.data.length - 1], line: 3, vars: vars(), message: `${value} ${kind === 'stack' ? '入栈' : '入队'}完成，当前共有 ${s.data.length} 个元素。`, complete: true });
  } else {
    const index = kind === 'stack' ? s.data.length - 1 : 0;
    const removed = s.data[index];
    emit({ active: [index], line: 7, message: `读取${kind === 'stack' ? '栈顶' : '队头'}元素 ${removed}。` });
    if (kind === 'stack') s.data.pop(); else { s.data.shift(); s.head = (s.head + 1) % capacity; }
    s.writes++;
    emit({ active: [], line: kind === 'stack' ? 8 : 9, vars: vars(), message: `${removed} 已${kind === 'stack' ? '出栈' : '出队'}，剩余 ${s.data.length} 个元素。`, removed, complete: true });
  }
  return frames;
}

function insert(root, value) {
  if (!root) return { value, left: null, right: null };
  if (value < root.value) root.left = insert(root.left, value);
  if (value > root.value) root.right = insert(root.right, value);
  return root;
}
function remove(root, value) {
  if (!root) return null;
  if (value < root.value) root.left = remove(root.left, value);
  else if (value > root.value) root.right = remove(root.right, value);
  else {
    if (!root.left) return root.right;
    if (!root.right) return root.left;
    let next = root.right; while (next.left) next = next.left;
    root.value = next.value; root.right = remove(root.right, next.value);
  }
  return root;
}
export function treeValues(root) { return root ? [root.value, ...treeValues(root.left), ...treeValues(root.right)] : []; }
export function inorder(root) { return root ? [...inorder(root.left), root.value, ...inorder(root.right)] : []; }
export function bstTrace(values, action, value) {
  const { state: s, frames, emit } = recorder(values);
  let root = values.reduce((tree, v) => insert(tree, v), null);
  const sync = patch => emit({ tree: copy(root), data: treeValues(root), ...patch });
  sync({ line: -1, path: [], vars: { '节点数量': treeValues(root).length }, message: '二叉搜索树已就绪：左子树更小，右子树更大。' });
  if (!action) return frames;
  let node = root; const path = [];
  while (node) {
    path.push(node.value); s.comparisons++;
    sync({ line: 2, current: node.value, path: [...path], vars: { '当前节点': node.value, '目标': value }, message: `比较目标 ${value} 与当前节点 ${node.value}。` });
    if (value === node.value) break;
    const smaller = value < node.value;
    sync({ line: smaller ? 3 : 4, message: `${value} ${smaller ? '<' : '>'} ${node.value}，进入${smaller ? '左' : '右'}子树。` });
    node = smaller ? node.left : node.right;
  }
  if (action === 'find') sync({ line: 7, current: node?.value, foundValue: node?.value, message: node ? `找到节点 ${value}，共比较 ${s.comparisons} 次。` : `抵达空分支，没有找到 ${value}。`, complete: true });
  else if (action === 'add') {
    if (node) sync({ line: 7, message: `${value} 已经存在，不重复插入。`, complete: true, rejected: true });
    else if (values.length >= 15) sync({ line: 7, message: '为保持画面清晰，最多展示 15 个节点。', complete: true, rejected: true });
    else { root = insert(root, value); s.writes++; sync({ line: 5, current: value, foundValue: value, message: `在空分支插入 ${value}。`, complete: true }); }
  } else if (action === 'remove') {
    if (!node) sync({ line: 7, message: `${value} 不在树中，无需删除。`, complete: true, rejected: true });
    else {
      if (node.left && node.right) {
        let successor = node.right;
        sync({ line: 6, current: successor.value, message: '该节点有两个子节点，在右子树中寻找最小值作为中序后继。' });
        while (successor.left) { successor = successor.left; sync({ line: 6, current: successor.value, message: `继续向左，检查后继候选 ${successor.value}。` }); }
        sync({ line: 6, current: successor.value, message: `用中序后继 ${successor.value} 替换 ${value}，再删除原后继节点。` });
      }
      root = remove(root, value); s.writes++;
      sync({ line: 6, current: undefined, path: [], message: `已删除 ${value}，二叉搜索树的有序性质保持不变。`, complete: true });
    }
  }
  return frames;
}

export function bfsTrace(graph, start) {
  if (!graph.nodes.includes(start)) throw new Error('起点必须在图中');
  const adj = Object.fromEntries(graph.nodes.map(n => [n, []]));
  for (const [a,b] of graph.edges) { adj[a].push(b); adj[b].push(a); }
  Object.values(adj).forEach(neighbors => neighbors.sort());
  const { state: s, frames, emit } = recorder([]);
  const seen = new Set([start]), queue = [start], visited = [], treeEdges = [];
  const distance = Object.fromEntries(graph.nodes.map(n => [n, null])); distance[start] = 0;
  const sync = patch => emit({ graph, queue: [...queue], visited: [...visited], discovered: [...seen], distance: { ...distance }, treeEdges: copy(treeEdges), vars: { '队列长度': queue.length, '已发现': seen.size, '已访问': visited.length }, ...patch });
  sync({ line: 0, message: `从 ${start} 出发，将它标记并加入队列。`, current: null });
  while (queue.length) {
    const current = queue.shift(); visited.push(current); s.writes++;
    sync({ current, line: 3, message: `${current} 出队，开始检查它的邻居。` });
    for (const neighbor of adj[current]) {
      s.comparisons++;
      sync({ activeEdge: [current, neighbor], line: 5, message: `检查边 ${current} — ${neighbor}：${seen.has(neighbor) ? '邻居已发现，跳过' : '发现新邻居'}。` });
      if (!seen.has(neighbor)) {
        seen.add(neighbor); distance[neighbor] = distance[current] + 1; queue.push(neighbor); treeEdges.push([current, neighbor]);
        sync({ line: 8, message: `${neighbor} 入队，距起点 ${distance[neighbor]} 条边。` });
      }
    }
  }
  sync({ current: null, activeEdge: null, line: -1, message: `遍历完成！访问顺序：${visited.join(' → ')}。${seen.size < graph.nodes.length ? '其余节点与起点不连通，距离为 ∞。' : '所有节点均可达。'}`, complete: true });
  return frames;
}

export function parseNumbers(text, max = 16, allowEmpty = false) {
  if (!text.trim()) { if (allowEmpty) return []; throw new Error('请至少输入一个数字。'); }
  const parts = text.trim().split(/[\s,，、]+/);
  if (parts.length > max) throw new Error(`最多输入 ${max} 个数字。`);
  if (parts.some(v => !/^\d{1,2}$/.test(v))) throw new Error('请输入 0–99 的整数，用逗号或空格分隔。');
  return parts.map(Number);
}

export function parseGraph(text) {
  const edges = [], nodes = new Set();
  for (const raw of text.toUpperCase().split(/[,，\n]+/).map(s => s.trim()).filter(Boolean)) {
    if (/^[A-H]$/.test(raw)) { nodes.add(raw); continue; }
    const match = raw.match(/^([A-H])\s*[-—]\s*([A-H])$/);
    if (!match) throw new Error('边请写成 A-B，用逗号分隔；独立节点可单独写 A。节点限 A–H。');
    const [,a,b] = match; if (a === b) throw new Error('本实验不使用自环，请连接两个不同节点。');
    nodes.add(a); nodes.add(b);
    const edge = [a,b].sort();
    if (!edges.some(e => e[0] === edge[0] && e[1] === edge[1])) edges.push(edge);
  }
  if (!nodes.size) throw new Error('请至少添加一个节点。');
  return { nodes: [...nodes].sort(), edges };
}
