// Quick localStorage persistence test
// Run this in browser console to verify intent storage

console.log('🧪 Testing localStorage persistence for trading intents...');

// Test 1: Check if localStorage is available
if (typeof localStorage === 'undefined') {
  console.error('❌ localStorage not available');
} else {
  console.log('✅ localStorage available');
}

// Test 2: Create a sample intent
const sampleIntent = {
  id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  assetSymbol: 'BTC',
  direction: 'Long',
  confidence: 75,
  probability: 68,
  horizonDays: 30,
  thesis: 'Test intent for localStorage persistence verification',
  createdAt: Date.now()
};

console.log('📝 Sample intent created:', sampleIntent);

// Test 3: Store in localStorage
try {
  const existing = localStorage.getItem('predikt:user-intents');
  const intents = existing ? JSON.parse(existing) : [];
  intents.unshift(sampleIntent);
  localStorage.setItem('predikt:user-intents', JSON.stringify(intents));
  console.log('✅ Intent stored in localStorage');
} catch (error) {
  console.error('❌ Failed to store intent:', error);
}

// Test 4: Retrieve from localStorage
try {
  const stored = localStorage.getItem('predikt:user-intents');
  const intents = stored ? JSON.parse(stored) : [];
  console.log('📋 Retrieved intents from localStorage:', intents.length, 'items');
  
  if (intents.length > 0) {
    console.log('✅ Latest intent:', {
      id: intents[0].id,
      asset: intents[0].assetSymbol,
      direction: intents[0].direction,
      createdAt: new Date(intents[0].createdAt).toLocaleString()
    });
  }
} catch (error) {
  console.error('❌ Failed to retrieve intents:', error);
}

// Test 5: Verify draft storage
console.log('\n🧪 Testing draft storage...');

try {
  const draftData = sessionStorage.getItem('predikt.intentDraft');
  if (draftData) {
    const parsed = JSON.parse(draftData);
    console.log('✅ Draft found in sessionStorage:', {
      state: parsed.state,
      version: parsed.version
    });
    
    if (parsed.state && parsed.state.draft) {
      console.log('📝 Draft content:', {
        id: parsed.state.draft.id,
        asset: parsed.state.draft.assetSymbol,
        direction: parsed.state.draft.direction
      });
    }
  } else {
    console.log('ℹ️  No draft in sessionStorage (expected if no active draft)');
  }
} catch (error) {
  console.error('❌ Error checking draft storage:', error);
}

console.log('\n🎯 Persistence Test Complete');
console.log('Expected: Intent stored and retrievable from localStorage');
console.log('Expected: Draft stored in sessionStorage (if active)');
console.log('Expected: Data survives page refresh');

// Cleanup function
window.clearTestIntent = function() {
  try {
    const stored = localStorage.getItem('predikt:user-intents');
    const intents = stored ? JSON.parse(stored) : [];
    const filtered = intents.filter(intent => !intent.id.startsWith('test_'));
    localStorage.setItem('predikt:user-intents', JSON.stringify(filtered));
    console.log('🧹 Test intent cleaned up');
  } catch (error) {
    console.error('❌ Failed to cleanup test intent:', error);
  }
};

console.log('\n💡 Run clearTestIntent() to remove the test intent');
