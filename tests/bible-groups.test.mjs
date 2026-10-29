import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function('exports', 'require', code)(exports, name => dependencies[name] || require(name));
  return exports;
}
const bible = load('lib/bible-books.ts');
const { filterNuggets } = load('lib/nuggets.ts', { './bible-books': bible });

test('every one of the 66 books belongs to exactly one group', () => {
  const all = bible.BIBLE_GROUPS.flatMap(group => group.books);
  assert.equal(all.length, 66); assert.equal(new Set(all).size, 66);
  assert.deepEqual(all, bible.BIBLE_BOOKS);
  for (const book of all) {
    assert.ok(bible.bibleGroupForBook(book));
    assert.equal(bible.bibleBookFromReference(`${book} 1:1`), book);
  }
});
test('books map to the correct biblical divisions, including numbered books and aliases', () => {
  for (const [book, group] of Object.entries({ Genesis: 'The Pentateuch', Nehemiah: 'History & Leadership', Psalm: 'Wisdom Literature', Isaiah: 'Major Prophets', Malachi: 'Minor Prophets', Matthew: 'Gospels', Acts: 'Acts & Early Church', Romans: 'Pauline Epistles', Hebrews: 'General Epistles', Revelation: 'Revelation' })) {
    assert.equal(bible.bibleGroupForBook(book), group);
  }
  assert.equal(bible.bibleBookFromReference('1 John 2:3'), '1 John');
  assert.equal(bible.bibleBookFromReference('Psalm 15:4'), 'Psalms');
  assert.equal(bible.bibleGroupForBook('Song of Songs'), 'Wisdom Literature');
  assert.equal(bible.bibleBookFromReference('Not a book 1:1'), undefined);
});
test('legacy records filter by their derived group without changing stored content', () => {
  const original = { title: 'Work', topic: 'Business', tag: '', scriptureRef: 'Isaiah 40:31', scriptureText: 'Scripture', keyPrinciple: 'Principle', marketplaceApplication: '', practicalActionPlan: [], challenges: [], book: 'Isaiah', bibleSection: 'The Prophets' };
  const normalized = bible.withBibleGroup(original);
  assert.equal(normalized.bibleSection, 'Major Prophets');
  assert.equal(original.bibleSection, 'The Prophets');
  assert.equal(filterNuggets({sections: ['Major Prophets']}, [original]).length, 1);
  assert.equal(filterNuggets({sections: ['Minor Prophets']}, [original]).length, 0);
  assert.equal(filterNuggets({query: 'Isaiah Major Prophets'}, [original]).length, 1);
});


test('changing the selected book keeps chapter and verse while synchronizing the reference', () => {
  assert.equal(bible.referenceWithBook('Isaiah', 'Genesis 40:31'), 'Isaiah 40:31');
  assert.equal(bible.referenceWithBook('2 John', '1 John 1:3–5'), '2 John 1:3–5');
  assert.equal(bible.referenceWithBook('Psalms', ''), '');
});
