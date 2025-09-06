import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { PrediktfiProtocol } from '../types/prediktfi_protocol';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Import the IDL
import idl from '../target/idl/prediktfi_protocol.json';

const PROGRAM_ID = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

interface Market {
  id: string;
  description: string;
  endTimestamp: number;
  totalYesAmount: number;
  totalNoAmount: number;
  totalParticipants: number;
  isResolved: boolean;
  outcome?: boolean;
  authority: string;
}

interface UserPrediction {
  amount: number;
  prediction: boolean;
  claimed: boolean;
  winnings: number;
}

export const PredictionMarketInterface: React.FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  const [program, setProgram] = useState<Program<PrediktfiProtocol> | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [userPredictions, setUserPredictions] = useState<Map<string, UserPrediction>>(new Map());
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [newMarketId, setNewMarketId] = useState('');
  const [newMarketDescription, setNewMarketDescription] = useState('');
  const [newMarketEndTime, setNewMarketEndTime] = useState('');
  const [newMarketMinBet, setNewMarketMinBet] = useState('0.1');
  const [betAmount, setBetAmount] = useState('0.1');
  const [selectedMarket, setSelectedMarket] = useState<string>('');

  useEffect(() => {
    if (wallet.publicKey && connection) {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        AnchorProvider.defaultOptions()
      );
      const program = new Program(idl as any, PROGRAM_ID, provider);
      setProgram(program);
    }
  }, [wallet.publicKey, connection]);

  const getProtocolStatePda = () => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("protocol")],
      PROGRAM_ID
    )[0];
  };

  const getMarketPda = (marketId: string) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("market"), Buffer.from(marketId)],
      PROGRAM_ID
    )[0];
  };

  const getUserPredictionPda = (marketPda: PublicKey, userPubkey: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("prediction"), marketPda.toBuffer(), userPubkey.toBuffer()],
      PROGRAM_ID
    )[0];
  };

  const initializeProtocol = async () => {
    if (!program || !wallet.publicKey) return;

    try {
      setLoading(true);
      const protocolStatePda = getProtocolStatePda();

      const tx = await program.methods
        .initialize()
        .accounts({
          protocolState: protocolStatePda,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Protocol initialized:", tx);
    } catch (error) {
      console.error("Error initializing protocol:", error);
    } finally {
      setLoading(false);
    }
  };

  const createMarket = async () => {
    if (!program || !wallet.publicKey || !newMarketId || !newMarketDescription) return;

    try {
      setLoading(true);
      const marketPda = getMarketPda(newMarketId);
      const protocolStatePda = getProtocolStatePda();
      
      const endTimestamp = new BN(Math.floor(new Date(newMarketEndTime).getTime() / 1000));
      const minBetAmount = new BN(parseFloat(newMarketMinBet) * LAMPORTS_PER_SOL);

      const tx = await program.methods
        .createPredictionMarket(
          newMarketId,
          newMarketDescription,
          endTimestamp,
          minBetAmount
        )
        .accounts({
          market: marketPda,
          protocolState: protocolStatePda,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Market created:", tx);
      
      // Reset form
      setNewMarketId('');
      setNewMarketDescription('');
      setNewMarketEndTime('');
      
      // Refresh markets
      await loadMarkets();
    } catch (error) {
      console.error("Error creating market:", error);
    } finally {
      setLoading(false);
    }
  };

  const placePrediction = async (marketId: string, prediction: boolean) => {
    if (!program || !wallet.publicKey || !betAmount) return;

    try {
      setLoading(true);
      const marketPda = getMarketPda(marketId);
      const userPredictionPda = getUserPredictionPda(marketPda, wallet.publicKey);
      
      const amount = new BN(parseFloat(betAmount) * LAMPORTS_PER_SOL);

      const tx = await program.methods
        .placePrediction(amount, prediction)
        .accounts({
          market: marketPda,
          userPrediction: userPredictionPda,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Prediction placed:", tx);
      
      await loadMarkets();
      await loadUserPredictions();
    } catch (error) {
      console.error("Error placing prediction:", error);
    } finally {
      setLoading(false);
    }
  };

  const resolveMarket = async (marketId: string, outcome: boolean) => {
    if (!program || !wallet.publicKey) return;

    try {
      setLoading(true);
      const marketPda = getMarketPda(marketId);

      const tx = await program.methods
        .resolveMarket(outcome)
        .accounts({
          market: marketPda,
          authority: wallet.publicKey,
        })
        .rpc();

      console.log("Market resolved:", tx);
      await loadMarkets();
    } catch (error) {
      console.error("Error resolving market:", error);
    } finally {
      setLoading(false);
    }
  };

  const claimWinnings = async (marketId: string) => {
    if (!program || !wallet.publicKey) return;

    try {
      setLoading(true);
      const marketPda = getMarketPda(marketId);
      const userPredictionPda = getUserPredictionPda(marketPda, wallet.publicKey);

      const tx = await program.methods
        .claimWinnings()
        .accounts({
          market: marketPda,
          userPrediction: userPredictionPda,
          user: wallet.publicKey,
        })
        .rpc();

      console.log("Winnings claimed:", tx);
      await loadUserPredictions();
    } catch (error) {
      console.error("Error claiming winnings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMarkets = async () => {
    if (!program) return;

    try {
      const marketAccounts = await program.account.predictionMarket.all();
      const formattedMarkets: Market[] = marketAccounts.map(account => ({
        id: account.account.id,
        description: account.account.description,
        endTimestamp: account.account.endTimestamp.toNumber(),
        totalYesAmount: account.account.totalYesAmount.toNumber() / LAMPORTS_PER_SOL,
        totalNoAmount: account.account.totalNoAmount.toNumber() / LAMPORTS_PER_SOL,
        totalParticipants: account.account.totalParticipants.toNumber(),
        isResolved: account.account.isResolved,
        outcome: account.account.outcome,
        authority: account.account.authority.toString(),
      }));
      
      setMarkets(formattedMarkets);
    } catch (error) {
      console.error("Error loading markets:", error);
    }
  };

  const loadUserPredictions = async () => {
    if (!program || !wallet.publicKey) return;

    try {
      const predictionAccounts = await program.account.userPrediction.all([
        {
          memcmp: {
            offset: 8 + 32, // Skip discriminator + market pubkey
            bytes: wallet.publicKey.toBase58(),
          }
        }
      ]);

      const predictions = new Map<string, UserPrediction>();
      for (const account of predictionAccounts) {
        const marketPda = account.account.market.toString();
        predictions.set(marketPda, {
          amount: account.account.amount.toNumber() / LAMPORTS_PER_SOL,
          prediction: account.account.prediction,
          claimed: account.account.claimed,
          winnings: account.account.winnings.toNumber() / LAMPORTS_PER_SOL,
        });
      }

      setUserPredictions(predictions);
    } catch (error) {
      console.error("Error loading user predictions:", error);
    }
  };

  useEffect(() => {
    if (program) {
      loadMarkets();
      if (wallet.publicKey) {
        loadUserPredictions();
      }
    }
  }, [program, wallet.publicKey]);

  if (!wallet.connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">PrediktFi Protocol</h1>
        <p className="mb-4">Connect your wallet to start using prediction markets</p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">PrediktFi Protocol</h1>
        <WalletMultiButton />
      </div>

      {/* Protocol Initialization */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Protocol Management</h2>
        <button
          onClick={initializeProtocol}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Initialize Protocol'}
        </button>
      </div>

      {/* Create Market */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Create New Market</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Market ID"
            value={newMarketId}
            onChange={(e) => setNewMarketId(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            placeholder="Description"
            value={newMarketDescription}
            onChange={(e) => setNewMarketDescription(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <input
            type="datetime-local"
            value={newMarketEndTime}
            onChange={(e) => setNewMarketEndTime(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Min Bet (SOL)"
            value={newMarketMinBet}
            onChange={(e) => setNewMarketMinBet(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
        <button
          onClick={createMarket}
          disabled={loading}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Market'}
        </button>
      </div>

      {/* Markets List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Active Markets</h2>
        {markets.length === 0 ? (
          <p className="text-gray-500">No markets found. Create the first one!</p>
        ) : (
          <div className="space-y-4">
            {markets.map((market) => {
              const marketPda = getMarketPda(market.id);
              const userPrediction = userPredictions.get(marketPda.toString());
              const totalPool = market.totalYesAmount + market.totalNoAmount;
              const yesPercentage = totalPool > 0 ? (market.totalYesAmount / totalPool) * 100 : 50;

              return (
                <div key={market.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{market.id}</h3>
                      <p className="text-gray-600">{market.description}</p>
                      <p className="text-sm text-gray-500">
                        Ends: {new Date(market.endTimestamp * 1000).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">Total Pool: {totalPool.toFixed(2)} SOL</p>
                      <p className="text-sm">Participants: {market.totalParticipants}</p>
                    </div>
                  </div>

                  {/* Market odds */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>YES: {yesPercentage.toFixed(1)}%</span>
                      <span>NO: {(100 - yesPercentage).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${yesPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* User's prediction */}
                  {userPrediction && (
                    <div className="bg-gray-100 rounded p-3 mb-4">
                      <p className="text-sm">
                        Your prediction: {userPrediction.prediction ? 'YES' : 'NO'} 
                        ({userPrediction.amount.toFixed(2)} SOL)
                      </p>
                      {market.isResolved && (
                        <p className="text-sm">
                          {market.outcome === userPrediction.prediction
                            ? `Won: ${userPrediction.winnings.toFixed(2)} SOL ${userPrediction.claimed ? '(Claimed)' : '(Available)'}`
                            : 'Lost'
                          }
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {!market.isResolved && !userPrediction && (
                      <>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Bet amount (SOL)"
                          value={betAmount}
                          onChange={(e) => setBetAmount(e.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                        />
                        <button
                          onClick={() => placePrediction(market.id, true)}
                          disabled={loading}
                          className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm disabled:opacity-50"
                        >
                          Bet YES
                        </button>
                        <button
                          onClick={() => placePrediction(market.id, false)}
                          disabled={loading}
                          className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm disabled:opacity-50"
                        >
                          Bet NO
                        </button>
                      </>
                    )}

                    {!market.isResolved && market.authority === wallet.publicKey?.toString() && (
                      <>
                        <button
                          onClick={() => resolveMarket(market.id, true)}
                          disabled={loading}
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm disabled:opacity-50"
                        >
                          Resolve YES
                        </button>
                        <button
                          onClick={() => resolveMarket(market.id, false)}
                          disabled={loading}
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm disabled:opacity-50"
                        >
                          Resolve NO
                        </button>
                      </>
                    )}

                    {market.isResolved && userPrediction && !userPrediction.claimed && 
                     market.outcome === userPrediction.prediction && (
                      <button
                        onClick={() => claimWinnings(market.id)}
                        disabled={loading}
                        className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-sm disabled:opacity-50"
                      >
                        Claim Winnings
                      </button>
                    )}

                    {market.isResolved && (
                      <span className={`px-2 py-1 rounded text-sm ${
                        market.outcome ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        Resolved: {market.outcome ? 'YES' : 'NO'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
