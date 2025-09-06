#!/usr/bin/env node

/**
 * Generate Polymarket API Key
 * This script helps generate a Polymarket API key using your private key
 */

const crypto = require('crypto');
const { ethers } = require('ethers');
const fs = require('fs');

// Load .env file
function loadEnv() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim().replace(/"/g, '');
    }
  });
  return envVars;
}

// Configuration
const env = loadEnv();
const PRIVATE_KEY = env.POLYMARKET_PRIVATE_KEY;
const CLOB_ENDPOINT = 'https://clob.polymarket.com';

if (!PRIVATE_KEY) {
  console.error('❌ POLYMARKET_PRIVATE_KEY not found in environment variables');
  process.exit(1);
}

async function generatePolymarketAPIKey() {
  try {
    console.log('🔑 Generating Polymarket API Key...');
    
    // Create wallet from private key
    const wallet = new ethers.Wallet(PRIVATE_KEY);
    const address = wallet.address;
    
    console.log('📍 Wallet Address:', address);
    
    // EIP-712 Domain
    const domain = {
      name: "ClobAuthDomain",
      version: "1",
      chainId: 137, // Polygon Chain ID
    };
    
    // EIP-712 Types
    const types = {
      ClobAuth: [
        { name: "address", type: "address" },
        { name: "timestamp", type: "string" },
        { name: "nonce", type: "uint256" },
        { name: "message", type: "string" },
      ]
    };
    
    // Current timestamp
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = 0;
    const message = "This message attests that I control the given wallet";
    
    // EIP-712 Value
    const value = {
      address: address,
      timestamp: timestamp,
      nonce: nonce,
      message: message,
    };
    
    console.log('📝 Signing EIP-712 message...');
    
    // Sign the typed data
    const signature = await wallet.signTypedData(domain, types, value);
    
    console.log('✅ Signature generated:', signature.substring(0, 20) + '...');
    
    // Prepare headers for API request
    const headers = {
      'Content-Type': 'application/json',
      'POLY_ADDRESS': address,
      'POLY_SIGNATURE': signature,
      'POLY_TIMESTAMP': timestamp,
      'POLY_NONCE': nonce.toString(),
    };
    
    console.log('🚀 Making API request to create API key...');
    
    // Make API request to create API key
    const response = await fetch(`${CLOB_ENDPOINT}/auth/api-key`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({})
    });
    
    if (response.ok) {
      const apiKeyData = await response.json();
      console.log('🎉 API Key created successfully!');
      console.log('📋 API Key Data:', JSON.stringify(apiKeyData, null, 2));
      
      // Update .env file
      console.log('📝 Updating .env file...');
      const fs = require('fs');
      const envContent = fs.readFileSync('.env', 'utf8');
      const updatedEnv = envContent
        .replace(/POLYMARKET_API_KEY=.*/, `POLYMARKET_API_KEY=${apiKeyData.key}`)
        .replace(/POLYMARKET_USE_MOCK=true/, 'POLYMARKET_USE_MOCK=false');
      
      fs.writeFileSync('.env', updatedEnv);
      console.log('✅ .env file updated with API key');
      
    } else {
      const error = await response.text();
      console.error('❌ Failed to create API key:', response.status, error);
    }
    
  } catch (error) {
    console.error('❌ Error generating API key:', error.message);
  }
}

// Run the script
generatePolymarketAPIKey();
