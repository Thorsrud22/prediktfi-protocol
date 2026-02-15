import { Connection, PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import { BirdeyeMarketService } from "@/lib/market/birdeye";
import { GroundingEnvelope, wrapGrounding } from "@/lib/market/types";

export interface TokenSecurityCheck {
    valid: boolean;           // true only if successfully verified on-chain
    mintAuthority: boolean;   // true = DANGER (can mint more)
    freezeAuthority: boolean; // true = DANGER (can freeze)
    supply: number;
    decimals: number;
    isPumpFun: boolean;
    // Birdeye Enhanced Security fields
    isLiquidityLocked?: boolean;
    top10HolderPercentage?: number;
    creatorPercentage?: number;
    ownerPercentage?: number;
    totalLiquidity?: number;
    error?: string;
}

// 1. Setup connection (use mainnet public RPC or env)
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.mainnet-beta.solana.com";

/**
 * Validate Solana address format (base58, 32-44 chars)
 */
export function isValidSolanaAddress(address: string): boolean {
    if (!address || address.length < 32 || address.length > 44) return false;
    // Base58 character set (no 0, O, I, l)
    return /^[1-9A-HJ-NP-Za-km-z]+$/.test(address);
}

export async function verifyTokenSecurityEnvelope(tokenAddress: string): Promise<GroundingEnvelope<TokenSecurityCheck>> {
    const fetchedAt = new Date();
    // Early validation - reject obviously invalid addresses
    if (!isValidSolanaAddress(tokenAddress)) {
        console.warn("[TokenCheck] Invalid address format:", tokenAddress);
        const invalid: TokenSecurityCheck = {
            valid: false,
            mintAuthority: false,
            freezeAuthority: false,
            supply: 0,
            decimals: 0,
            isPumpFun: false,
            error: "Invalid Solana address format"
        };
        return wrapGrounding(invalid, "onchain_rpc", fetchedAt, 1);
    }

    try {
        const connection = new Connection(RPC_ENDPOINT, "confirmed");
        const mintPubkey = new PublicKey(tokenAddress);

        // 2. Fetch Mint Info with Timeout
        const mintInfo = await Promise.race([
            getMint(connection, mintPubkey),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Token check timed out")), 5000)
            )
        ]);

        // 3. Check Authorities
        const hasMintAuth = mintInfo.mintAuthority !== null;
        const hasFreezeAuth = mintInfo.freezeAuthority !== null;

        // 4. Heuristics for Pump.fun or known factories (optional)
        // Pump.fun tokens usually end in 'pump'
        const isPumpFun = tokenAddress.endsWith("pump");

        const result: TokenSecurityCheck = {
            valid: true,
            mintAuthority: hasMintAuth,
            freezeAuthority: hasFreezeAuth,
            supply: Number(mintInfo.supply),
            decimals: mintInfo.decimals,
            isPumpFun
        };

        // 5. Try to augment with Birdeye data
        try {
            const birdeye = new BirdeyeMarketService();
            const securityData = await birdeye.getTokenSecurity(tokenAddress);
            if (securityData) {
                result.isLiquidityLocked = securityData.isLiquidityLocked;
                result.top10HolderPercentage = securityData.top10HolderPercentage;
                result.creatorPercentage = securityData.creatorPercentage;
                result.ownerPercentage = securityData.ownerPercentage;
                result.totalLiquidity = securityData.totalLiquidity;
            }
        } catch (err) {
            console.warn("[TokenCheck] Birdeye augmentation skipped (non-blocking)", err);
        }

        return wrapGrounding(result, "onchain_rpc", fetchedAt, 1);

    } catch (error) {
        console.error("Token verification failed:", error);
        const failed: TokenSecurityCheck = {
            valid: false,
            mintAuthority: false,
            freezeAuthority: false,
            supply: 0,
            decimals: 0,
            isPumpFun: false,
            error: "Token not found or network error"
        };
        return wrapGrounding(failed, "onchain_rpc", fetchedAt, 1);
    }
}

export async function verifyTokenSecurity(tokenAddress: string): Promise<TokenSecurityCheck> {
    const envelope = await verifyTokenSecurityEnvelope(tokenAddress);
    return envelope.data;
}
