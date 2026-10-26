import { algorithms, groups, byId, graphPresets } from './catalog.js';
import { sortTrace, binaryTrace, structureTrace, bstTrace, bfsTrace, parseNumbers, parseGraph, inorder } from './engine.js';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const paths = {
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  chart: '<path d="M4 19V9m5 10V5m5 14v-7m5 7V3"/>',
  network: '<circle cx="12" cy="4" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="m11 6-5 9m7-9 5 9M8 18h8"/>',
  github: '<path d="M9 19c-4 1-4-2-6-2m12 5v-4a3.4 3.4 0 0 0-1-2.6c3.3-.4 6.7-1.6 6.7-7A5.5 5.5 0 0 0 19.2 4 5 5 0 0 0 19 .5s-1.2-.4-4 1.5a14 14 0 0 0-7 0C5.2.1 4 .5 4 .5A5 5 0 0 0 3.8 4 5.5 5.5 0 0 0 2.3 8.4c0 5.4 3.4 6.6 6.7 7A3.4 3.4 0 0 0 8 18v4" transform="translate(1 1) scale(.9)"/>',
  moon: '<path d="M20 14A8.5 8.5 0 0 1 10 4a8.5 8.5 0 1 0 10 10Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6m-3 0v3m6 1 2-2"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',
  expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  shuffle: '<path d="M3 5h3c4 0 8 14 12 14h3m-4-4 4 4-4 4M3 19h3c2 0 4-4 6-7s4-7 6-7h3m-4-4 4 4-4 4"/>',
  play: '<path d="m8 4 12 8-12 8Z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M7 5h3v14H7zm7 0h3v14h-3z" fill="currentColor" stroke="none"/>',
  prev: '<path d="M5 5v14m13-14L7 12l11 7Z"/>',
  next: '<path d="M19 5v14M6 5l11 7-11 7Z"/>',
  reset: '<path d="M3 10a9 9 0 1 1 1 7M3 4v6h6"/>',
  gauge: '<path d="M4 18a9 9 0 1 1 16 0M12 13l5-6M5 18h14"/><circle cx="12" cy="13" r="1"/>',
  scan: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 12h10"/>',
  bulb: '<path d="M9 18h6m-6 3h6M8 14a7 7 0 1 1 8 0l-1 4H9l-1-4Z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  chevron: '<path d="m7 10 5 5 5-5"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
};
const icon = name => `<svg class="icon${name === 'chevron' ? ' chevron' : ''}" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.layers}</svg>`;
document.querySelectorAll('[data-icon]').forEach(node => { node.innerHTML = icon(node.dataset.icon); });

let algo, frames = [], index = 0, timer = null, running = false;
let graph = structuredClone(graphPresets.network), numbers = [], target = 42;
const completed = new Set();
const mediaTheme = matchMedia('(prefers-color-scheme: dark)');
function getStored(key) { try { return localStorage.getItem(key); } catch { return null; } }
function setStored(key, value) { try { localStorage.setItem(key, value); } catch { /* 隐私模式下仍可使用。 */ } }
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#191b24' : '#f7f8fa';
  $('theme-button').innerHTML = icon(theme === 'dark' ? 'sun' : 'moon');
  $('theme-button').setAttribute('aria-label', `切换${theme === 'dark' ? '浅' : '深'}色模式`);
}
setTheme(getStored('algolab-theme') || (mediaTheme.matches ? 'dark' : 'light'));
$('theme-button').onclick = () => { const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; setTheme(theme); setStored('algolab-theme', theme); };
mediaTheme.addEventListener('change', e => { if (!getStored('algolab-theme')) setTheme(e.matches ? 'dark' : 'light'); });

function buildNav() {
  $('catalog-count').textContent = String(algorithms.length).padStart(2, '0');
  $('algorithm-nav').innerHTML = groups.map(group => `<section class="nav-group"><button class="group-heading" aria-expanded="true" aria-controls="group-${group.id}">${icon(group.icon)}${group.name}${icon('chevron')}</button><ul class="nav-items" id="group-${group.id}">${algorithms.filter(a => a.group === group.id).map(a => `<li><a class="nav-link${a.id === algo?.id ? ' active' : ''}" href="#${a.id}"${a.id === algo?.id ? ' aria-current="page"' : ''}>${a.name}</a></li>`).join('')}</ul></section>`).join('');
  document.querySelectorAll('.group-heading').forEach(button => button.onclick = () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded)); $(button.getAttribute('aria-controls')).hidden = expanded;
  });
}

