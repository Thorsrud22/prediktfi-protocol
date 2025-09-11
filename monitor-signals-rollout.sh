#!/bin/bash

# Signals API Rollout Monitoring Script
# Continuously monitors rollout metrics for 30-60 minutes
# Usage: ./monitor-signals-rollout.sh [host] [duration_minutes]

set -e

HOST=${1:-"localhost:3000"}
DURATION_MINUTES=${2:-30}
API_URL="https://${HOST}/api/public/signals"

if [[ "$HOST" == localhost* ]]; then
    API_URL="http://${HOST}/api/public/signals"
fi

echo "📊 Monitoring Signals API rollout on $HOST"
echo "⏱️  Duration: $DURATION_MINUTES minutes"
echo "📍 API URL: $API_URL"
echo ""

# Monitoring configuration
INTERVAL=10  # seconds between checks
TOTAL_CHECKS=$((DURATION_MINUTES * 60 / INTERVAL))
CHECK_COUNT=0

# Metrics tracking
TOTAL_REQUESTS=0
SUCCESSFUL_REQUESTS=0
ERROR_5XX=0
CACHE_HITS=0
RESPONSE_TIMES=()

# Log file
LOG_FILE="/tmp/signals_rollout_$(date +%Y%m%d_%H%M%S).log"
echo "📝 Logging to: $LOG_FILE"
echo ""

# Headers
printf "%-8s %-12s %-8s %-10s %-8s %-12s %-10s\n" "Time" "Status" "Response" "Cache" "Rollout%" "Latency" "Hit Rate"
printf "%-8s %-12s %-8s %-10s %-8s %-12s %-10s\n" "--------" "------------" "--------" "----------" "--------" "------------" "----------"

while [[ $CHECK_COUNT -lt $TOTAL_CHECKS ]]; do
    TIMESTAMP=$(date +%H:%M:%S)
    
    # Make request and capture metrics
    START_TIME=$(date +%s%N)
    
    RESPONSE=$(curl -s -D- "$API_URL" 2>/dev/null || echo "ERROR")
    
    END_TIME=$(date +%s%N)
    LATENCY_MS=$(( (END_TIME - START_TIME) / 1000000 ))
    
    TOTAL_REQUESTS=$((TOTAL_REQUESTS + 1))
    
    if [[ "$RESPONSE" == "ERROR" ]]; then
        STATUS="ERROR"
        HTTP_CODE="000"
        CACHE_STATUS="ERROR"
        ROLLOUT_PERCENT="N/A"
        ERROR_5XX=$((ERROR_5XX + 1))
    else
        # Parse response
        HTTP_CODE=$(echo "$RESPONSE" | head -n1 | awk '{print $2}' || echo "000")
        CACHE_STATUS=$(echo "$RESPONSE" | grep -i '^x-cache:' | awk '{print $2}' | tr -d '\r\n' || echo "UNKNOWN")
        ROLLOUT_PERCENT=$(echo "$RESPONSE" | grep -i '^x-rollout-percent:' | awk '{print $2}' | tr -d '\r\n' || echo "0")
        
        if [[ "$HTTP_CODE" =~ ^2 ]] || [[ "$HTTP_CODE" == "304" ]]; then
            SUCCESSFUL_REQUESTS=$((SUCCESSFUL_REQUESTS + 1))
            STATUS="OK"
            
            # Track cache hits
            if [[ "$CACHE_STATUS" =~ HIT ]]; then
                CACHE_HITS=$((CACHE_HITS + 1))
            fi
        elif [[ "$HTTP_CODE" =~ ^5 ]]; then
            ERROR_5XX=$((ERROR_5XX + 1))
            STATUS="5XX"
        else
            STATUS="$HTTP_CODE"
        fi
    fi
    
    RESPONSE_TIMES+=($LATENCY_MS)
    
    # Calculate hit rate
    if [[ $TOTAL_REQUESTS -gt 0 ]]; then
        HIT_RATE=$(( (CACHE_HITS * 100) / TOTAL_REQUESTS ))
    else
        HIT_RATE=0
    fi
    
    # Display current metrics
    printf "%-8s %-12s %-8s %-10s %-8s %-12s %-10s\n" \
        "$TIMESTAMP" "$STATUS" "$HTTP_CODE" "$CACHE_STATUS" "${ROLLOUT_PERCENT}%" "${LATENCY_MS}ms" "${HIT_RATE}%"
    
    # Log detailed data
    echo "$TIMESTAMP,$HTTP_CODE,$CACHE_STATUS,$ROLLOUT_PERCENT,$LATENCY_MS,$HIT_RATE" >> "$LOG_FILE"
    
    CHECK_COUNT=$((CHECK_COUNT + 1))
    
    # Sleep until next check
    sleep $INTERVAL
