import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const WINDOWS_ARCHES = ['x64', 'arm64'];

function listFilesRecursive(rootDir) {
  if (!existsSync(rootDir)) {
    return [];
  }

  const entries = readdirSync(rootDir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      return listFilesRecursive(entryPath);
    }

    if (entry.isFile()) {
      return [entryPath];
    }

    return [];
  });
}

function findRequiredFile(files, predicate, label) {
  const file = files.find(predicate);
  if (!file) {
    throw new Error(`Missing ${label}`);
  }

  return file;
}

function hasPathSegment(filePath, segment) {
  return filePath.split(/[\\/]+/).includes(segment);
}

function parseArgs(argv) {
  const result = {
    sourceDir: 'release-assets',
    outputDir: 'windows-update-feed',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[index + 1];
    if (arg === '--source') {
      result.sourceDir = value;
      index += 1;
    } else if (arg === '--output') {
      result.outputDir = value;
      index += 1;
    }
  }

  return result;
}

export function prepareWindowsUpdateFeed({
  sourceDir = 'release-assets',
  outputDir = 'windows-update-feed',
} = {}) {
  const files = listFilesRecursive(sourceDir);
  const result = {};

  rmSync(outputDir, { recursive: true, force: true });

  for (const arch of WINDOWS_ARCHES) {
    const releases = findRequiredFile(
      files,
      (file) => path.basename(file) === 'RELEASES' && hasPathSegment(file, arch),
      `Windows ${arch} RELEASES file`,
    );
    const packages = files.filter(
      (file) => file.endsWith('-full.nupkg') && hasPathSegment(file, arch),
    );
    if (packages.length === 0) {
      throw new Error(`Missing Windows ${arch} full .nupkg package`);
    }

    const targetDir = path.join(outputDir, 'win32', arch);
    mkdirSync(targetDir, { recursive: true });

    const targetReleases = path.join(targetDir, 'RELEASES');
    cpSync(releases, targetReleases);

    const targetPackages = packages.map((file) => {
      const targetPackage = path.join(targetDir, path.basename(file));
      cpSync(file, targetPackage);
      return targetPackage;
    });

    result[arch] = {
      releases: targetReleases,
      packages: targetPackages,
    };
  }

  return result;
}

function runCli() {
  const result = prepareWindowsUpdateFeed(parseArgs(process.argv.slice(2)));
  for (const [arch, files] of Object.entries(result)) {
    console.log(`Prepared win32/${arch}: ${files.releases}, ${files.packages.length} package(s)`);
  }
}

const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFilePath) {
  runCli();
}
