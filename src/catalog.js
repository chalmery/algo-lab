export const groups = [
  { id: 'basics', name: '基础结构', en: 'Basics', icon: 'layers' },
  { id: 'indexing', name: '查找与索引', en: 'Indexing', icon: 'search' },
  { id: 'sorting', name: '排序算法', en: 'Sorting', icon: 'chart' },
  { id: 'graph', name: '图算法', en: 'Graph Algorithms', icon: 'network' },
];

export const algorithms = [
  {
    id: 'stack', group: 'basics', name: '栈', en: 'Stack', level: '入门', time: 'O(1)', space: 'O(n)', kind: 'stack',
    default: [16, 32, 48], code: ['push(value):', '  if size == capacity: return FULL', '  items[size] = value', '  size = size + 1', '', 'pop():', '  if size == 0: return EMPTY', '  size = size - 1', '  return items[size]'],
    features: ['后进先出', '数组实现', '栈顶操作'],
  },
  {
    id: 'queue', group: 'basics', name: '队列', en: 'Queue', level: '入门', time: 'O(1)', space: 'O(n)', kind: 'queue',
    default: [16, 32, 48], code: ['enqueue(value):', '  if size == capacity: return FULL', '  items[tail] = value', '  tail = (tail + 1) % capacity; size++', '', 'dequeue():', '  if size == 0: return EMPTY', '  value = items[head]', '  head = (head + 1) % capacity; size--', '  return value'],
    features: ['先进先出', '循环数组', '队头与队尾'],
  },
  {
    id: 'binary', group: 'indexing', name: '二分查找', en: 'Binary Search', level: '入门', time: 'O(log n)', space: 'O(1)', kind: 'search',
    default: [8, 15, 23, 34, 42, 56, 67, 78, 89], code: ['left = 0; right = length - 1', 'while left <= right:', '  mid = left + floor((right - left) / 2)', '  if a[mid] == target: return mid', '  if a[mid] < target: left = mid + 1', '  else: right = mid - 1', 'return NOT_FOUND'],
    features: ['有序数组', '区间折半', '双指针'],
  },
  {
    id: 'bst', group: 'indexing', name: '二叉搜索树', en: 'Binary Search Tree', level: '进阶', time: 'O(h)', space: 'O(n)', kind: 'tree',
    default: [50, 28, 76, 16, 38, 64, 88], code: ['node = root', 'while node exists:', '  if value == node.value: found', '  if value < node.value: go left', '  else: go right', 'insert: attach at empty position', 'delete: replace with child or successor', 'return result'],
    features: ['有序结构', '插入 / 查找 / 删除', '中序遍历'],
  },
  {
    id: 'bubble', group: 'sorting', name: '冒泡排序', en: 'Bubble Sort', level: '入门', time: 'O(n²)', space: 'O(1)', kind: 'sort',
    default: [42, 18, 65, 30, 78, 54, 24, 88, 12, 60], code: ['for end = length - 1 down to 1:', '  swapped = false', '  for j = 0 to end - 1:', '    if a[j] > a[j + 1]:', '      swap(a[j], a[j + 1])', '      swapped = true', '  mark a[end] as sorted', '  if not swapped: break'],
    features: ['比较排序', '稳定排序', '原地排序'],
  },
  {
    id: 'quick', group: 'sorting', name: '快速排序', en: 'Quick Sort', level: '进阶', time: 'O(n log n)', space: 'O(log n)', kind: 'sort',
    default: [42, 18, 65, 30, 78, 54, 24, 88, 12, 60], code: ['quickSort(left, right):', '  if left >= right: return', '  pivot = a[right]; i = left', '  for j = left to right - 1:', '    if a[j] <= pivot:', '      swap(a[i], a[j]); i++', '  swap(a[i], a[right])', '  quickSort(left, i - 1)', '  quickSort(i + 1, right)'],
    features: ['分治思想', '原地分区', '不稳定排序'],
  },
  {
    id: 'merge', group: 'sorting', name: '归并排序', en: 'Merge Sort', level: '进阶', time: 'O(n log n)', space: 'O(n)', kind: 'sort',
    default: [42, 18, 65, 30, 78, 54, 24, 88, 12, 60], code: ['mergeSort(left, right):', '  if left >= right: return', '  mid = floor((left + right) / 2)', '  mergeSort(left, mid)', '  mergeSort(mid + 1, right)', '  merge two sorted halves into buffer', '  copy buffer back to a[left..right]', '  return'],
    features: ['分治思想', '稳定排序', '辅助数组'],
  },
  {
    id: 'bfs', group: 'graph', name: '广度优先搜索', en: 'Breadth-First Search', level: '进阶', time: 'O(V + E)', space: 'O(V)', kind: 'graph',
    default: [], code: ['queue = [start]; visited = {start}', 'distance[start] = 0', 'while queue is not empty:', '  node = queue.shift()', '  for neighbor of node (alphabetical):', '    if neighbor not in visited:', '      visited.add(neighbor)', '      distance[neighbor] = distance[node] + 1', '      queue.push(neighbor)'],
    features: ['队列驱动', '逐层访问', '无权最短路径'],
  },
];
export const byId = Object.fromEntries(algorithms.map(a => [a.id, a]));
export const graphPresets = {
  network: { nodes: ['A','B','C','D','E','F','G'], edges: [['A','B'],['A','C'],['B','D'],['B','E'],['C','E'],['C','F'],['D','G'],['E','G'],['F','G']] },
  tree: { nodes: ['A','B','C','D','E','F','G'], edges: [['A','B'],['A','C'],['B','D'],['B','E'],['C','F'],['C','G']] },
};
