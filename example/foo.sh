#!/bin/bash
read -rsn1 -p 'List all files? (y/N) ' can_commit
echo ""
[ "${can_commit,,}" == "y" ] && {
  ls --color='always' $1 ${TURMA} #$@
}
