import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const loadDependency = createRequire(import.meta.url);
function loadTs(file, dependencies = {}) {
  const output = ts.transpileModule(fs.readFileSync(path.join(testDirectory, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function('exports', 'require', output)(exports, name => dependencies[name] || loadDependency(name));
  return exports;
}
const text = loadTs('lib/nugget-text.ts');
const Component = loadTs('components/FormattedNuggetText.tsx', { '@/lib/nugget-text': text }).default;

test('supports Markdown and HTML bold while preserving ordinary text', () => {
  assert.deepEqual(text.nuggetBoldParts('Start **bold** <STRONG>strong</STRONG> <b>bold too</b> end'), [
    {text:'Start ',bold:false}, {text:'bold',bold:true}, {text:' ',bold:false}, {text:'strong',bold:true}, {text:' ',bold:false}, {text:'bold too',bold:true}, {text:' end',bold:false},
  ]);
});
test('preserves newline, break and paragraph formatting', () => {
  assert.deepEqual(text.nuggetBlocks('<p>First<br/>Second</p><p>Third\r\nFourth</p>'), [
    {text:'First\nSecond',heading:false}, {text:'Third\nFourth',heading:false},
  ]);
});
test('recognizes explicit content headings without turning ordinary uppercase text into headings', () => {
  assert.deepEqual(text.nuggetBlocks('## Key principles\n**Be wise**\n\nORDINARY TEXT'), [
    {text:'Key principles',heading:true}, {text:'**Be wise**',heading:false}, {text:'ORDINARY TEXT',heading:false},
  ]);
});
test('renders true strong elements and semantic headings', () => {
  const html = renderToStaticMarkup(React.createElement(Component, {text:'## Key principles\n**Be wise** and <b>fair</b>'}));
  assert.match(html, /<h3[^>]*>Key principles<\/h3>/);
  assert.match(html, /<strong[^>]*>Be wise<\/strong>/);
  assert.match(html, /<strong[^>]*>fair<\/strong>/);
});
test('escapes arbitrary HTML and event handlers instead of executing them', () => {
  const html = renderToStaticMarkup(React.createElement(Component, {text:'<script>alert(1)</script> **<img src=x onerror=alert(1)>** <strong onclick="alert(1)">unsafe</strong>'}));
  assert.doesNotMatch(html, /<script|<img|<strong onclick/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;img/);
});
test('unclosed formatting stays readable and previews contain no formatting markers', () => {
  assert.deepEqual(text.nuggetBoldParts('**unfinished'), [{text:'**unfinished',bold:false}]);
  assert.equal(text.nuggetExcerpt('## Heading\n**Wise**<br><strong>work</strong>'), 'Heading Wise work');
});
