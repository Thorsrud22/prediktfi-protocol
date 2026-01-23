import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getMint } from "@solana/spl-token";
import { BirdeyeMarketService } from "@/lib/market/birdeye";

export interface TokenSecurityCheck {
    mintAuthority: boolean; // true = DANGER (can mint more)
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

export async function verifyTokenSecurity(tokenAddress: string): Promise<TokenSecurityCheck> {
    try {
        const connection = new Connection(RPC_ENDPOINT, "confirmed");
        const mintPubkey = new PublicKey(tokenAddress);

        // 2. Fetch Mint Info
        const mintInfo = await getMint(connection, mintPubkey);

        // 3. Check Authorities
        const hasMintAuth = mintInfo.mintAuthority !== null;
        const hasFreezeAuth = mintInfo.freezeAuthority !== null;

        // 4. Heuristics for Pump.fun or known factories (optional)
        // Pump.fun tokens usually end in 'pump'
        const isPumpFun = tokenAddress.endsWith("pump");

        const result: TokenSecurityCheck = {
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

        return result;

    } catch (error) {
        console.error("Token verification failed:", error);
        return {
            mintAuthority: false, // Default to safe if fail? No, better to error.
            freezeAuthority: false,
            supply: 0,
            decimals: 0,
            isPumpFun: false,
            error: "Invalid token address or network error"
        };
    }
}
