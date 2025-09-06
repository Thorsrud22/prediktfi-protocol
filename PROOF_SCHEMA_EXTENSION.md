# PROOF Schema Extension - E9.0 → Proof Datamodell

## Oversikt

Denne migrasjonen utvider eksisterende E9.0 datamodell til å støtte Proof-konseptet med strukturerte prediksjoner, resolving og outcome tracking.

## ✅ Endringer Implementert

### 1. **Insight Table - Utvidede Felt**

Nye additive felter lagt til eksisterende `Insight` table:

```prisma
// Proof extension - structured prediction fields
canonical      String?         // normalized claim/statement
p              Decimal?        // probability as precise decimal 0..1
deadline       DateTime?       // UTC deadline for resolution
resolverKind   ResolverKind?   // how to resolve this prediction
resolverRef    String?         // reference for resolution (URL, price target, etc)
status         InsightStatus   @default(OPEN)
memoSig        String?         // Solana transaction signature from memo
slot           Int?            // Solana slot number
```

### 2. **Creator Table - Kalibrering**

Nye felter for calibration metrics:

```prisma
// Proof extension - calibration metrics
brierMean      Decimal?        // rolling average Brier score
binsJson       String?         // JSON: calibration bins for reliability curve
```

### 3. **Nye Tabeller**

#### **Outcome Table**
```prisma
model Outcome {
  id          String        @id @default(cuid())
  insightId   String
  result      OutcomeResult // YES, NO, INVALID
  evidenceUrl String?       // URL to evidence/proof of outcome
  decidedBy   DecisionMaker // AGENT, USER
  decidedAt   DateTime      @default(now())
  
  // Relations
  insight     Insight       @relation(fields: [insightId], references: [id], onDelete: Cascade)
}
```

#### **Event Table**
```prisma
model Event {
  id        String   @id @default(cuid())
  userId    String?  // Creator ID or null for system events
  type      String   // event type: 'prediction_created', 'outcome_resolved', etc
  meta      String   // JSON metadata
  createdAt DateTime @default(now())
  
  // Relations
  user      Creator? @relation(fields: [userId], references: [id])
  insight   Insight? @relation(fields: [insightId], references: [id])
}
```

### 4. **Nye Enums**

```prisma
enum ResolverKind {
  PRICE  // resolve based on price data
  URL    // resolve based on URL content/API
  TEXT   // resolve based on text/manual verification
}

enum InsightStatus {
  OPEN      // prediction is open, not yet committed
  COMMITTED // prediction is committed, waiting for resolution
  RESOLVED  // prediction has been resolved with outcome
}

enum OutcomeResult {
  YES     // prediction was correct/true
  NO      // prediction was incorrect/false
  INVALID // prediction was invalid/unclear/cancelled
}

enum DecisionMaker {
  AGENT // resolved by automated agent/system
  USER  // resolved by human user/moderator
}
```

### 5. **Nye Indekser**

```prisma
@@index([status])     // på Insight table
@@index([createdAt])  // på Event table
@@index([type])       // på Event table
@@index([userId])     // på Event table
```

## ✅ Backward Compatibility

- **Alle eksisterende felter** er uendret
- **Alle nye felter** er optional (`String?`, `Decimal?`) eller har defaults
- **Eksisterende API-er** fungerer uten endringer
- **Feed og Studio** fungerer som før

## ✅ Verifikasjon

Testet at følgende fortsatt fungerer:

1. **Feed API**: `GET /api/feed` - ✅ Returnerer insights med alle felter
2. **Insight API**: `GET /api/insight?id=xxx` - ✅ Henter eksisterende insights
3. **Create Insight**: `POST /api/insight` - ✅ Lager nye insights
4. **Studio UI**: `/studio` - ✅ Laster uten feil
5. **Insight Pages**: `/i/[id]` - ✅ Viser eksisterende insights

## 📊 Database Status

- **Prisma Schema**: Oppdatert med alle nye felter og tabeller
- **Client Generation**: ✅ Ny Prisma client generert
- **Migration**: ✅ Schema push utført
- **Existing Data**: Bevart og tilgjengelig

## 🔄 Neste Steg

Datamodellen er nå klar for:

1. **Proof Creation**: Strukturerte prediksjoner med deadline og resolver
2. **Resolution System**: Automatisk og manuell resolving av outcomes
3. **Calibration Tracking**: Brier score og reliability curves
4. **Event Logging**: Full audit trail av aktivitet
5. **Advanced Filtering**: Status-basert filtering (open/committed/resolved)

## 🎯 Definition of Done - ✅ OPPNÅDD

- [x] Migrasjon kjører grønt
- [x] Eksisterende feed/studio virker uendret
- [x] Feltene er additive (ingen breaking changes)
- [x] Alle indekser opprettet for performance
- [x] Nye tabeller og enums definert
- [x] Backward compatibility verifisert

**Status: KOMPLETT** 🎉

Proof datamodell-utvidelsen er implementert og klar for bruk!
