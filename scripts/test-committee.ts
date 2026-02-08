import { evaluateWithCommittee } from "../src/lib/ai/committee";
import { IdeaSubmission } from "../src/lib/ideaSchema";
import * as dotenv from "dotenv";

dotenv.config();

async function run() {
    console.log("🚀 Starting Investment Committee Test...");

    const mockIdea: IdeaSubmission = {
        projectType: "memecoin",
        description: "A memecoin called 'Sad Hamster' ($HAM) that pays homage to the sad hamster meme. It has no utility, just pure vibes and a community of sad people.",
        teamSize: "solo",
        resources: ["budget"],
        launchLiquidityPlan: "I will burn 100% of LP and renounce ownership.",
        mvpScope: "Just a token and a website.",
        successDefinition: "1B Market Cap",
        goToMarketPlan: "TikTok viral marketing",
        responseStyle: "roast",
        focusHints: []
    };

    console.log("📝 Analyzing Idea:", mockIdea.description);

    try {
        const result = await evaluateWithCommittee(mockIdea, {
            onProgress: (step) => console.log(`[PROGRESS] ${step}`)
        });

        console.log("\n✅ COMMITTEE VERDICT REACHED!");
        console.log("------------------------------------------------");
        console.log(`🏆 Overall Score: ${result.overallScore}/100`);
        console.log(`📜 Summary: ${result.summary.oneLiner}`);
        console.log(`⚖️  Main Verdict: ${result.summary.mainVerdict}`);
        console.log("------------------------------------------------");
        console.log("Technical Comments (Check for Committee Log):");
        console.log(result.technical.comments);
        console.log("------------------------------------------------");

    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
}

run();
