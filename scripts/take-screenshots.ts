
import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/thorsrud/.gemini/antigravity/brain/8e4aba03-b724-448c-a7be-629889c576e8';
const BASE_URL = 'http://localhost:3000';

async function capture() {
    console.log('🚀 Starting targeted screenshot capture...');

    const browser = await chromium.launch();
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2,
    });

    const page = await context.newPage();

    // 3. Generate Report
    console.log('🤖 Starting automated analysis...');
    await page.goto(`${BASE_URL}/studio`, { waitUntil: 'networkidle' });

    // Select AI Agent sector
    try {
        const aiAgentBtn = page.getByText('AI Agent', { exact: true });
        if (await aiAgentBtn.isVisible()) {
            await aiAgentBtn.click();
        } else {
            console.log('AI Agent button not visible, checking loop...');
            const btns = await page.locator('button').all();
            for (const btn of btns) {
                const txt = await btn.textContent();
                if (txt?.includes('AI Agent')) {
                    await btn.click();
                    break;
                }
            }
        }

        // Fill textarea
        const textarea = page.locator('textarea');
        await textarea.fill("An AI agent that monitors on-chain whale wallets and automatically executes copy-trades with a risk management layer. Targeted at retail investors who want alpha without the work. Revenue model is a 1% fee on profits. The tech stack uses a custom LLM for sentiment analysis.");

        // Submit
        const submitBtn = page.getByText('RUN ANALYSIS');
        await submitBtn.click();

        console.log('⏳ Waiting for analysis to complete...');

        // Wait for the report container
        await page.waitForSelector('#printable-report', { timeout: 60000 });

        // Wait for animations to fully settle. The user mentioned it bugged out at the start.
        // This could be the reveal animation.
        await page.waitForTimeout(5000);

        // Force wait for images/charts
        await page.waitForLoadState('networkidle');

        // Locate the specific element
        const reportElement = page.locator('#printable-report');

        // Scroll it into view nicely
        await reportElement.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);

        const reportPath = path.join(ARTIFACT_DIR, 'screenshot_analysis_report.png');

        // Screenshot JUST the element + a little padding if we want, but element screenshot is safest for "cleanliness"
        await reportElement.screenshot({ path: reportPath, omitBackground: true });
        console.log(`✅ Saved targeted report: ${reportPath}`);

    } catch (e) {
        console.error('❌ Failed to generate report screenshot:', e);
    }

    await browser.close();
    console.log('✨ Capture complete!');
}

capture().catch(console.error);
