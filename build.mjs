#!/usr/bin/env node

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { cpSync } from 'node:fs';
import { fetchProfile } from '@singi-labs/sifa-sdk/query/fetchers';

import {
  renderHome,
  renderNewsPage,
  renderPublicationsPage,
  renderFundingPage,
  renderServicePage,
} from './site-renderer.mjs';

const SIFA_ID =
  process.env.SIFA_ID ??
  process.env.SIFA_DID ??
  process.env.SIFA_HANDLE ??
  'ronentk.me';

const SIFA_BASE = process.env.SIFA_BASE ?? 'https://sifa.id';
const OUT = 'dist';

async function readJson(path) {
  return JSON.parse(
    await readFile(new URL(path, import.meta.url), 'utf8')
  );
}

async function main() {
  console.log(`Building site for "${SIFA_ID}"...`);

  const profile = await fetchProfile(
    { baseUrl: SIFA_BASE },
    SIFA_ID
  );

  if (!profile) {
    throw new Error(`No public Sifa profile found for "${SIFA_ID}".`);
  }

  const [
    localProfile,
    news,
    publications,
    funding,
    hiring,
    service,
  ] = await Promise.all([
    readJson('./profile.json'),
    readJson('./content/news.json'),
    readJson('./content/publications.json'),
    readJson('./content/funding.json'),
    readJson('./content/hiring.json'),
    readJson('./content/service.json'),
  ]);

  Object.assign(profile, localProfile, {
    news,
    publications,
    funding,
    hiring,
    service,
  });

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  cpSync('assets', `${OUT}/assets`, { recursive: true });

  await writeFile(
    `${OUT}/site.css`,
    await readFile(new URL('./site.css', import.meta.url), 'utf8')
  );

  await Promise.all([
    writeFile(`${OUT}/index.html`, renderHome(profile)),
    writeFile(`${OUT}/news.html`, renderNewsPage(profile)),
    writeFile(`${OUT}/publications.html`, renderPublicationsPage(profile)),
    writeFile(`${OUT}/funding.html`, renderFundingPage(profile)),
    writeFile(`${OUT}/service.html`, renderServicePage(profile)),
  ]);

  console.log('Done.');
}

main().catch((err) => {
  console.error(`Build failed: ${err.message}`);
  process.exit(1);
});
