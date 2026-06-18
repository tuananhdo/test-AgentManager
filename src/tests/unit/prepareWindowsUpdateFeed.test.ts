import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { prepareWindowsUpdateFeed } from '../../../scripts/prepare-windows-update-feed.mjs';

function writeTextFile(filePath: string, content: string) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
}

describe('prepareWindowsUpdateFeed', () => {
  it('copies Squirrel RELEASES and full nupkg files into per-arch static storage directories', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'agm-update-feed-'));
    const sourceDir = path.join(rootDir, 'release-assets');
    const outputDir = path.join(rootDir, 'windows-update-feed');

    writeTextFile(
      path.join(sourceDir, 'squirrel.windows/x64/RELEASES'),
      'hash antigravity_manager-0.17.1-full.nupkg 123\n',
    );
    writeTextFile(
      path.join(sourceDir, 'squirrel.windows/x64/antigravity_manager-0.17.1-full.nupkg'),
      'x64 package',
    );
    writeTextFile(
      path.join(sourceDir, 'squirrel.windows/arm64/RELEASES'),
      'hash antigravity_manager-0.17.1-arm64-full.nupkg 123\n',
    );
    writeTextFile(
      path.join(sourceDir, 'squirrel.windows/arm64/antigravity_manager-0.17.1-arm64-full.nupkg'),
      'arm64 package',
    );

    const result = prepareWindowsUpdateFeed({ sourceDir, outputDir });

    expect(result).toEqual({
      x64: {
        releases: path.join(outputDir, 'win32/x64/RELEASES'),
        packages: [path.join(outputDir, 'win32/x64/antigravity_manager-0.17.1-full.nupkg')],
      },
      arm64: {
        releases: path.join(outputDir, 'win32/arm64/RELEASES'),
        packages: [path.join(outputDir, 'win32/arm64/antigravity_manager-0.17.1-arm64-full.nupkg')],
      },
    });
    expect(existsSync(path.join(outputDir, 'win32/x64/RELEASES'))).toBe(true);
    expect(existsSync(path.join(outputDir, 'win32/arm64/RELEASES'))).toBe(true);
    expect(readFileSync(path.join(outputDir, 'win32/arm64/RELEASES'), 'utf8')).toContain(
      'antigravity_manager-0.17.1-arm64-full.nupkg',
    );
  });
});
