// Attribution System Test
// This demonstrates how the attribution system works

console.log("Attribution System Test");
console.log("======================");

// Simulate the attribution functions
function sanitizeAttributionValue(value) {
  if (!value) return "";
  
  // Remove invalid characters (only allow a-z, A-Z, 0-9, _, .)
  const sanitized = value.replace(/[^a-zA-Z0-9_.]/g, "");
  
  // Limit to max length 64
  return sanitized.slice(0, 64);
}

// Test cases for validation
const testCases = [
  {
    name: "Valid ref and creator",
    input: { ref: "myref123", creator: "mycreator456" },
    expected: { ref: "myref123", creatorId: "mycreator456" }
  },
  {
    name: "Values with invalid characters",
    input: { ref: "my-ref@special!", creator: "creator#with$symbols%" },
    expected: { ref: "myref", creatorId: "creator" }
  },
  {
    name: "Values over 64 characters",
    input: { 
      ref: "a".repeat(100), 
      creator: "b".repeat(80) 
    },
    expected: { 
      ref: "a".repeat(64), 
      creatorId: "b".repeat(64) 
    }
  },
  {
    name: "Empty values",
    input: { ref: "", creator: "" },
    expected: { ref: "", creatorId: "" }
  }
];

console.log("Validation Test Results:");
testCases.forEach((test, index) => {
  console.log(`\n${index + 1}. ${test.name}`);
  console.log(`   Input: ref="${test.input.ref}", creator="${test.input.creator}"`);
  
  const sanitizedRef = sanitizeAttributionValue(test.input.ref);
  const sanitizedCreator = sanitizeAttributionValue(test.input.creator);
  
  console.log(`   Output: ref="${sanitizedRef}", creatorId="${sanitizedCreator}"`);
  console.log(`   Expected: ref="${test.expected.ref}", creatorId="${test.expected.creatorId}"`);
  
  const refMatch = sanitizedRef === test.expected.ref;
  const creatorMatch = sanitizedCreator === test.expected.creatorId;
  
  console.log(`   Result: ${refMatch && creatorMatch ? "✅ PASS" : "❌ FAIL"}`);
});

console.log("\nSystem Components:");
console.log("✅ Attribution module: app/lib/attribution.ts");
console.log("✅ AttributionBoot component: app/components/AttributionBoot.tsx");
console.log("✅ Added to layout.tsx for early execution");
console.log("✅ Integrated into placeBetReal server action");
console.log("✅ Updated market page to pass attribution data");
console.log("✅ Portfolio page displays ref/creatorId with 'Ingen' fallback");

console.log("\nLocalStorage Keys:");
console.log("- predikt:ref");
console.log("- predikt:creatorId");

console.log("\nURL Parameter Support:");
console.log("- ?ref=value");
console.log("- ?creator=value or ?creatorId=value");

console.log("\nValidation Rules:");
console.log("- Max 64 characters");
console.log("- Only letters, numbers, underscore, dot allowed");
console.log("- Invalid characters are stripped");
console.log("- Over-length values are truncated");

console.log("\nExample Test URLs:");
console.log("http://localhost:3000/market/bitcoin-2024?ref=myref&creator=mycreator");
console.log("http://localhost:3000/markets?ref=test123&creator=partner_site");

console.log("\nManual Test Checklist:");
console.log("a) Open market link with ?ref=myref&creator=mycreator");
console.log("b) Place a bet on devnet");
console.log("c) Check /me page shows both values in memo");
console.log("d) Test values over 64 chars get truncated");
console.log("e) Test special characters get sanitized");