function operationControls() {
  const kind = algo.kind;
  if (kind === 'search') return '<label for="target-value">查找目标</label><input id="target-value" type="number" min="0" max="99" value="42"><button class="button operation-primary" data-action="find">开始查找</button><span class="operation-hint">数据将自动升序排列</span>';
  if (kind === 'stack' || kind === 'queue') return `<label for="operation-value">数值</label><input id="operation-value" type="number" min="0" max="99" value="64"><button class="button operation-primary" data-action="add">${kind === 'stack' ? '入栈' : '入队'}</button><button class="button secondary" data-action="remove">${kind === 'stack' ? '出栈' : '出队'}</button><span class="operation-hint">容量 12 · ${kind === 'stack' ? '后进先出' : '先进先出'}</span>`;
  if (kind === 'tree') return '<label for="operation-value">数值</label><input id="operation-value" type="number" min="0" max="99" value="42"><button class="button operation-primary" data-action="add">插入</button><button class="button secondary" data-action="find">查找</button><button class="button secondary" data-action="remove">删除</button>';
  if (kind === 'graph') return `<label for="start-node">起点</label><select id="start-node">${graph.nodes.map(n => `<option>${n}</option>`).join('')}</select><button class="button operation-primary" data-action="run">开始遍历</button><label for="graph-preset">示例</label><select id="graph-preset"><option value="network">相连的网络</option><option value="tree">一棵二叉树</option></select>`;
  return '';
}

function loadAlgorithm(id) {
  stop();
  algo = byId[id] || byId.quick; numbers = [...algo.default]; graph = structuredClone(graphPresets.network); target = 42;
  document.title = `${algo.name} · 算法工坊`;
  $('algorithm-title').textContent = algo.name;
  $('breadcrumb').textContent = groups.find(g => g.id === algo.group).name;
  $('difficulty').textContent = algo.level; $('time-complexity').textContent = algo.time; $('space-complexity').textContent = algo.space;
  $('meta-tags').innerHTML = algo.features.map(tag => `<span>${esc(tag)}</span>`).join('');
  $('data-label').textContent = algo.kind === 'graph' ? '编辑图的边与节点' : algo.kind === 'tree' ? '初始节点（按顺序插入）' : '输入数据';
  $('data-input').value = algo.kind === 'graph' ? graph.edges.map(e => e.join('-')).join(', ') : numbers.join(', ');
  $('input-hint').textContent = algo.kind === 'graph' ? '无向边写成 A-B，逗号分隔；节点限 A–H，独立节点可单独写入' : `0–99 的整数，以逗号或空格分隔，最多 ${algo.kind === 'tree' ? 15 : ['stack','queue'].includes(algo.kind) ? 12 : 16} 个`;
  $('data-error').textContent = '';
  updateOperationControls(); buildNav(); buildCode();
  closeNav(); generate();
}

function updateOperationControls() {
  $('operation-row').innerHTML = operationControls();
  $('operation-row').querySelectorAll('[data-action]').forEach(b => b.onclick = () => perform(b.dataset.action));
  if ($('graph-preset')) $('graph-preset').onchange = e => {
    const selected = e.target.value;
    graph = structuredClone(graphPresets[selected]);
    $('data-input').value = graph.edges.map(edge => edge.join('-')).join(', ');
    updateOperationControls(); $('graph-preset').value = selected; generate();
  };
  if ($('start-node')) $('start-node').onchange = () => generate();
  ['operation-value', 'target-value'].forEach(id => { if ($(id)) $(id).onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); perform(id === 'target-value' ? 'find' : 'add'); } }; });
}

