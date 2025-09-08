// Development mock for heavy wallet adapter dependencies
// This reduces bundle size and compilation time in development

export const PhantomWalletAdapter = class {
  name = 'Phantom';
  url = 'https://phantom.app';
  icon = '';
  readyState = 'NotDetected';
  publicKey = null;
  connecting = false;
  connected = false;
  
  connect = () => Promise.reject(new Error('Development mode: Wallet disabled'));
  disconnect = () => Promise.resolve();
  sendTransaction = () => Promise.reject(new Error('Development mode: Wallet disabled'));
  signTransaction = () => Promise.reject(new Error('Development mode: Wallet disabled'));
  signAllTransactions = () => Promise.reject(new Error('Development mode: Wallet disabled'));
  signMessage = () => Promise.reject(new Error('Development mode: Wallet disabled'));
  
  on = () => {};
  off = () => {};
  removeListener = () => {};
  emit = () => {};
};

export const SolflareWalletAdapter = class {
  name = 'Solflare';
  url = 'https://solflare.com';
  icon = '';
  readyState = 'NotDetected';
  publicKey = null;
  connecting = false;
  connected = false;
  
  connect = () => Promise.reject(new Error('Development mode: Wallet disabled'));
  disconnect = () => Promise.resolve();
  sendTransaction = () => Promise.reject(new Error('Development mode: Wallet disabled'));
  signTransaction = () => Promise.reject(new Error('Development mode: Wallet disabled'));
  signAllTransactions = () => Promise.reject(new Error('Development mode: Wallet disabled'));
  signMessage = () => Promise.reject(new Error('Development mode: Wallet disabled'));
  
  on = () => {};
  off = () => {};
  removeListener = () => {};
  emit = () => {};
};

// Mock for react-native and other heavy dependencies
export default {};