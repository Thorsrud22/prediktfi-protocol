# Normalisering + Hash-Kontrakt - BLOKK 2 Implementering

## Oversikt

Implementert entydig canonical form og stabil hash som er lik for klient/server, med deterministiske golden tests.

## ✅ Implementerte Komponenter

### 1. **lib/normalize.ts - Canonical Form**

#### **Format**: `"SUBJ verb comparator value unit on YYYY-MM-DD"`

**Eksempler:**
- `"BTC close >= 80000 USD on 2026-01-01"`
- `"ETH close <= 5000 USD on 2025-06-30"`
- `"recession in 2025" resolves true on 2025-12-31`

#### **Defaults:**
- **p = 0.60** (default probability)
- **deadline = +30 dager** hvis ikke oppgitt
- **resolverKind = 'price'** (standard resolver)

#### **Resolver Presets:**
```typescript
price: { asset:"BTC", source:"coingecko", field:"close" }
url:   { href:"https://..." }
text:  { expect:"string to find" }
```

### 2. **lib/memo.ts - Hash + Memo Payload**

#### **Hash Formula:**
```typescript
sha256(`${canonical}|${deadlineISO}|${resolverRef}`)
```

#### **Memo Payload (≤180 bytes):**
```typescript
{
  t: 'predikt.v1',    // Type identifier
  pid: '<id>',        // Prediction ID
  h: '<hash>',        // Hash (first 16 chars)
  d: '<deadlineISO>', // Deadline (YYYY-MM-DD format)
  w: '<wallet>'       // Wallet (first 8 chars)
}
```

## 🧪 **Golden Tests - Deterministisk Verifikasjon**

### **Normalisering Golden Tests (18 tester ✅)**

```typescript
// Bitcoin predictions
"Will Bitcoin reach $100k by end of year?" 
→ "BTC close >= 100000 USD on 2025-12-31"

"Bitcoin will hit $80,000"
→ "BTC close >= 80000 USD on 2025-06-30"

"BTC below $50k"
→ "BTC close <= 50000 USD on 2025-03-15"

// Ethereum predictions  
"Will Ethereum hit $5000 by Q2 2025?"
→ "ETH close >= 5000 USD on 2025-06-30"

// Solana predictions
"Solana will be hitting 400USD this year"
→ "SOL close >= 400 USD on 2025-12-31"

// Text predictions
"Will there be a recession in 2025?"
→ '"will there be a recession in 2025" resolves true on 2025-12-31'
```

### **Hash Golden Tests (15 tester ✅)**

```typescript
// Deterministisk hash for eksakt input
canonical: "BTC close >= 100000 USD on 2025-12-31"
deadline:  "2025-12-31T00:00:00.000Z"  
resolver:  '{"asset":"BTC","source":"coingecko","field":"close"}'
→ Hash: "81ced84fb25f31ef8a1de9d03a910e1a550369fc7342a0851f48f106bb794d65"

// Memo payload (92 bytes)
{
  "t": "predikt.v1",
  "pid": "clx123456789", 
  "h": "81ced84fb25f31ef",
  "d": "2025-12-31",
  "w": "HN7cABqL"
}
```

## 🔬 **API Integration Tests (10 tester ✅)**

### **Workflow Demonstration:**
1. **Input**: `"Will Bitcoin reach $100k by end of year?"`
2. **Normalize**: `normalizePrediction(question, options)`
3. **Result**: `"BTC close >= 100000 USD on 2025-12-31"`
4. **Hash**: `generateSolanaMemo(id, canonical, deadline, resolver, wallet)`
5. **Output**: Memo payload ready for blockchain

### **Edge Cases Tested:**
- ✅ Lange spørsmål (graceful truncation)
- ✅ Spesialtegn ($100,000.00 → 100000)
- ✅ Forskjellige datoformater (konsistent YYYY-MM-DD)
- ✅ Hash-stabilitet (samme input → samme hash)
- ✅ Hash-unikhet (forskjellig input → forskjellig hash)

## 📊 **Canonical Form Patterns**

### **Price Predictions:**
```
Pattern: "ASSET close COMPARATOR VALUE UNIT on DATE"
- BTC close >= 100000 USD on 2025-12-31
- ETH close <= 5000 USD on 2025-06-30  
- SOL close = 400 USD on 2025-12-31
```

### **Text Predictions:**
```
Pattern: "QUESTION" resolves true on DATE
- "recession in 2025" resolves true on 2025-12-31
- "ai sentient by 2030" resolves true on 2030-01-01
```

### **Comparator Mapping:**
- `reach/hit/above/over/exceed` → `>=`
- `below/under` → `<=`
- `exactly/equal` → `=`
- **Default**: `>=` (for price targets)

## 🎯 **Validation & Parsing**

### **Canonical Validation:**
```typescript
validateCanonical("BTC close >= 80000 USD on 2025-12-31") // ✅ true
validateCanonical("invalid format") // ❌ false
```

### **Canonical Parsing:**
```typescript
parseCanonical("BTC close >= 80000 USD on 2025-12-31")
→ {
  subject: "BTC",
  verb: "close", 
  comparator: ">=",
  value: "80000",
  unit: "USD",
  deadline: "2025-12-31"
}
```

## 🔐 **Hash Stabilitet**

### **Konsistens:**
- ✅ Samme input → samme hash (deterministisk)
- ✅ Forskjellig input → forskjellig hash (unikhet)
- ✅ Platform-uavhengig (Node.js crypto module)
- ✅ Normalisert input (trim whitespace, consistent format)

### **Hash Input Format:**
```
`${canonical}|${deadlineISO}|${resolverRef}`

Eksempel:
"BTC close >= 100000 USD on 2025-12-31|2025-12-31T00:00:00.000Z|{\"asset\":\"BTC\",\"source\":\"coingecko\",\"field\":\"close\"}"
```

## 🚀 **Brukseksempel**

```typescript
// 1. Normaliser natural language
const normalized = normalizePrediction(
  "Will Bitcoin reach $100k by end of year?",
  { deadline: new Date('2025-12-31'), p: 0.75 }
);

// 2. Generer memo for blockchain
const memo = generateSolanaMemo(
  'clx123456789',
  normalized.canonical,
  normalized.deadline, 
  normalized.resolverRef,
  'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH'
);

// 3. Bruk i Solana transaksjon
console.log(memo.serialized); // Ready for blockchain
console.log(memo.hash);       // Stable prediction hash
console.log(memo.size);       // Under 180 bytes ✅
```

## ✅ **Definition of Done - OPPNÅDD**

- ✅ **Entydig canonical form** - Deterministisk format implementert
- ✅ **Stabil hash** - SHA256 med konsistent input normalisering  
- ✅ **Klient/server lik** - Platform-uavhengig implementering
- ✅ **Golden tests** - 43 deterministiske tester som passerer
- ✅ **Memo payload ≤180 bytes** - Solana-kompatibel størrelse
- ✅ **Resolver presets** - Price/URL/Text konfigurasjoner
- ✅ **Default values** - p=0.60, deadline=+30 dager

**Status: KOMPLETT** 🎉

Normalisering og hash-kontrakt er implementert og klar for produksjon!
