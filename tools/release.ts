import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const files = ["package.json", "CHANGELOG.md"] as const;
const git = (...args: string[]) => execFileSync("git", args, { encoding: "utf8" }).trim();
const run = (command: string, ...args: string[]) => execFileSync(command, args, { stdio: "inherit" });

function readVersion() {
  const { version } = JSON.parse(readFileSync(files[0], "utf8")) as { version: string };
  assert.match(version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/, "A stable package version is required");
  return version;
}

assert(process.argv.length === 2, "Usage: pnpm run release (pushes a release tag)");
assert.equal(git("status", "--porcelain"), "", "Release requires a clean working tree");
git("ls-files", "--error-unmatch", "--", ...files, "pnpm-lock.yaml", ".github/workflows/publish.yml");

const version = readVersion();
const notes = readFileSync(files[1], "utf8");
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

execFileSync("pnpm", ["version", "patch", "--no-git-tag-version", "--ignore-scripts"], { stdio: "inherit" });
const next = readVersion();
writeFileSync(files[1], `${title}${heading} ${next}${newline}${newline}${entries}`);
run("git", "commit", "--only", "--message", `next version: ${next}`, "--", ...files);
