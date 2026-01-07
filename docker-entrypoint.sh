#!/bin/sh
set -e

# Replace environment variables in dashboard.html
envsubst '${STATIONS} ${GRAFANA_URL_1} ${GRAFANA_URL_2}' < /usr/share/nginx/html/dashboard.html > /tmp/dashboard.html
mv /tmp/dashboard.html /usr/share/nginx/html/dashboard.html

# Execute the CMD
exec "$@"
