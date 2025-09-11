#!/bin/bash

# CreatorDaily Backfill Script
# Runs historical backfill for CreatorDaily data

set -e

echo "🚀 Starting CreatorDaily backfill..."

# Check if date range is provided
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <since-date> <until-date>"
    echo "Example: $0 2024-01-01 2024-01-31"
    exit 1
fi

SINCE=$1
UNTIL=$2

echo "📅 Backfilling from $SINCE to $UNTIL"

# Run backfill with optimal settings
pnpm tsx scripts/backfill-creator-daily.ts \
  --since="$SINCE" \
  --until="$UNTIL" \
  --batchDays=3 \
  --concurrency=2

echo "✅ Backfill completed successfully!"
