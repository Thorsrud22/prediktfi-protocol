// Debug script to check regex matching
const text = 'BTC will be above $80000 by end of year';
const priceRegex = /(BTC|ETH|SOL|bitcoin|ethereum|solana).*(above|below|over|under|\>|\<|≥|≤).*\$(\d+(?:,\d{3})*(?:\.\d+)?)/i;

const match = text.match(priceRegex);
console.log('Full match:', match);
if (match) {
  console.log('Asset:', match[1]);
  console.log('Operator:', match[2]);
  console.log('Price string:', match[3]);
  console.log('Parsed price:', parseFloat(match[3].replace(/[$,]/g, '')));
}
