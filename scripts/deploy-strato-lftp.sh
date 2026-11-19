#!/usr/bin/env bash
# Upload .deploy-staging/ via SFTP (lftp). Strato: geen shell/SCP, wel SFTP.
set -euo pipefail

for v in STRATO_SFTP_SERVER STRATO_SFTP_USERNAME STRATO_SFTP_PASSWORD; do
	if [[ -z "${!v:-}" ]]; then
		echo "Ontbrekend: $v" >&2
		exit 1
	fi
done

REMOTE_DIR="${STRATO_SFTP_REMOTE_DIR:-/}"
REMOTE_DIR="${REMOTE_DIR%/}"
if [[ -z "$REMOTE_DIR" ]]; then
	REMOTE_DIR="/"
fi

STAGING=".deploy-staging"
if [[ ! -d "$STAGING" ]]; then
	echo "Eerst: node scripts/stage-strato-deploy.mjs" >&2
	exit 1
fi

lftp <<EOF
set sftp:connect-program "ssh -a -x -o StrictHostKeyChecking=accept-new"
open -u "${STRATO_SFTP_USERNAME}","${STRATO_SFTP_PASSWORD}" "sftp://${STRATO_SFTP_SERVER}:22"
cd "${REMOTE_DIR}"
lcd "${STAGING}"
mirror -R --verbose --no-perms --no-umask
bye
EOF

echo "SFTP-upload voltooid naar ${REMOTE_DIR}"