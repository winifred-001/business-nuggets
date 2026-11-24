import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('the root layout mounts one site-wide audio provider outside page navigation', () => {
  const layout = read('app/layout.tsx');
  const provider = read('components/GlobalAudioPlayerProvider.tsx');
  assert.match(layout, /GlobalAudioPlayerProvider/);
  assert.match(layout, /<GlobalAudioPlayerProvider>\{children\}<\/GlobalAudioPlayerProvider>/);
  assert.match(provider, /<audio[\s\S]*?ref=\{audioRef\}/);
  assert.match(provider, /registerLocalControl/);
  assert.match(provider, /localControlCounts/);
  assert.equal((provider.match(/<audio\b/g) || []).length, 1);
  assert.match(provider, /const showMiniPlayer = Boolean\(track && !localControlCounts\[track.src\]\)/);
  assert.match(provider, /\{showMiniPlayer && track && \(/);
  assert.match(provider, /aria-label="Floating audio player"/);
  assert.match(provider, /aria-label="Open full audio player"/);
  assert.match(provider, /aria-label="Audio progress"/);
});

test('Nugget, music, commentary and reader controls share the persistent audio element', () => {
  for (const path of [
    'components/AudioBar.tsx',
    'components/FullAudioPlayer.tsx',
    'components/MusicalView.tsx',
    'components/ReaderAudioBar.tsx',
  ]) {
    const source = read(path);
    assert.match(source, /useGlobalAudioPlayer/);
    assert.doesNotMatch(source, /<audio\b/);
  }
  assert.match(read('components/ReaderAudioBar.tsx'), /player\.playTrack/);
  assert.match(read('components/MusicalView.tsx'), /kind: "music"/);
  assert.match(read('components/FullAudioPlayer.tsx'), /kind: "nugget"/);
});

test('the persistent player retains controls for play, pause, seek, mute, repeat and speed', () => {
  const provider = read('components/GlobalAudioPlayerProvider.tsx');
  for (const method of ['playTrack', 'togglePlay', 'seekTo', 'toggleMute', 'toggleRepeat', 'changeSpeed']) {
    assert.match(provider, new RegExp(method));
  }
  assert.match(provider, /onTimeUpdate/);
  assert.match(provider, /onLoadedMetadata/);
});

test('compact and floating audio players expose previous and next track controls', () => {
  const compact = read('components/AudioBar.tsx').split('if (compact) {')[1].split('return (\n    <div className={')[0];
  const provider = read('components/GlobalAudioPlayerProvider.tsx');
  assert.match(compact, /Previous \$\{label\} track/);
  assert.match(compact, /Next \$\{label\} track/);
  assert.match(compact, /onClick=\{\(\) => void move\(-1\)\}/);
  assert.match(compact, /onClick=\{\(\) => void move\(1\)\}/);
  assert.match(provider, /aria-label="Previous audio track"/);
  assert.match(provider, /aria-label="Next audio track"/);
  assert.match(provider, /moveMiniTrack\(-1\)/);
  assert.match(provider, /moveMiniTrack\(1\)/);
  assert.match(provider, /getPlayableAudioNuggets\(track.kind\)/);
  assert.doesNotMatch(provider, /router\.push/);
});
