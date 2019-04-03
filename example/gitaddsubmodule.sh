#!/bin/bash
[ $# -lt 1 ] && { echo "USAGE: $0 <username> [turma]"; exit 1; }

username="${1,,}"
turma="${2:-CB01}"

git rm --cached "./${turma}/${username}"

git submodule add -b master \
  "https://github.com/${username}/ProgWeb" \
  "./${turma}/${username}"
