import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PrediktfiProtocol } from "../target/types/prediktfi_protocol";
import { expect } from "chai";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

describe("prediktfi-protocol", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.PrediktfiProtocol as Program<PrediktfiProtocol>;
  
  // Test accounts
  const authority = provider.wallet.publicKey;
  const user1 = anchor.web3.Keypair.generate();
  const user2 = anchor.web3.Keypair.generate();
  
  // PDAs
  let protocolStatePda: PublicKey;
  let marketPda: PublicKey;
  let user1PredictionPda: PublicKey;
  let user2PredictionPda: PublicKey;
  
  const marketId = "test-market-1";
  const marketDescription = "Will Bitcoin reach $100,000 by end of 2024?";
  const endTimestamp = new anchor.BN(Date.now() / 1000 + 86400); // 24 hours from now
  const minBetAmount = new anchor.BN(LAMPORTS_PER_SOL * 0.1); // 0.1 SOL

  before(async () => {
    // Fund test accounts
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user1.publicKey, 2 * LAMPORTS_PER_SOL),
      "confirmed"
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user2.publicKey, 2 * LAMPORTS_PER_SOL),
      "confirmed"
    );

    // Find PDAs
    [protocolStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("protocol")],
      program.programId
    );

    [marketPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("market"), Buffer.from(marketId)],
      program.programId
    );

    [user1PredictionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("prediction"), marketPda.toBuffer(), user1.publicKey.toBuffer()],
      program.programId
    );

    [user2PredictionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("prediction"), marketPda.toBuffer(), user2.publicKey.toBuffer()],
      program.programId
    );
  });

  describe("Protocol Initialization", () => {
    it("Should initialize the protocol", async () => {
      const tx = await program.methods
        .initialize()
        .accounts({
          protocolState: protocolStatePda,
          authority: authority,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Protocol initialization transaction signature:", tx);

      // Verify protocol state
      const protocolState = await program.account.protocolState.fetch(protocolStatePda);
      expect(protocolState.authority.toString()).to.equal(authority.toString());
      expect(protocolState.totalMarkets.toString()).to.equal("0");
      expect(protocolState.isPaused).to.be.false;
    });
  });

  describe("Market Creation", () => {
    it("Should create a prediction market", async () => {
      const tx = await program.methods
        .createPredictionMarket(
          marketId,
          marketDescription,
          endTimestamp,
          minBetAmount
        )
        .accounts({
          market: marketPda,
          protocolState: protocolStatePda,
          authority: authority,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Market creation transaction signature:", tx);

      // Verify market state
      const market = await program.account.predictionMarket.fetch(marketPda);
      expect(market.id).to.equal(marketId);
      expect(market.description).to.equal(marketDescription);
      expect(market.endTimestamp.toString()).to.equal(endTimestamp.toString());
      expect(market.minBetAmount.toString()).to.equal(minBetAmount.toString());
      expect(market.isResolved).to.be.false;
      expect(market.totalYesAmount.toString()).to.equal("0");
      expect(market.totalNoAmount.toString()).to.equal("0");
      expect(market.totalParticipants.toString()).to.equal("0");
      expect(market.authority.toString()).to.equal(authority.toString());

      // Verify protocol state updated
      const protocolState = await program.account.protocolState.fetch(protocolStatePda);
      expect(protocolState.totalMarkets.toString()).to.equal("1");
    });

    it("Should fail to create market with invalid parameters", async () => {
      const invalidMarketId = "a".repeat(51); // Too long
      
      try {
        await program.methods
          .createPredictionMarket(
            invalidMarketId,
            marketDescription,
            endTimestamp,
            minBetAmount
          )
          .accounts({
            market: PublicKey.findProgramAddressSync(
              [Buffer.from("market"), Buffer.from(invalidMarketId)],
              program.programId
            )[0],
            protocolState: protocolStatePda,
            authority: authority,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        
        expect.fail("Should have failed with MarketIdTooLong error");
      } catch (error) {
        expect(error.toString()).to.include("MarketIdTooLong");
      }
    });
  });

  describe("Predictions", () => {
    it("Should allow user to place a YES prediction", async () => {
      const betAmount = new anchor.BN(LAMPORTS_PER_SOL * 0.5); // 0.5 SOL
      
      const tx = await program.methods
        .placePrediction(betAmount, true) // YES prediction
        .accounts({
          market: marketPda,
          userPrediction: user1PredictionPda,
          user: user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      console.log("User1 prediction transaction signature:", tx);

      // Verify prediction state
      const prediction = await program.account.userPrediction.fetch(user1PredictionPda);
      expect(prediction.market.toString()).to.equal(marketPda.toString());
      expect(prediction.user.toString()).to.equal(user1.publicKey.toString());
      expect(prediction.amount.toString()).to.equal(betAmount.toString());
      expect(prediction.prediction).to.be.true;
      expect(prediction.claimed).to.be.false;

      // Verify market updated
      const market = await program.account.predictionMarket.fetch(marketPda);
      expect(market.totalYesAmount.toString()).to.equal(betAmount.toString());
      expect(market.totalNoAmount.toString()).to.equal("0");
      expect(market.totalParticipants.toString()).to.equal("1");
    });

    it("Should allow another user to place a NO prediction", async () => {
      const betAmount = new anchor.BN(LAMPORTS_PER_SOL * 0.3); // 0.3 SOL
      
      const tx = await program.methods
        .placePrediction(betAmount, false) // NO prediction
        .accounts({
          market: marketPda,
          userPrediction: user2PredictionPda,
          user: user2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user2])
        .rpc();

      console.log("User2 prediction transaction signature:", tx);

      // Verify prediction state
      const prediction = await program.account.userPrediction.fetch(user2PredictionPda);
      expect(prediction.amount.toString()).to.equal(betAmount.toString());
      expect(prediction.prediction).to.be.false;

      // Verify market updated
      const market = await program.account.predictionMarket.fetch(marketPda);
      expect(market.totalYesAmount.toString()).to.equal((LAMPORTS_PER_SOL * 0.5).toString());
      expect(market.totalNoAmount.toString()).to.equal(betAmount.toString());
      expect(market.totalParticipants.toString()).to.equal("2");
    });

    it("Should fail when user tries to predict twice", async () => {
      const betAmount = new anchor.BN(LAMPORTS_PER_SOL * 0.1);
      
      try {
        await program.methods
          .placePrediction(betAmount, true)
          .accounts({
            market: marketPda,
            userPrediction: user1PredictionPda,
            user: user1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([user1])
          .rpc();
        
        expect.fail("Should have failed with UserAlreadyPredicted error");
      } catch (error) {
        // This will fail because the account already exists
        expect(error.toString()).to.include("already in use");
      }
    });

    it("Should fail with bet amount too low", async () => {
      const lowBetAmount = new anchor.BN(LAMPORTS_PER_SOL * 0.05); // Lower than min bet
      const user3 = anchor.web3.Keypair.generate();
      
      // Fund user3
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(user3.publicKey, 2 * LAMPORTS_PER_SOL),
        "confirmed"
      );

      const [user3PredictionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("prediction"), marketPda.toBuffer(), user3.publicKey.toBuffer()],
        program.programId
      );
      
      try {
        await program.methods
          .placePrediction(lowBetAmount, true)
          .accounts({
            market: marketPda,
            userPrediction: user3PredictionPda,
            user: user3.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([user3])
          .rpc();
        
        expect.fail("Should have failed with BetAmountTooLow error");
      } catch (error) {
        expect(error.toString()).to.include("BetAmountTooLow");
      }
    });
  });

  describe("Market Resolution", () => {
    it("Should resolve market with YES outcome", async () => {
      // Fast forward time to make market resolvable
      // Note: In real tests, you'd need to mock the clock or wait for actual time
      
      const tx = await program.methods
        .resolveMarket(true) // YES outcome
        .accounts({
          market: marketPda,
          authority: authority,
        })
        .rpc();

      console.log("Market resolution transaction signature:", tx);

      // Verify market resolved
      const market = await program.account.predictionMarket.fetch(marketPda);
      expect(market.isResolved).to.be.true;
      expect(market.outcome).to.be.true;
    });

    it("Should allow winner to claim winnings", async () => {
      const userBalanceBefore = await provider.connection.getBalance(user1.publicKey);
      
      const tx = await program.methods
        .claimWinnings()
        .accounts({
          market: marketPda,
          userPrediction: user1PredictionPda,
          user: user1.publicKey,
        })
        .signers([user1])
        .rpc();

      console.log("Claim winnings transaction signature:", tx);

      // Verify prediction updated
      const prediction = await program.account.userPrediction.fetch(user1PredictionPda);
      expect(prediction.claimed).to.be.true;
      expect(prediction.winnings.toNumber()).to.be.greaterThan(prediction.amount.toNumber());

      // Verify user received winnings
      const userBalanceAfter = await provider.connection.getBalance(user1.publicKey);
      expect(userBalanceAfter).to.be.greaterThan(userBalanceBefore);
    });

    it("Should fail when loser tries to claim winnings", async () => {
      try {
        await program.methods
          .claimWinnings()
          .accounts({
            market: marketPda,
            userPrediction: user2PredictionPda,
            user: user2.publicKey,
          })
          .signers([user2])
          .rpc();
        
        expect.fail("Should have failed with UserLost error");
      } catch (error) {
        expect(error.toString()).to.include("UserLost");
      }
    });
  });

  describe("Error Handling", () => {
    it("Should fail to resolve already resolved market", async () => {
      try {
        await program.methods
          .resolveMarket(false)
          .accounts({
            market: marketPda,
            authority: authority,
          })
          .rpc();
        
        expect.fail("Should have failed with MarketAlreadyResolved error");
      } catch (error) {
        expect(error.toString()).to.include("MarketAlreadyResolved");
      }
    });
  });
});