#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${PREDIKT_BASE_URL:-http://localhost:3000}"

pass() { echo "✅ $1"; }
fail() { echo "❌ $1"; exit 1; }

code_for() {
  curl -s -o /dev/null -w "%{http_code}" "$1"
}

echo "Running smoke tests against: $BASE_URL"

# 1) Status page 200
[[ "$(code_for "$BASE_URL/status")" == "200" ]] \
  && pass "/status 200" || fail "/status not 200"

# 2) Health endpoint 200
[[ "$(code_for "$BASE_URL/api/_internal/health")" == "200" ]] \
  && pass "/api/_internal/health 200" || fail "health not 200"

# 3) Analytics GET 204
[[ "$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/api/analytics")" == "204" ]] \
  && pass "GET /api/analytics 204" || fail "GET /api/analytics not 204"

# 4) Analytics POST 204
[[ "$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/analytics" \
    -H 'Content-Type: application/json' \
    -d '{"event":"smoke_test","ts":'$(date +%s)'}')" == "204" ]] \
  && pass "POST /api/analytics 204" || fail "POST /api/analytics not 204"

# 5) Pricing page 200
[[ "$(code_for "$BASE_URL/pricing")" == "200" ]] \
  && pass "/pricing 200" || fail "/pricing not 200"

# 6) Checkout route (MOCK i dev -> redirect 302/307; i prod kan være 200/302/303/307)
CHECKOUT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/billing/checkout")
case "$CHECKOUT_CODE" in
  200|201|202|204|301|302|303|307|308) pass "POST /api/billing/checkout $CHECKOUT_CODE" ;;
  *) fail "POST /api/billing/checkout unexpected $CHECKOUT_CODE" ;;
esac

# 7) Redeem med bogus kode -> forvent 4xx
REDEEM_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/billing/redeem" \
  -H 'Content-Type: application/json' -d '{"code":"BOGUS-CODE"}')
case "$REDEEM_CODE" in
  400|401|403|404|409|410|422|429) pass "POST /api/billing/redeem returns 4xx ($REDEEM_CODE)" ;;
  *) fail "POST /api/billing/redeem expected 4xx got $REDEEM_CODE" ;;
esac

echo "🎉 Smoke tests passed."