function generate(action, value, model) {
  stop();
  if (algo.kind === 'sort') frames = sortTrace(algo.id, numbers);
  else if (algo.kind === 'search') frames = binaryTrace(numbers, target);
  else if (algo.kind === 'tree') frames = bstTrace(model?.data ?? numbers, action, value);
  else if (algo.kind === 'graph') frames = bfsTrace(graph, $('start-node')?.value || graph.nodes[0]);
  else frames = structureTrace(algo.kind, model ?? { data: numbers, head: 0 }, action, value);
  index = 0; $('timeline').max = frames.length - 1; render();
}

function perform(action) {
  $('data-error').textContent = '';
  try {
    let value;
    if (action !== 'run' && (action !== 'remove' || algo.kind === 'tree')) {
      const input = $(algo.kind === 'search' ? 'target-value' : 'operation-value');
      const text = input.value.trim();
      if (!/^\d{1,2}$/.test(text)) throw new Error('操作数值请输入 0–99 的整数。');
      value = Number(text);
    }
    const model = frames[index];
    if (algo.kind === 'search') { target = value; generate(); }
    else if (algo.kind === 'graph') generate();
    else generate(action, value, model);
    if (frames.length > 1) play();
  } catch (error) { $('data-error').textContent = error.message; }
}

$('data-form').onsubmit = e => {
  e.preventDefault();
  try {
    if (algo.kind === 'graph') { graph = parseGraph($('data-input').value); updateOperationControls(); }
    else {
      const max = algo.kind === 'tree' ? 15 : ['stack','queue'].includes(algo.kind) ? 12 : 16;
      numbers = parseNumbers($('data-input').value, max, ['stack','queue','tree'].includes(algo.kind));
      if (algo.kind === 'tree') numbers = [...new Set(numbers)];
      $('data-input').value = numbers.join(', ');
      if (algo.kind === 'search') {
        const input = $('target-value').value;
        if (!/^\d{1,2}$/.test(input)) throw new Error('查找目标请输入 0–99 的整数。');
        target = Number(input);
      }
    }
    $('data-error').textContent = ''; generate();
  } catch (error) { $('data-error').textContent = error.message; }
};
$('random-button').onclick = () => {
  if (algo.kind === 'graph') {
    const nodes = ['A','B','C','D','E','F','G'], edges = [];
    for (let i = 1; i < nodes.length; i++) edges.push([nodes[i], nodes[Math.floor(Math.random() * i)]]);
    for (let i = 0; i < 3; i++) { const a = nodes[Math.floor(Math.random()*7)], b = nodes[Math.floor(Math.random()*7)]; if (a !== b && !edges.some(e => e.includes(a) && e.includes(b))) edges.push([a,b]); }
    graph = { nodes, edges }; $('data-input').value = edges.map(e => e.join('-')).join(', '); updateOperationControls();
  } else {
    const count = ['stack','queue'].includes(algo.kind) ? 4 : algo.kind === 'tree' ? 7 : 10;
    numbers = Array.from({ length: count }, () => Math.floor(Math.random() * 90) + 10);
    if (algo.kind === 'tree') numbers = [...new Set(numbers)];
    $('data-input').value = numbers.join(', ');
  }
  $('data-error').textContent = ''; generate();
};