done

echo ""
echo "📊 Final Rollout Report"
echo "======================="

# Calculate final metrics
SUCCESS_RATE=0
ERROR_RATE=0
if [[ $TOTAL_REQUESTS -gt 0 ]]; then
    SUCCESS_RATE=$(( (SUCCESSFUL_REQUESTS * 100) / TOTAL_REQUESTS ))
    ERROR_RATE=$(( (ERROR_5XX * 100) / TOTAL_REQUESTS ))
fi

# Calculate P95 response time
if [[ ${#RESPONSE_TIMES[@]} -gt 0 ]]; then
    # Sort response times
    IFS=$'\n' SORTED_TIMES=($(sort -n <<<"${RESPONSE_TIMES[*]}"))
    unset IFS
    
    # Calculate P95 (95th percentile)
    P95_INDEX=$(( (${#SORTED_TIMES[@]} * 95) / 100 ))
    if [[ $P95_INDEX -ge ${#SORTED_TIMES[@]} ]]; then
        P95_INDEX=$((${#SORTED_TIMES[@]} - 1))
    fi
    P95_LATENCY=${SORTED_TIMES[$P95_INDEX]}
    
    # Calculate average
    TOTAL_LATENCY=0
    for time in "${RESPONSE_TIMES[@]}"; do
        TOTAL_LATENCY=$((TOTAL_LATENCY + time))
    done
    AVG_LATENCY=$((TOTAL_LATENCY / ${#RESPONSE_TIMES[@]}))
else
    P95_LATENCY=0
    AVG_LATENCY=0
fi

FINAL_HIT_RATE=0
if [[ $TOTAL_REQUESTS -gt 0 ]]; then
    FINAL_HIT_RATE=$(( (CACHE_HITS * 100) / TOTAL_REQUESTS ))
fi

echo "Total Requests: $TOTAL_REQUESTS"
echo "Success Rate: ${SUCCESS_RATE}%"
echo "5xx Error Rate: ${ERROR_RATE}%"
echo "Cache Hit Rate: ${FINAL_HIT_RATE}%"
echo "Average Latency: ${AVG_LATENCY}ms"
echo "P95 Latency: ${P95_LATENCY}ms"
echo ""

# SLO Evaluation
echo "🎯 SLO Evaluation"
echo "================="

SLO_PASSED=true

# P95 < 200ms
if [[ $P95_LATENCY -lt 200 ]]; then
    echo "✅ P95 Latency: ${P95_LATENCY}ms < 200ms target"
else
    echo "❌ P95 Latency: ${P95_LATENCY}ms ≥ 200ms target"
    SLO_PASSED=false
fi

# 5xx < 0.5%
if [[ $ERROR_RATE -lt 1 ]]; then  # Using integer comparison, so < 1% means < 0.5%
    echo "✅ 5xx Error Rate: ${ERROR_RATE}% < 0.5% target"
else
    echo "❌ 5xx Error Rate: ${ERROR_RATE}% ≥ 0.5% target"
    SLO_PASSED=false
fi

# Hit rate > 60%
if [[ $FINAL_HIT_RATE -gt 60 ]]; then
    echo "✅ Cache Hit Rate: ${FINAL_HIT_RATE}% > 60% target"
else
    echo "⚠️  Cache Hit Rate: ${FINAL_HIT_RATE}% ≤ 60% target"
    echo "   Note: This may be expected during initial rollout"
fi

echo ""

if [[ "$SLO_PASSED" == "true" ]]; then
    echo "🎉 All critical SLOs met - Ready to scale rollout"
    echo ""
    echo "Next steps:"
    echo "1. Set ROLLOUT_PERCENT=50"
    echo "2. Monitor for 30-60 minutes"
    echo "3. If stable, set ROLLOUT_PERCENT=100"
else
    echo "⚠️  Some SLOs not met - Review before scaling"
    echo ""
    echo "Consider:"
    echo "1. Investigate high latency or error rates"
    echo "2. Check system resources"
    echo "3. Review recent deployments"
fi

echo ""
echo "📝 Detailed log saved to: $LOG_FILE"
