#!/usr/bin/env node

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { cpSync } from 'node:fs';
import { fetchProfile } from '@singi-labs/sifa-sdk/query/fetchers';

import {
  renderHome,
  renderNewsPage,
  renderPublicationsPage,
  renderFundingPage,
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

  const localProfile = await readJson('./profile.json');
  const news = await readJson('./content/news.json');
  const publications = await readJson('./content/publications.json');
  const funding = await readJson('./content/funding.json');
  const positions = await readJson('./content/positions.json');

  Object.assign(profile, localProfile);

  profile.news = news;
  profile.publications = publications;
  profile.funding = funding;
  profile.positions = positions;

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  cpSync('assets', `${OUT}/assets`, { recursive: true });

  await writeFile(
    `${OUT}/site.css`,
    await readFile(new URL('./site.css', import.meta.url), 'utf8')
  );

  await writeFile(
    `${OUT}/index.html`,
    renderHome(profile)
  );

  await writeFile(
    `${OUT}/news.html`,
    renderNewsPage(profile)
  );

  await writeFile(
    `${OUT}/publications.html`,
    renderPublicationsPage(profile)
  );

  await writeFile(
    `${OUT}/funding.html`,
    renderFundingPage(profile)
  );

  console.log('Done.');
}

main().catch((err) => {
  console.error(`Build failed: ${err.message}`);
  process.exit(1);
});