function buildCode() {
  $('code-lines').innerHTML = algo.code.map((line, i) => `<div class="code-line" data-line="${i}"><span>${i+1}</span><code>${esc(line) || ' '}</code></div>`).join('');
}
function setTab(tab) {
  ['steps','code'].forEach(id => {
    const active = id === tab; $('tab-'+id).setAttribute('aria-selected', String(active)); $('tab-'+id).tabIndex = active ? 0 : -1; $('panel-'+id).hidden = !active;
  });
}
['steps','code'].forEach((id, i) => {
  $('tab-'+id).onclick = () => setTab(id);
  $('tab-'+id).onkeydown = e => {
    if (['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); const next = e.key === 'Home' ? 'steps' : e.key === 'End' ? 'code' : ['code','steps'][i]; setTab(next); $('tab-'+next).focus(); }
  };
});

const svgWrap = (content, height = 280) => `<svg viewBox="0 0 600 ${height}" role="img" aria-label="${esc(algo.name)}，第 ${index+1} 步"><title>${esc(frames[index].message)}</title>${content}</svg>`;
function renderBars(f) {
  const n = f.data.length, step = 536 / Math.max(n, 1), width = Math.min(40, step * .68), max = Math.max(...f.data, 1);
  let content = '<line class="baseline" x1="24" x2="576" y1="222" y2="222"/>';
  for (let i = 0; i < n; i++) {
    const h = Math.max(4, f.data[i] / max * 162), x = 32 + i * step + (step - width) / 2;
    const outside = f.range && (i < f.range[0] || i > f.range[1]) && !f.sorted.includes(i);
    const status = i === f.pivot ? 'pivot' : f.sorted.includes(i) ? 'done' : f.active.includes(i) ? 'active' : '';
    content += `<g data-item="${f.order[i]}" data-x="${x}"${outside ? ' class="excluded"' : ''}><rect class="bar ${status}" x="${x}" y="${222-h}" width="${width}" height="${h}"/><text class="value-label" text-anchor="middle" x="${x+width/2}" y="${211-h}">${f.data[i]}</text></g><text class="index-label" text-anchor="middle" x="${x+width/2}" y="243">${i}</text>`;
    if (i === f.pivot) content += `<text class="pointer-label" text-anchor="middle" x="${x+width/2}" y="263">基准</text>`;
  }
  return svgWrap(content);
}
function renderSearch(f) {
  const step = 544 / Math.max(f.data.length,1), width = Math.min(46, step-7);
  let content = '';
  f.data.forEach((value, i) => {
    const x = 28 + i * step + (step - width) / 2, outside = f.range && (i < f.range[0] || i > f.range[1]) && f.found !== i;
    const current = f.active.includes(i), found = f.sorted.includes(i);
    content += `<g${outside ? ' class="excluded"' : ''}><rect class="cell ${found ? 'active' : current ? 'filled' : ''}" x="${x}" y="105" rx="6" width="${width}" height="52"/><text class="value-label" x="${x+width/2}" y="137" text-anchor="middle">${value}</text><text class="index-label" x="${x+width/2}" y="177" text-anchor="middle">${i}</text></g>`;
    const pointers = [];
    if (f.range?.[0] === i) pointers.push('左'); if (current) pointers.push('中'); if (f.range?.[1] === i) pointers.push('右');
    if (pointers.length) content += `<text class="pointer-label" x="${x+width/2}" y="87" text-anchor="middle">${pointers.join(' / ')}</text>`;
    if (found) content += `<text class="pointer-label" x="${x+width/2}" y="203" text-anchor="middle">找到</text>`;
  });
  return svgWrap(content, 260);
}
function renderStructure(f) {
  let content = '';
  if (algo.kind === 'stack') {
    const cellH = 25, topY = 35;
    for (let i = 0; i < 12; i++) {
      const y = topY + (11-i)*cellH, filled = i < f.data.length;
      content += `<rect class="cell ${filled ? f.active.includes(i) ? 'active' : 'filled' : ''}" x="225" y="${y}" width="150" height="22" rx="4"/><text class="index-label" x="212" y="${y+15}" text-anchor="end">${i}</text>`;
      if (filled) content += `<text class="value-label" x="300" y="${y+16}" text-anchor="middle">${f.data[i]}</text>`;
      if (i === f.data.length-1) content += `<text class="pointer-label" x="395" y="${y+16}">← 栈顶</text>`;
    }
    content += '<text class="index-label" x="300" y="354" text-anchor="middle">数组下标 · 栈底在下方</text>';
    if (!f.data.length) content += '<text class="empty-label" x="450" y="190" text-anchor="middle">空栈</text>';
    return svgWrap(content, 370);
  }
  const head = f.head ?? 0, tail = (head + f.data.length) % 12;
  for (let slot = 0; slot < 12; slot++) {
    const col = slot % 6, row = Math.floor(slot / 6), x = 35 + col * 90, y = 58 + row * 120;
    const logical = (slot - head + 12) % 12, filled = logical < f.data.length;
    content += `<rect class="cell ${filled ? f.active.includes(logical) ? 'active' : 'filled' : ''}" x="${x}" y="${y}" width="76" height="52" rx="7"/><text class="index-label" x="${x+38}" y="${y+71}" text-anchor="middle">${slot}</text>`;
    if (filled) content += `<text class="value-label" x="${x+38}" y="${y+32}" text-anchor="middle">${f.data[logical]}</text>`;
    const pointers = []; if (slot === head) pointers.push('队头'); if (slot === tail) pointers.push('队尾');
    if (pointers.length) content += `<text class="pointer-label" x="${x+38}" y="${y-12}" text-anchor="middle">${pointers.join(' / ')}</text>`;
  }
  content += '<text class="index-label" x="300" y="286" text-anchor="middle">下标到 11 后回到 0 · 队尾指向下次写入位置</text>';
  return svgWrap(content, 310);
}
function renderTree(f) {
  if (!f.tree) return svgWrap('<text class="empty-label" text-anchor="middle" x="300" y="140">树是空的，插入一个节点开始吧。</text>');
  const values = inorder(f.tree), coords = new Map(); let maxDepth = 0;
  function layout(node, depth) {
    if (!node) return; maxDepth = Math.max(depth, maxDepth);
    coords.set(node.value, { x: 35 + (values.indexOf(node.value)+.5) * (530/values.length), y: 36+depth*67 });
    layout(node.left, depth+1); layout(node.right, depth+1);
  }
  layout(f.tree, 0); let lines = '', nodes = '';
  function draw(node) {
    if (!node) return; const p = coords.get(node.value);
    for (const child of [node.left, node.right]) if (child) { const c = coords.get(child.value); lines += `<path class="edge ${(f.path || []).includes(node.value) && (f.path || []).includes(child.value) ? 'done' : ''}" d="M${p.x} ${p.y}L${c.x} ${c.y}"/>`; }
    nodes += `<circle class="node ${f.current === node.value ? 'active' : (f.path || []).includes(node.value) ? 'visited' : ''}" cx="${p.x}" cy="${p.y}" r="20"/><text class="value-label" x="${p.x}" y="${p.y+4}" text-anchor="middle">${node.value}</text>`;
    draw(node.left); draw(node.right);
  }
  draw(f.tree); return svgWrap(lines+nodes, Math.max(270, maxDepth*67+75));
}
function renderGraph(f) {
  const coords = { A:[300,35], B:[155,115], C:[445,115], D:[65,215], E:[300,215], F:[535,215], G:[300,315], H:[535,315] };
  const same = (a,b) => a && a.includes(b[0]) && a.includes(b[1]);
  let content = f.graph.edges.map(e => { const [x,y] = coords[e[0]], [xx,yy] = coords[e[1]]; return `<path class="edge ${same(f.activeEdge,e) ? 'active' : f.treeEdges.some(t => same(t,e)) ? 'done' : ''}" d="M${x} ${y}L${xx} ${yy}"/>`; }).join('');
  content += f.graph.nodes.map(n => {
    const [x,y] = coords[n], status = f.current === n ? 'active' : f.visited.includes(n) ? 'visited' : f.discovered.includes(n) ? 'queued' : '';
    return `<circle class="node ${status}" cx="${x}" cy="${y}" r="21"/><text class="value-label" x="${x}" y="${y+4}" text-anchor="middle">${n}</text><text class="index-label" x="${x+29}" y="${y+4}">${f.distance[n] ?? '∞'}</text>`;
  }).join('');
  return svgWrap(content, 350);
}

function render() {
  const f = frames[index]; if (!f) return;
  const oldPositions = new Map([...$('visual-stage').querySelectorAll('[data-item]')].map(node => [node.dataset.item, Number(node.dataset.x)]));
  $('visual-stage').innerHTML = algo.kind === 'sort' ? renderBars(f) : algo.kind === 'search' ? renderSearch(f) : algo.kind === 'tree' ? renderTree(f) : algo.kind === 'graph' ? renderGraph(f) : renderStructure(f);
  // 只对交换做短时位移动画，不启动持续渲染循环。
  if (index > 0 && algo.kind === 'sort' && algo.id !== 'merge' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $('visual-stage').querySelectorAll('[data-item]').forEach(node => {
      const previous = oldPositions.get(node.dataset.item), delta = previous - Number(node.dataset.x);
      if (previous !== undefined && delta && node.animate) node.animate([{transform:`translateX(${delta}px)`},{transform:'translateX(0)'}],{duration:Math.min(280,Number($('speed').value)*.8),easing:'ease-in-out'});
    });
  }
  $('step-counter').textContent = `${String(index+1).padStart(2,'0')} / ${String(frames.length).padStart(2,'0')}`;
  $('timeline').value = index; $('timeline-current').textContent = index; $('timeline-total').textContent = frames.length - 1;
  $('prev-button').disabled = index === 0; $('next-button').disabled = index === frames.length - 1;
  $('play-button').disabled = frames.length <= 1;
  $('step-title').textContent = f.complete ? f.rejected ? '操作提示' : '本次演示完成' : index === 0 ? '准备开始' : `第 ${index} 步`;
  $('step-message').textContent = f.message;
  const vars = Object.entries(f.vars || {});
  if (!vars.length) vars.push(['元素数量', f.data.length], ['当前状态', f.complete ? '已完成' : '待开始']);
  const variableLabels = { left:'左边界',right:'右边界',mid:'中点',i:'分区指针',j:'扫描指针',end:'未排序末尾',head:'队头下标',tail:'队尾下标',top:'栈顶下标',size:'元素数量',capacity:'容量' };
  $('variables').innerHTML = vars.map(([key,value]) => `<div><dt>${esc(variableLabels[key] || key)}</dt><dd>${esc(value)}</dd></div>`).join('');
  $('history-count').textContent = `${index+1} 条`;
  $('history').innerHTML = frames.slice(Math.max(0,index-3),index+1).reverse().map((entry,i) => `<li${i === 0 ? ' class="current"' : ''}><span>${String(index-i).padStart(2,'0')}</span>${esc(entry.message)}</li>`).join('');
  document.querySelectorAll('.code-line.current').forEach(n => n.classList.remove('current'));
  document.querySelector(`.code-line[data-line="${f.line}"]`)?.classList.add('current');
  let legend = [['','待处理'],['active','正在比较'],['done','已归位']];
  if (algo.id === 'quick') legend.push(['pivot','基准元素']);
  if (algo.kind === 'search') legend = [['','待查找'],['active','中间元素'],['done','目标位置']];
  if (['stack','queue'].includes(algo.kind)) legend = [['active','已有元素'],['done','本次写入']];
  if (algo.kind === 'tree') legend = [['','普通节点'],['active','当前节点'],['done','经过路径']];
  if (algo.kind === 'graph') legend = [['','未发现'],['active','队列 / 当前'],['done','已访问']];
  $('legend').innerHTML = legend.map(([cls,label]) => `<span><i class="${cls}"></i>${label}</span>`).join('');
  const stats = algo.kind === 'graph' ? [['已访问节点',f.visited.length],['检查邻接项',f.comparisons],['队列长度',f.queue.length]] : [['比较次数',f.comparisons],['写入次数',f.writes],['当前步数',index]];
  $('stats').innerHTML = stats.map(([label,value]) => `<div class="stat"><span>${label}</span><strong>${value}</strong></div>`).join('');
  let auxiliary = '';
  const chips = values => values.map(v => `<span class="aux-chip">${esc(v)}</span>`).join('');
  if (algo.kind === 'graph') auxiliary = `<div class="aux-row"><span class="aux-label">待访问队列</span>${f.queue.length ? chips(f.queue) : '<span>空</span>'}</div><div class="aux-row"><span class="aux-label">访问顺序</span>${f.visited.length ? chips(f.visited) : '<span>尚未访问</span>'}</div>`;
  if (algo.id === 'merge' && f.buffer?.length) auxiliary = `<div class="aux-row"><span class="aux-label">辅助数组</span>${chips(f.buffer)}</div>`;
  if (algo.kind === 'tree') auxiliary = `<div class="aux-row"><span class="aux-label">中序遍历</span>${inorder(f.tree).length ? chips(inorder(f.tree)) : '<span>空</span>'}</div>`;
  if (algo.kind === 'queue') auxiliary = `<div class="aux-row"><span class="aux-label">逻辑顺序</span>${f.data.length ? chips(f.data) : '<span>空</span>'}<span class="aux-label">${f.data.length ? '← 从队头到队尾' : ''}</span></div>`;
  $('auxiliary').innerHTML = auxiliary;
  if (f.complete && !f.rejected) completed.add(algo.id);
  playerButton();
}

function playerButton() { $('play-button').innerHTML = `${icon(running ? 'pause' : 'play')}<span>${running ? '暂停演示' : index === frames.length-1 && frames.length > 1 ? '重新播放' : '播放演示'}</span>`; $('play-button').setAttribute('aria-label', running ? '暂停' : '播放'); }
function stop() { clearTimeout(timer); timer = null; running = false; playerButton(); }
function schedule() {
  timer = setTimeout(() => {
    if (!running) return;
    if (index < frames.length-1) { index++; render(); }
    if (index >= frames.length-1) stop(); else schedule();
  }, Number($('speed').value));
}
function play() {
  if (frames.length <= 1) return;
  if (running) { stop(); return; }
  if (index === frames.length-1) { index = 0; render(); }
  running = true; playerButton(); schedule();
}
function step(delta) { stop(); index = Math.max(0,Math.min(frames.length-1,index+delta)); render(); playerButton(); }
$('play-button').onclick = play;
$('prev-button').onclick = () => step(-1); $('next-button').onclick = () => step(1);
$('reset-button').onclick = () => { stop(); index = 0; render(); playerButton(); };
$('timeline').oninput = e => { stop(); index = Number(e.target.value); render(); playerButton(); };
$('speed').onchange = () => { if (running) { clearTimeout(timer); schedule(); } };
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
window.addEventListener('hashchange', () => loadAlgorithm(location.hash.slice(1)));
document.addEventListener('keydown', e => {
  const editing = /INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName) || e.target.isContentEditable;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); return; }
  if (editing || document.querySelector('dialog[open]') || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.code === 'Space') { e.preventDefault(); play(); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
});
function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => $('toast').hidden = true, 2500); }
$('fullscreen-button').onclick = async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else if (document.querySelector('.experiment').requestFullscreen) await document.querySelector('.experiment').requestFullscreen(); else toast('当前浏览器不支持全屏，可使用浏览器缩放查看。'); }
  catch { toast('当前环境无法进入全屏。'); }
};
function closeNav() { $('sidebar').classList.remove('open'); $('nav-overlay').hidden = true; $('menu-button').setAttribute('aria-expanded','false'); }
$('menu-button').onclick = () => { const open = $('sidebar').classList.toggle('open'); $('nav-overlay').hidden = !open; $('menu-button').setAttribute('aria-expanded',String(open)); if (open) $('sidebar').querySelector('a').focus(); };
$('nav-overlay').onclick = closeNav;
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });
function searchResults() {
  const query = $('search-input').value.trim().toLowerCase();
  const matches = algorithms.filter(a => [a.name,a.en,groups.find(g => g.id === a.group).name,...a.features].join(' ').toLowerCase().includes(query));
  $('search-results').innerHTML = matches.length ? matches.map(a => `<a class="search-result" href="#${a.id}">${icon(groups.find(g => g.id === a.group).icon)}<span>${esc(a.name)}</span><span>${groups.find(g => g.id === a.group).name} ↗</span></a>`).join('') : '<p class="code-note">没有找到，试试“排序”“栈”或“查找”。</p>';
  $('search-results').querySelectorAll('a').forEach(link => link.onclick = () => $('search-dialog').close());
}
function openSearch() { stop(); $('search-dialog').showModal(); $('search-input').value = ''; searchResults(); $('search-input').focus(); }
$('open-search').onclick = openSearch; $('search-input').oninput = searchResults;
$('search-input').onkeydown = e => { if (e.key === 'ArrowDown') { e.preventDefault(); $('search-results').querySelector('a')?.focus(); } if (e.key === 'Enter') $('search-results').querySelector('a')?.click(); };
document.querySelectorAll('[data-close]').forEach(button => button.onclick = () => $(button.dataset.close).close());
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } }));
loadAlgorithm(location.hash.slice(1) || 'quick');
