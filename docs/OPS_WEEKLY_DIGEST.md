# OPS – Weekly Digest (view→copy→sign)

**Eier:** PrediktFi – P2A/Analytics
**Formål:** Ukentlig oppsummering av konverteringer per modell (view→copy→sign) til Slack/webhook.

## SLI/SLO

* **Jobb fullfører:** 100% siste 14 dager
* **Webhook 2xx:** ≥ 99% (rullende 7d)
* **Runtime:** P95 < 5s
* **Datavindu:** UTC, forrige uke \[Mon 00:00Z, Mon 00:00Z)

## Miljøvariabler

```bash
ALERTS_WEBHOOK_URL=<https endpoint>
DATABASE_URL="file:./prisma/dev.db" # eller prod-DSN
```

## Cron

Kjør mandager **09:00 Europe/Oslo** (som er 08:00Z vinter / 07:00Z sommer).

```bash
# systemd/cron eksempel (UTC)
0 7 * * 1 cd /app && npx tsx scripts/analytics.weekly-digest.ts
```

## Manuelle kommandoer

```bash
# Tørrkjør siste 24t (test)
npx tsx scripts/analytics.weekly-digest.ts --test-24h

# Tving vindu (ISO, UTC)
npx tsx scripts/analytics.weekly-digest.ts --from="2025-09-06T00:00:00Z" --to="2025-09-07T00:00:00Z"

# Helse-sjekk (200 forventet)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/analytics/health
```

## Datadefinisjoner (UTC + hashed IDs)

* **Events:** lagres i `analytics_events`

  * `type ∈ { model_metrics_view, league_view, model_copy_clicked, intent_created_from_copy, intent_executed_from_copy }`
  * `modelIdHash` (alltid hash – aldri raw ID)
  * `createdAt` settes av DB (ISO/UTC)
* **Intent attribution:** `Intent.sourceModelIdHashed` (samme hash som events)

## Vanlige feil → raske fix

### 1) Digest = 0 data

* **Årsak:** tidsvindu feil (lokal tid), eller mismatch hash/raw ID.
* **Sjekk:**

  ```sql
  -- rader siste 7d (SQLite)
  SELECT type, COUNT(*) 
  FROM analytics_events 
  WHERE createdAt >= DATETIME('now','-7 days') 
  GROUP BY type;
  ```
* **Fix:** bruk `modelIdHash` ✕ `sourceModelIdHashed` i joinen, og sikre UTC-vindu i koden.

### 2) "No such table" / schema-mismatch

* **Sjekk peker:**

  ```bash
  echo $DATABASE_URL
  sqlite3 prisma/dev.db ".tables"
  ```
* **Fix:** oppdater `.env.local` → `file:./prisma/dev.db`, `npx prisma generate`, restart.

### 3) Webhook feiler

* **Sjekk responskode** i jobblogg.
* **Rollback:** disable webhook-sending (flag) og skriv rapport til log/fil; kjør på nytt senere.

### 4) Duplikat-events (idempotens)

* **Årsak:** unique-key kollisjon
* **Policy:** fang `P2002` → returner 204 (ikke 500). Ikke retriable.

## Alarmer

* **Jobb feilet 2x på rad** → send varsel til `ALERTS_WEBHOOK_URL` med `err`, tidsvindu, antall rows funnet.
* **Digest = 0 data** (to uker på rad) → gul varsel (kan være lav trafikk, men krever øyekast).
* **Webhook non-2xx** > 3 forsøk → rød varsel.

## Retensjon

* Behold `analytics_events` i **90 dager**.
* Ukentlig purge:

```sql
DELETE FROM analytics_events 
WHERE createdAt < DATETIME('now','-90 days');
```

## Rollback

* **Skru av digest cron**
* **Sett `ANALYTICS=off`** (vurder bare hvis API kaster 5xx)
* Hold data urørt. Reverter siste release *kun* hvis API feiler ved alle kall.

## Verifisering etter deploy

1. `--test-24h` kjører og poster Slack-melding.
2. Meldingen viser **views ≥ copies ≥ created ≥ executed**.
3. Tallene matcher spot-sjekk i DB.
4. Cron trigger neste mandag og rapport kommer.

---

## Status

✅ **D (Analytics) implementert og committed**
- View→copy→sign funnel tracking
- UTC timestamps + hashed model IDs  
- Weekly digest med webhook
- Test mode (`--test-24h`) for debugging
- Proper 204 No Content responses

🎯 **Neste:** Canary rollout `MODELS=on,ANALYTICS=on` → 10% → 50% → 100%
