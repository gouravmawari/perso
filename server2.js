const puppeteer = require('puppeteer');
const express = require('express');
const fs = require('fs').promises;
const app = express();

app.use(express.json());

let browser;
let page;

async function initializeBrowser() {
    try {
        // Connect to the existing Chrome instance using the remote debugging port
        browser = await puppeteer.connect({
            browserWSEndpoint: 'ws://127.0.0.1:9222/devtools/browser', // Connect to Chrome on port 9222
            defaultViewport: null
        });

        // Get all open pages (tabs)
        const pages = await browser.pages();
        
        // Find the ChatGPT tab
        page = pages.find(p => p.url().includes('chatgpt.com'));
        if (!page) {
            throw new Error('ChatGPT tab not found! Please ensure the tab is open at https://chatgpt.com.');
        }

        // Debug: Print the page title and URL
        const pageTitle = await page.title();
        const currentUrl = await page.url();
        console.log('Page Title:', pageTitle);
        console.log('Current URL:', currentUrl);

        // Check if we’re logged in by looking for the profile photo element
        const profilePhoto = await page.$x("//button[contains(@aria-label, 'User menu')]//img");
        if (profilePhoto.length === 0) {
            console.log('Not logged in! Please log in manually within 60 seconds.');
            await page.waitForXPath("//*[@id='prompt-textarea']", { timeout: 60000 });
        } else {
            console.log('Logged in successfully! Profile photo detected.');
        }

        // Wait for the chat page to load
        await page.waitForXPath("//*[@id='prompt-textarea']", { timeout: 10000 });
        console.log('Chat page loaded successfully! Ready to generate images.');
    } catch (error) {
        console.error('Failed to connect to browser or load chat page:', error);
        if (browser) await browser.disconnect();
        process.exit(1);
    }
}

async function generateImage(prompt) {
    try {
        // Add a delay to avoid rate limiting
        await page.waitForTimeout(10000 + Math.random() * 5000);

        // Mimic human behavior: scroll and move mouse
        await page.evaluate(() => window.scrollTo(0, 500));
        await page.mouse.move(100, 100);
        await page.waitForTimeout(500);
        await page.mouse.move(200, 200);
        await page.waitForTimeout(1000 + Math.random() * 1000);

        // Find the prompt input field and click it
        const inputField = await page.$x("//*[@id='prompt-textarea']");
        if (inputField.length === 0) {
            throw new Error('Prompt input field not found!');
        }
        await inputField[0].click();
        await page.waitForTimeout(500);

        // Clear the input field
        await inputField[0].type('', { delay: 100 }); // Clear by typing empty string

        // Type the prompt
        const fullPrompt = `/image ${prompt}`;
        await inputField[0].type(fullPrompt, { delay: 50 });

        // Click the send button
        const sendButton = await page.$x("//button[@aria-label='Send prompt']");
        if (sendButton.length === 0) {
            throw new Error('Send button not found!');
        }
        await sendButton[0].click();

        // Wait for the latest image
        await page.waitForXPath("(//article//img)[last()]", { timeout: 30000 });

        // Get the latest image URL
        const imageElement = await page.$x("(//article//img)[last()]");
        if (imageElement.length === 0) {
            throw new Error('Generated image not found!');
        }
        const imageUrl = await page.evaluate(el => el.src, imageElement[0]);

        // Download the image
        const response = await fetch(imageUrl);
        const buffer = await response.buffer();
        const uniqueFileName = `generated_image_${Date.now()}.png`;
        await fs.writeFile(uniqueFileName, buffer);

        return uniqueFileName;
    } catch (error) {
        console.error('Error generating image:', error);
        throw error;
    }
}

initializeBrowser().then(() => {
    app.post('/generate', async (req, res) => {
        const prompt = req.body.prompt;
        try {
            const imagePath = await generateImage(prompt);
            res.sendFile(imagePath, { root: __dirname }, (err) => {
                if (!err) fs.unlink(imagePath).catch(console.error);
            });
        } catch (error) {
            res.status(500).send('Error generating image');
        }
    });

    app.listen(3000, () => console.log('Server running on http://localhost:3000'));
});

process.on('SIGINT', async () => {
    if (browser) {
        await browser.disconnect(); // Disconnect instead of closing, since the browser was already open
        console.log('Disconnected from browser.');
    }
    process.exit();
});