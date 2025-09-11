# JSON.parse Error Debugging Guide

## 🎯 Mål
Finne den eksakte kilden til `JSON.parse: unexpected character at line 1 column 1` feilen ved å instrumentere alle JSON.parse og Response.json() kall.

## 🚀 Slik bruker du debugging-systemet:

### 1. **Start serveren med debug-modus**
```bash
# Stopp eksisterende server
pkill -f "next dev"

# Start med JSON debugging aktivert
NEXT_PUBLIC_DEBUG_JSON=1 npm run dev
```

### 2. **Åpne nettleseren med DevTools**
1. Gå til `http://localhost:3000`
2. Åpne **DevTools → Console**
3. Du skal se:
   ```
   [DEBUG-PROVIDER] Installing JSON guards...
   [JSON-GUARDS] Installing JSON.parse and Response.json() instrumentation...
   [JSON-GUARDS] ✅ Guards installed successfully
   ```

### 3. **Naviger rundt i appen for å trigge feilen**
- Gå til `/studio`
- Gå til `/advisor` 
- Gå til `/feed`
- Refresh sidene flere ganger

### 4. **Se etter feilmeldinger i console**

**JSON.parse feil:**
```
[JSON.parse-guard] THROW: Unexpected token < in JSON at position 0
Input type: string
Input preview: <!DOCTYPE html><html>...
Stack:
    at safeParse (http://localhost:3000/_next/static/chunks/app_lib_safe-fetch_ts.js:1:2345)
    at MarketContext (http://localhost:3000/_next/static/chunks/components_actions_MarketContext.js:5:678)
```

**Response.json() feil:**
```
[Response.json-guard] ❌ json() called on status 304 from http://localhost:3000/api/public/signals
Stack:
    at fetchSignals (http://localhost:3000/_next/static/chunks/components_actions_MarketContext.js:3:456)
```

**Content-Type feil:**
```
[Response.json-guard] ⚠️ Non-JSON Content-Type: text/html
Status: 200
URL: http://localhost:3000/api/analytics/events
Body preview: <!DOCTYPE html><html>...
```

## 🔍 Hva å se etter:

### **Vanlige syndere:**
1. **304 responses** - kaller `response.json()` på Not Modified
2. **204 responses** - kaller `response.json()` på No Content  
3. **HTML error pages** - API returnerer HTML istedenfor JSON
4. **Analytics events** - `/api/analytics/events` som returnerer 204
5. **localStorage corruption** - ugyldig JSON i localStorage

### **Stack trace analysis:**
- **Fil og linje** hvor feilen oppstår er i stack trace
- **Input preview** viser hva som prøves å parses
- **URL** viser hvilket API-kall som feilet

## 🛠️ Hvordan fikse funnene:

### **For fetch-kall som får 304/204:**
```typescript
// ❌ Feil - blind parsing
const data = await response.json();

// ✅ Riktig - sjekk status først
if (response.status === 304 || response.status === 204) return null;
const ct = response.headers.get('content-type') ?? '';
if (!ct.includes('application/json')) {
  const text = await response.text();
  throw new Error(`Expected JSON, got ${ct}`);
}
const data = await response.json();
```

### **For localStorage parsing:**
```typescript
// ❌ Feil - direkte parsing
const data = JSON.parse(localStorage.getItem('key'));

// ✅ Riktig - bruk safeParse
const data = safeParse<MyType>(localStorage.getItem('key'));
```

## 📋 Neste steg:
1. **Kjør debugging** og noter ned hvilke feil som dukker opp
2. **Identifiser filen/linjen** fra stack trace
3. **Patch det spesifikke stedet** med robust parsing
4. **Test igjen** til ingen feil vises
5. **Slå av debugging** ved å fjerne `NEXT_PUBLIC_DEBUG_JSON=1`

## 🎉 Suksess:
Når du ikke ser flere `[JSON.parse-guard]` eller `[Response.json-guard]` feilmeldinger, er alle JSON.parse problemer løst!
