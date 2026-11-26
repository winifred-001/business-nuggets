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
const htmlFormatting = loadTs('lib/nugget-html.ts');
const text = loadTs('lib/nugget-text.ts', {'./nugget-html': htmlFormatting});
const Component = loadTs('components/FormattedNuggetText.tsx', { '@/lib/nugget-text': text, '@/lib/nugget-html': htmlFormatting }).default;

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
test('drops scripts and images and strips event handlers', () => {
  const html = renderToStaticMarkup(React.createElement(Component, {text:'<script>alert(1)</script> **<img src=x onerror=alert(1)>** <strong onclick="alert(1)">unsafe</strong>'}));
  assert.doesNotMatch(html, /<script|<img|<strong onclick/);
  assert.doesNotMatch(html, /alert\(1\)|onerror|onclick/);
});
test('unclosed formatting stays readable and previews contain no formatting markers', () => {
  assert.deepEqual(text.nuggetBoldParts('**unfinished'), [{text:'**unfinished',bold:false}]);
  assert.equal(text.nuggetExcerpt('## Heading\n**Wise**<br><strong>work</strong>'), 'Heading Wise work');
});

test('six-line previews keep bold and line breaks in one clampable flow without changing the full reader rendering', () => {
  const content = '## Heading\n**First line**\n\nSecond paragraph<br>Last line';
  const preview = renderToStaticMarkup(React.createElement(Component, {text: content, preview: true}));
  assert.match(preview, /line-clamp-6/);
  assert.doesNotMatch(preview, /<p|<h3/);
  assert.match(preview, /<strong[^>]*>First line<\/strong>/);
  assert.match(preview, /Second paragraph\nLast line/);
  const full = renderToStaticMarkup(React.createElement(Component, {text: content}));
  assert.doesNotMatch(full, /line-clamp-6/);
  assert.match(full, /<h3[^>]*>Heading<\/h3>/);
  assert.match(full, /Last line/);
});

test('renders safe nested HTML, lists, links and bold aliases', () => {
  const html = renderToStaticMarkup(React.createElement(Component, {text:'<h2>Teaching</h2><p><bold>Bold</bold> <em><u>emphasis</u></em></p><ul><li>One</li><li>Two</li></ul><a href="https://example.com" target="_blank">Read</a>'}));
  assert.match(html, /<h3[^>]*>Teaching<\/h3>/);
  assert.match(html, /<strong[^>]*>Bold<\/strong>/);
  assert.match(html, /<em[^>]*><u[^>]*>emphasis/);
  assert.match(html, /<ul[^>]*><li[^>]*>One/);
  assert.match(html, /href="https:\/\/example.com"/);
  assert.match(html, /rel="noopener noreferrer"/);
});
test('rejects encoded script URLs, attributes and unsafe styles', () => {
  const html = renderToStaticMarkup(React.createElement(Component, {text:'<p onclick="alert(1)" style="position:fixed;background:url(javascript:alert(1));text-align:center">Safe</p><a href="jav&#x61;script:alert(1)">Link</a><svg><script>alert(1)</script></svg><iframe src="https://example.com"></iframe>'}));
  assert.doesNotMatch(html, /onclick|javascript|position:fixed|background|<svg|<script|<iframe|alert/);
  assert.match(html, /text-align:center/);
});
test('HTML previews stay within the six-line clamp and excerpts contain plain text only', () => {
  const html = renderToStaticMarkup(React.createElement(Component, {text:'<p><strong>First</strong><br>Second</p><ol><li>Third</li></ol>',preview:true}));
  assert.match(html, /line-clamp-6/);
  assert.doesNotMatch(html, /<p|<ol|<li/);
  assert.equal(text.nuggetExcerpt('<p>First &amp; <em>second</em></p><ul><li>Third</li></ul><script>bad()</script>'), 'First & second Third');
});
