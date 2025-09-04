// Quick test to verify attribution is working in the browser
// Open browser console after visiting pages with query parameters

console.log("Attribution Browser Test");
console.log("=======================");

// Function to test current attribution state
function testAttribution() {
  if (typeof window === 'undefined') {
    console.log("❌ Not in browser environment");
    return;
  }
  
  const refValue = localStorage.getItem("predikt:ref");
  const creatorValue = localStorage.getItem("predikt:creatorId");
  
  console.log("Current Attribution State:");
  console.log(`- predikt:ref: "${refValue || 'not set'}"`);
  console.log(`- predikt:creatorId: "${creatorValue || 'not set'}"`);
  
  const urlParams = new URLSearchParams(window.location.search);
  const urlRef = urlParams.get("ref");
  const urlCreator = urlParams.get("creator") || urlParams.get("creatorId");
  
  console.log("\nURL Parameters:");
  console.log(`- ref: "${urlRef || 'not present'}"`);
  console.log(`- creator/creatorId: "${urlCreator || 'not present'}"`);
  
  if (urlRef || urlCreator) {
    console.log("\n✅ Attribution data detected in URL");
    console.log("AttributionBoot should have saved this to localStorage");
  } else {
    console.log("\n💡 No attribution parameters in current URL");
    console.log("Try visiting: ?ref=testref&creator=testcreator");
  }
}

// Test when script loads
testAttribution();

// Make function available globally for manual testing
if (typeof window !== 'undefined') {
  window.testAttribution = testAttribution;
  console.log("\n💡 Run `testAttribution()` in console to check attribution state");
  
  // Also add a function to clear attribution for testing
  window.clearAttribution = function() {
    localStorage.removeItem("predikt:ref");
    localStorage.removeItem("predikt:creatorId");
    console.log("✅ Attribution cleared");
  };
  console.log("💡 Run `clearAttribution()` to reset for testing");
}
