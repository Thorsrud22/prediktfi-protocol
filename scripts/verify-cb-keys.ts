import 'dotenv/config';

function checkCoinbaseKeys() {
    console.log('🔍 Checking Coinbase API Key configuration...');

    // Common mapping for CDP SDK
    const keyId = process.env.COINBASE_API_KEY_NAME || process.env.CDP_API_KEY_NAME;
    const privateKey = process.env.COINBASE_API_KEY_PRIVATE_KEY || process.env.CDP_API_KEY_PRIVATE_KEY;

    const results = {
        keyId: { present: !!keyId, valid: false },
        privateKey: { present: !!privateKey, valid: false, hasNewlines: false }
    };

    if (keyId) {
        results.keyId.valid = typeof keyId === 'string' && keyId.length > 0;
    }

    if (privateKey) {
        results.privateKey.valid = typeof privateKey === 'string' && privateKey.length > 0;
        results.privateKey.hasNewlines = privateKey.includes('\n') || privateKey.includes('\\n');
    }

    // Report
    console.log(`\nKey ID: ${results.keyId.present ? '✅ Present' : '❌ Missing'}`);

    console.log(`Private Key: ${results.privateKey.present ? '✅ Present' : '❌ Missing'}`);
    if (results.privateKey.present) {
        console.log(`  - Newlines preserved: ${results.privateKey.hasNewlines ? '✅ Yes' : '⚠️ No (might cause auth errors)'}`);
    }

    if (!results.keyId.present || !results.privateKey.present) {
        console.warn('\n⚠️ Coinbase keys missing. Trending feed will work (unauthenticated), but authenticated features will fail.');
    } else {
        console.log('\n✅ Coinbase configuration looks valid.');
    }
}

checkCoinbaseKeys();
