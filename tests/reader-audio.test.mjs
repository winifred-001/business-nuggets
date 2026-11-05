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
  new Function('exports', 'require', code)(exports, name => dependencies[name] || require(name));
  return exports;
}
function fixture(src = 'https://media.example/commentary.mp3') {
  const states = []; let cursor = 0;
  const react = {
    useState(initial) {
      const slot = cursor++;
      if (!(slot in states)) states[slot] = initial;
      return [states[slot], value => { states[slot] = typeof value === 'function' ? value(states[slot]) : value; }];
    },
    useRef(initial) { const [ref] = react.useState({ current: initial }); return ref; },
    useCallback(callback) { return callback; },
    useEffect() {},
  };
  const playback = load('lib/use-audio-playback.ts', { react });
  const Component = load('components/ReaderAudioBar.tsx', {
    react,
    '@/lib/use-audio-playback': playback,
    '@/lib/nuggets-api': { getPublishedNuggets: async () => [] },
    'next/navigation': { useRouter: () => ({ push() {} }) },
  }).default;
  const props = { title: 'Selected teaching', subtitle: 'Proverbs 3:5', slug: 'selected', coverImage: '/images/musical.png', audioSrc: src };
  function render() {
    cursor = 0;
    const tree = Component(props); const nodes = [];
    function walk(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) { node.forEach(walk); return; }
      nodes.push(node); walk(node.props?.children);
    }
    walk(tree);
    return { nodes, audio: nodes.find(node => node.type === 'audio'), control: label => nodes.find(node => node.props?.['aria-label'] === label) };
  }
  let view = render();
  const media = {
    paused: true, duration: 120, currentTime: 0, muted: false,
    async play() { this.paused = false; view.audio.props.onPlay(); },
    pause() { this.paused = true; view.audio.props.onPause(); },
  };
  view.audio.props.ref(media);
  return { render, media };
}
test('Reader sends the selected commentary URL to its audio element and wires desktop/mobile playback', async () => {
  const { render, media } = fixture(); let view = render();
  assert.equal(view.audio.props.src, 'https://media.example/commentary.mp3');
  assert.equal(view.nodes.filter(node => node.props?.['aria-label'] === 'Play').length, 2);
  await view.control('Play').props.onClick();
  view = render(); assert.equal(media.paused, false); assert.ok(view.control('Pause'));
  view.control('Pause').props.onClick();
  assert.equal(media.paused, true); assert.ok(render().control('Play'));
});
test('Reader seeking, repeat, mute and elapsed time use real media state', () => {
  const { render, media } = fixture(); let view = render();
  assert.equal(view.control('Audio progress').props.max, 120);
  view.control('Audio progress').props.onChange({ target: { value: '45' } });
  assert.equal(media.currentTime, 45);
  view.audio.props.onTimeUpdate();
  view.control('Repeat').props.onClick(); view.control('Mute').props.onClick();
  view = render(); assert.equal(view.audio.props.loop, true); assert.equal(media.muted, true);
  assert.equal(view.control('Audio progress').props.value, 45); assert.ok(view.control('Unmute'));
});
test('Reader disables playback without a commentary URL and reports unavailable files', () => {
  const empty = fixture(null).render();
  assert.equal(empty.audio.props.src, undefined); assert.equal(empty.control('Play').props.disabled, true);
  assert.ok(empty.nodes.some(node => node.props?.role === 'status'));
  const fixtureWithAudio = fixture(); fixtureWithAudio.render().audio.props.onError();
  const error = fixtureWithAudio.render().nodes.find(node => node.props?.role === 'status');
  assert.match(error.props.children, /unavailable/);
});
