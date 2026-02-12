#!/usr/bin/env bash

set -euo pipefail

CANONICAL_PATH="/Users/thorsrud/prediktfi-protocol-1"
EXPECTED_BRANCH="ag-new-concept"
EXPECTED_UPSTREAM="origin/ag-new-concept"
EXPECTED_VERCEL_PROJECT="prediktfi-protocol"

current_path="$(pwd -P)"
if [[ "${current_path}" != "${CANONICAL_PATH}" ]]; then
  echo "ERROR: run this command from ${CANONICAL_PATH}" >&2
  echo "Current path: ${current_path}" >&2
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: not inside a git repository" >&2
  exit 1
fi

current_branch="$(git rev-parse --abbrev-ref HEAD)"
if [[ "${current_branch}" != "${EXPECTED_BRANCH}" ]]; then
  echo "ERROR: branch must be ${EXPECTED_BRANCH}" >&2
  echo "Current branch: ${current_branch}" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERROR: working tree is dirty. Commit/stash changes before deploy." >&2
  git status --short
  exit 1
fi

if ! upstream_branch="$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null)"; then
  echo "ERROR: no upstream branch configured for ${current_branch}" >&2
  exit 1
fi

if [[ "${upstream_branch}" != "${EXPECTED_UPSTREAM}" ]]; then
  echo "ERROR: upstream must be ${EXPECTED_UPSTREAM}" >&2
  echo "Current upstream: ${upstream_branch}" >&2
  exit 1
fi

if [[ ! -f ".vercel/project.json" ]]; then
  echo "ERROR: .vercel/project.json not found. Project link is required." >&2
  exit 1
fi

vercel_project="$(jq -r '.projectName // empty' .vercel/project.json)"
if [[ -z "${vercel_project}" ]]; then
  echo "ERROR: .vercel/project.json is missing projectName." >&2
  exit 1
fi

if [[ "${vercel_project}" != "${EXPECTED_VERCEL_PROJECT}" ]]; then
  echo "ERROR: linked Vercel project must be ${EXPECTED_VERCEL_PROJECT}" >&2
  echo "Current .vercel/project.json projectName: ${vercel_project}" >&2
  exit 1
fi

current_sha="$(git rev-parse --short HEAD)"
echo "pwd: ${current_path}"
echo "branch: ${current_branch}"
echo "sha: ${current_sha}"
echo "vercel project: ${vercel_project}"
echo "OK: deploy context verified (${current_branch}@${current_sha})"
