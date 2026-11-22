import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const files = ["package.json", "package-lock.json", "CHANGELOG.md"] as const;
const git = (...args: string[]) => execFileSync("git", args, { encoding: "utf8" }).trim();
const run = (command: string, ...args: string[]) => execFileSync(command, args, { stdio: "inherit" });

function readVersion() {
  const { version } = JSON.parse(readFileSync(files[0], "utf8")) as { version: string };
  const lock = JSON.parse(readFileSync(files[1], "utf8")) as { version: string; packages: { "": { version: string } } };
  assert.match(version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/, "A stable package version is required");
  assert.equal(lock.version, version, "Update package-lock.json before releasing");
  assert.equal(lock.packages[""].version, version, "Update the root lock version before releasing");
  return version;
}

const npm = process.env.npm_execpath;
assert(npm && process.argv.length === 2, "Usage: npm run release (pushes a release tag)");
assert.equal(git("status", "--porcelain"), "", "Release requires a clean working tree");
git("ls-files", "--error-unmatch", "--", ...files, ".github/workflows/publish.yml");

const version = readVersion();
const notes = readFileSync(files[2], "utf8");
const title = notes.match(/^# Changelog\r?\n\r?\n/)?.[0] ?? "";
const entries = notes.slice(title.length);
const heading = title ? "##" : "#";
const newline = notes.includes("\r\n") ? "\r\n" : "\n";
assert.equal(entries.split(/\r?\n/, 1)[0], `${heading} ${version}`, "Put the current version first in CHANGELOG.md");

const branch = git("branch", "--show-current");
const head = git("rev-parse", "HEAD");
const remoteHead = git("ls-remote", "--symref", "origin", "HEAD");
assert.equal(remoteHead, `ref: refs/heads/${branch}\tHEAD\n${head}\tHEAD`, "Push the default branch to origin first");

const tag = `v${version}`;
const ref = `refs/tags/${tag}`;
if (git("tag", "--list", tag)) {
  assert.equal(git("rev-parse", `${ref}^{commit}`), head, `${tag} already points to a different commit`);
} else {
  run("git", "tag", "--annotate", tag, head, "--message", tag);
}
run("git", "push", "--no-follow-tags", "origin", `${ref}:${ref}`);

run(process.execPath, npm, "version", "patch", "--no-git-tag-version", "--ignore-scripts", "--save");
const next = readVersion();
writeFileSync(files[2], `${title}${heading} ${next}${newline}${newline}${entries}`);
run("git", "commit", "--only", "--message", `next version: ${next}`, "--", ...files);
