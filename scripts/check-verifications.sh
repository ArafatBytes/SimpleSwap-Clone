#!/bin/bash

# Load environment variables from .env.local
source "$(dirname "$0")/../.env.local"

# Your application URL - replace with your actual URL
APP_URL="http://localhost:3000"

# Make the request to the verification endpoint
curl -X GET \
  "${APP_URL}/api/cron/check-verifications" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json"
