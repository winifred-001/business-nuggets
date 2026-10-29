import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(file, dependencies) {
  const code = ts.transpileModule(fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function('exports', 'require', code)(exports, name => {
    const value = Object.hasOwn(dependencies, name) ? dependencies[name] : require(name);
    return typeof value === 'function' && Object.hasOwn(dependencies, name) ? { default: value } : value;
  });
  return exports.default;
}
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
const passthrough = ({children}) => children;
const styles = { __esModule: true, default: new Proxy({}, { get: (_, key) => key }) };
const Library = load('components/VisitorHomeLibrary.tsx', {
  react: { useMemo: fn => fn(), useState: initial => [initial, () => {}] },
  'next/link': passthrough,
  '@/lib/nugget-text': { nuggetExcerpt: text => text },
  '@/app/visitor-home.module.css': styles,
});
const nugget = number => ({ number, slug: `nugget-${number}`, title: `Teaching ${number}`, topic: 'Leadership', tag: 'leadership', scriptureRef: 'Proverbs 3:5', keyPrinciple: 'Act wisely.', marketplaceApplication: '' });
const counterEffects = [];
const Counter = load('components/VisitorNuggetCounter.tsx', {
  react: { useRef: () => ({ current: null }), useEffect: effect => counterEffects.push(effect) },
  '@/app/visitor-home.module.css': styles,
});
let count = 119;
const Home = load('app/page.tsx', {
  'next/link': passthrough,
  'next/font/google': { DM_Sans: () => ({ variable: 'dm' }), Manrope: () => ({ variable: 'manrope' }), Playfair_Display: () => ({ variable: 'playfair' }) },
  '@/components/VisitorOnly': passthrough,
  '@/components/VisitorHomeHeader': passthrough,
  '@/components/VisitorHomeLibrary': Library,
  '@/components/VisitorNuggetCounter': Counter,
  '@/components/PageEyebrow': passthrough,
  '@/lib/nuggets-api': { getPublishedNuggets: async () => Array.from({length: count}, (_, i) => nugget(i + 1)) },
  './visitor-home.module.css': styles,
});
test('homepage counter follows the complete backend total while its preview stays at nine', async () => {
  for (const total of [119, 120]) {
    count = total;
    const home = nodes(await Home());
    const section = home.find(node => node.type === Library);
    assert.equal(home.find(node => node.type === Counter).props.totalCount, total);
    assert.equal(section.props.nuggets.length, 9);
    const rendered = nodes(Library(section.props));
    assert.equal(rendered.filter(node => node.type === 'article').length, 9);
    assert.ok(rendered.filter(node => node.type === passthrough).every(node => node.props.href === '/library'));
  }
});
test('unavailable counter does not substitute the preview-card count', () => {
  const rendered = nodes(Counter({ totalCount: null }));
  assert.ok(rendered.some(node => node.props?.children === 'Nugget count temporarily unavailable'));
});


test('counter animates from zero only when visible and reaches the backend total', () => {
  counterEffects.length = 0;
  const tree = nodes(Counter({ totalCount: 287 }));
  const number = tree.find(node => node.props?.className === 'counterNumber');
  const element = { textContent: '0' };
  number.props.ref.current = element;
  let observe; let callback; let disconnected = false; let cancelled = false;
  const originals = { window: globalThis.window, IntersectionObserver: globalThis.IntersectionObserver, requestAnimationFrame: globalThis.requestAnimationFrame, cancelAnimationFrame: globalThis.cancelAnimationFrame };
  try {
    globalThis.window = { matchMedia: () => ({ matches: false }), IntersectionObserver: true };
    globalThis.IntersectionObserver = class {
      constructor(fn) { observe = fn; }
      observe() {} disconnect() { disconnected = true; }
    };
    globalThis.requestAnimationFrame = fn => { callback = fn; return 1; };
    globalThis.cancelAnimationFrame = () => { cancelled = true; };
    const cleanup = counterEffects.at(-1)();
    assert.equal(element.textContent, '0'); assert.equal(callback, undefined);
    observe([{ isIntersecting: true }]); assert.equal(disconnected, true);
    callback(0); callback(700);
    assert.ok(Number(element.textContent) > 0 && Number(element.textContent) < 287);
    callback(1400); assert.equal(element.textContent, '287');
    cleanup(); assert.equal(cancelled, true);
  } finally { Object.assign(globalThis, originals); }
});

test('counter respects reduced motion and shows the exact total immediately', () => {
  counterEffects.length = 0;
  const number = nodes(Counter({ totalCount: 120 })).find(node => node.props?.className === 'counterNumber');
  const element = { textContent: '0' }; number.props.ref.current = element;
  const originalWindow = globalThis.window;
  try {
    globalThis.window = { matchMedia: () => ({ matches: true }) };
    counterEffects.at(-1)(); assert.equal(element.textContent, '120');
  } finally { globalThis.window = originalWindow; }
});
