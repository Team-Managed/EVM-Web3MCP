import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { ManifestError, validateManifest } from '../dist/index.js';

const fixtures = new URL('../../../spec/fixtures/', import.meta.url);
const load = (dir: string, file: string): unknown => JSON.parse(readFileSync(new URL(`${dir}/${file}`, fixtures), 'utf8'));

for (const file of readdirSync(new URL('valid/', fixtures))) {
  test(`accepts ${file}`, () => {
    const manifest = validateManifest(load('valid', file));
    assert.equal(`${manifest.name}.json`, file);
  });
}

for (const file of readdirSync(new URL('invalid/', fixtures))) {
  test(`rejects ${file}`, () => {
    assert.throws(() => validateManifest(load('invalid', file)), ManifestError);
  });
}
