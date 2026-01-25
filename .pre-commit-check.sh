#!/bin/bash

# .pre-commit-check.sh
# Security Guard: Stops massive code deletion
# Threshold: 15% reduction in any file

THRESHOLD_PERCENT=15
THRESHOLD_LINES=10
RED='\033[0;31m'
YELLOW='\033[1;33m'
Green='\033[0;32m'
NC='\033[0m'

# Files to watch closely (Always exist, but just general check is better)
# IMPORTANT_FILES=("src/training/TrainingView.tsx" "src/services/aiService.ts")

echo "🛡️  Running Code Integrity Check..."

files=$(git diff --cached --name-only --diff-filter=AM)

if [ -z "$files" ]; then
    exit 0
fi

has_error=0

for file in $files; do
    if [ ! -f "$file" ]; then continue; fi

    # Check against HEAD
    if git rev-parse --verify "HEAD:$file" >/dev/null 2>&1; then
        lines_before=$(git show "HEAD:$file" | wc -l | xargs)
    else
        lines_before=0
    fi
    
    lines_after=$(wc -l < "$file" | xargs)

    if [ "$lines_before" -eq 0 ]; then continue; fi

    diff=$((lines_before - lines_after))

    if [ "$diff" -gt 0 ]; then
        percent_lost=$(( (diff * 100) / lines_before ))

        if [ "$diff" -gt "$THRESHOLD_LINES" ] && [ "$percent_lost" -gt "$THRESHOLD_PERCENT" ]; then
            echo -e "${RED}⚠️  تنبيه أمني: تم اكتشاف حذف كبير في الأكواد!${NC}"
            echo -e "${RED}⚠️  SECURITY ALERT: Massive code deletion detected in '$file'${NC}"
            echo -e "   - Before: $lines_before lines"
            echo -e "   - After:  $lines_after lines"
            echo -e "   - Lost:   $diff lines ($percent_lost%)"
            echo -e "${YELLOW}   Maximum allowed deletion is $THRESHOLD_PERCENT%.${NC}"
            echo -e "${YELLOW}   If this is intentional (e.g. cleanup), commit with '--no-verify'.${NC}"
            has_error=1
        fi
    fi
done

if [ "$has_error" -eq 1 ]; then
    echo -e "${RED}⛔ COMMIT ABORTED (تم إيقاف الرفع)${NC}"
    exit 1
fi

echo -e "${Green}✅ Code Integrity Verified.${NC}"
exit 0
