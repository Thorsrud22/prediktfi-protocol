// Rate limiting test
async function testRateLimit() {
  console.log('Testing API rate limiting...');
  
  for(let i = 0; i < 6; i++) {
    try {
      const response = await fetch('http://localhost:3000/api/bets?sig=test123rapid' + i);
      console.log(`Call ${i+1}: ${response.status}`);
      
      if(response.status === 429) {
        console.log('✅ Rate limiting working - got 429 on call', i+1);
        break;
      }
    } catch(e) {
      console.log(`Call ${i+1}: Network error`);
    }
    
    // Small delay to avoid immediate failures
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

testRateLimit();
