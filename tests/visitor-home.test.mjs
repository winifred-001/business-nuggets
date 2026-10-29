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
let count = 119;
const Home = load('app/page.tsx', {
  'next/link': passthrough,
  'next/font/google': { DM_Sans: () => ({ variable: 'dm' }), Manrope: () => ({ variable: 'manrope' }), Playfair_Display: () => ({ variable: 'playfair' }) },
  '@/components/VisitorOnly': passthrough,
  '@/components/VisitorHomeHeader': passthrough,
  '@/components/VisitorHomeLibrary': Library,
  '@/components/PageEyebrow': passthrough,
  '@/lib/nuggets-api': { getPublishedNuggets: async () => Array.from({length: count}, (_, i) => nugget(i + 1)) },
  './visitor-home.module.css': styles,
});
test('homepage counter follows the complete backend total while its preview stays at nine', async () => {
  for (const total of [119, 120]) {
    count = total;
    const section = nodes(await Home()).find(node => node.type === Library);
    assert.equal(section.props.totalCount, total);
    assert.equal(section.props.nuggets.length, 9);
    const rendered = nodes(Library(section.props));
    assert.equal(rendered.filter(node => node.type === 'article').length, 9);
    assert.ok(rendered.some(node => node.props?.children === `${total} published Nuggets available`));
    assert.ok(rendered.filter(node => node.type === passthrough).every(node => node.props.href === '/library'));
  }
});
test('unavailable counter does not substitute the preview-card count', () => {
  const rendered = nodes(Library({ nuggets: [nugget(1)], totalCount: null }));
  assert.ok(rendered.some(node => node.props?.children === 'Nugget count temporarily unavailable'));
});
