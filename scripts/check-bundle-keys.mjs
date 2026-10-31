#!/usr/bin/env node
/**
 * Scan built JS for Supabase key material.
 * Prints JWT role claims only. Never prints a token or a key.
 * Exit 1 when a service_role JWT is present.
 *
 *   node scripts/check-bundle-keys.mjs
 *   node scripts/check-bundle-keys.mjs --url https://preview.example
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const jwtRe = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g;

function roleOf(token) {
  try {
    const part = token.split('.')[1] || '';
    const pad = part.length % 4 === 0 ? '' : '='.repeat(4 - (part.length % 4));
    const json = Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64').toString('utf8');
    const payload = JSON.parse(json);
    return typeof payload.role === 'string' && payload.role ? payload.role : 'unknown';
  } catch {
    return 'unreadable';
  }
}

function scanText(text) {
  const roles = new Set();
  for (const match of text.matchAll(jwtRe)) roles.add(roleOf(match[0]));
  return {
    roles: [...roles].sort(),
    publishable: text.includes('sb_publishable_'),
    secret: text.includes('sb_secret_'),
  };
}

async function filesIn(dir) {
  const found = [];
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await filesIn(full));
    else if (entry.name.endsWith('.js')) found.push(full);
  }
  return found;
}

async function localText() {
  const root = path.resolve('.next/static');
  const files = await filesIn(root);
  if (!files.length) {
    console.log('bundles: none (.next/static has no js)');
    return '';
  }
  console.log(`bundles: ${files.length} local js files`);
  const parts = [];
  for (const file of files) parts.push(await readFile(file, 'utf8'));
  return parts.join('\n');
}

async function previewText(pageUrl) {
  const page = await fetch(pageUrl);
  if (!page.ok) throw new Error(`page ${page.status}`);
  const html = await page.text();
  const origin = new URL(pageUrl).origin;
  const srcs = new Set();
  for (const match of html.matchAll(/(?:src|href)="([^"]*\/_next\/static\/[^"]+\.js)"/g)) {
    const src = match[1];
    srcs.add(src.startsWith('http') ? src : `${origin}${src.startsWith('/') ? '' : '/'}${src}`);
  }
  console.log(`bundles: ${srcs.size} preview js files`);
  const parts = [];
  for (const src of srcs) {
    const res = await fetch(src);
    if (!res.ok) continue;
    parts.push(await res.text());
  }
  return parts.join('\n');
}

const urlFlag = process.argv.indexOf('--url');
const pageUrl = urlFlag >= 0 ? process.argv[urlFlag + 1] : '';
const text = pageUrl ? await previewText(pageUrl) : await localText();
const result = scanText(text);
console.log(`roles: ${result.roles.length ? result.roles.join(', ') : 'none'}`);
console.log(`sb_publishable_: ${result.publishable ? 'yes' : 'no'}`);
console.log(`sb_secret_: ${result.secret ? 'yes' : 'no'}`);
if (result.roles.includes('service_role')) process.exit(1);
