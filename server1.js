

// const { Builder, By, Key, until } = require('selenium-webdriver');
// const chrome = require('selenium-webdriver/chrome');
// require('chromedriver');
// const express = require('express');
// const fs = require('fs').promises;
// const app = express();


// app.use(express.json());

// let driver;

// async function initializeBrowser() {
//     let options = new chrome.Options();
//     options.addArguments('--disable-blink-features=AutomationControlled');
//     options.addArguments('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
//     options.addArguments('user-data-dir=C:/Users/rsmaw/AppData/Local/Google/Chrome/User Data');
//     options.addArguments('profile-directory=Profile 3'); // Your profile name

//     driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

//     try {
//         await driver.executeScript("Object.defineProperty(navigator, 'webdriver', { get: () => undefined });");

//         // Go directly to the chat page (you’re already logged in)
//         await driver.get('https://chatgpt.com');

//         // Debug: Print the page title and URL
//         const pageTitle = await driver.getTitle();
//         const currentUrl = await driver.getCurrentUrl();
//         console.log('Page Title:', pageTitle);
//         console.log('Current URL:', currentUrl);

//         // Wait for the chat page to load
//         await driver.wait(until.elementLocated(By.xpath("//*[@id='prompt-textarea']")), 10000);
//         console.log('Chat page loaded successfully! Ready to generate images.');
//     } catch (error) {
//         console.error('Failed to load chat page:', error);
//         const pageSource = await driver.getPageSource();
//         console.log('Page Source:', pageSource);
//         await driver.quit();
//         process.exit(1);
//     }
// }

// async function generateImage(prompt) {
//     try {
//         // Add a delay to avoid rate limiting
//         await driver.sleep(10000 + Math.random() * 5000); // 10-15 seconds delay

//         // Find the prompt input field
//         let inputField = await driver.findElement(By.xpath("//*[@id='prompt-textarea']"));
//         for (let char of `/image  ${prompt}`) {
//             await inputField.sendKeys(char);
//             await driver.sleep(50 + Math.random() * 100); // Type like a human
//         }
//         await driver.sleep(1000 + Math.random() * 1000); // Random pause
//         await inputField.sendKeys(Key.ENTER);

//         // Wait for the latest image
//         await driver.wait(until.elementLocated(By.xpath("(//article//img)[last()]")), 20000);

//         // Get the latest image URL
//         let imageElement = await driver.findElement(By.xpath("(//article//img)[last()]"));
//         let imageUrl = await imageElement.getAttribute('src');

//         // Download the image
//         const response = await fetch(imageUrl);
//         const buffer = await response.buffer();
//         const uniqueFileName = `generated_image_${Date.now()}.png`;
//         await fs.writeFile(uniqueFileName, buffer);

//         return uniqueFileName;
//     } catch (error) {
//         console.error('Error generating image:', error);
//         const currentUrl = await driver.getCurrentUrl();
//         console.log('Current URL:', currentUrl);
//         const pageSource = await driver.getPageSource();
//         console.log('Page Source:', pageSource);
//         throw error;
//     }
// }

// initializeBrowser().then(() => {
//     app.post('/generate', async (req, res) => {
//         const prompt = req.body.prompt;
//         try {
//             const imagePath = await generateImage(prompt);
//             res.sendFile(imagePath, { root: __dirname }, (err) => {
//                 if (!err) fs.unlink(imagePath).catch(console.error);
//             });
//         } catch (error) {
//             res.status(500).send('Error generating image');
//         }
//     });

//     app.listen(3000, () => console.log('Server running on http://localhost:3000'));
// });

// process.on('SIGINT', async () => {
//     if (driver) {
//         await driver.quit();
//         console.log('Browser closed.');
//     }
//     process.exit();
// });





const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
require('chromedriver');
const express = require('express');
const fs = require('fs').promises;
const app = express();

app.use(express.json());

let driver;

async function initializeBrowser() {
    let options = new chrome.Options();
    // Suppress automation detection
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('--disable-infobars'); // Disable the automation message
    options.excludeSwitches(['enable-automation']); // Hide automation switches
    options.addArguments('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
    options.addArguments('user-data-dir=C:/Users/rsmaw/AppData/Local/Google/Chrome/User Data');
    options.addArguments('profile-directory=Profile 3');

    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    try {
        // Hide WebDriver property
        await driver.executeScript("Object.defineProperty(navigator, 'webdriver', { get: () => undefined });");

        // Go to the chat page
        await driver.get('https://chatgpt.com');

        // Debug: Print the page title and URL
        const pageTitle = await driver.getTitle();
        const currentUrl = await driver.getCurrentUrl();
        console.log('Page Title:', pageTitle);
        console.log('Current URL:', currentUrl);

        // Check if we’re logged in by looking for the profile photo element
        const profilePhoto = await driver.findElements(By.xpath("//button[contains(@aria-label, 'User menu')]//img"));
        if (profilePhoto.length === 0) {
            console.log('Not logged in! Please log in manually within 60 seconds.');
            console.log('After logging in, the script will continue automatically.');
            await driver.wait(until.elementLocated(By.xpath("//*[@id='prompt-textarea']")), 60000);
        } else {
            console.log('Logged in successfully! Profile photo detected.');
        }

        // Wait for the chat page to load
        await driver.wait(until.elementLocated(By.xpath("//*[@id='prompt-textarea']")), 10000);
        console.log('Chat page loaded successfully! Ready to generate images.');
    } catch (error) {
        console.error('Failed to load chat page:', error);
        const pageSource = await driver.getPageSource();
        console.log('Page Source:', pageSource);
        await driver.quit();
        process.exit(1);
    }
}

async function generateImage(prompt) {
    try {
        // Add a delay to avoid rate limiting
        await driver.sleep(10000 + Math.random() * 5000); // 10-15 seconds delay

        // Mimic human behavior: scroll, move mouse, and click
        await driver.executeScript("window.scrollTo(0, 500);"); // Scroll down
        const actions = driver.actions({ async: true });
        await actions.move({ x: 100, y: 100 }).pause(500).move({ x: 200, y: 200 }).perform();
        await driver.sleep(1000 + Math.random() * 1000); // Random pause

        // Find the prompt input field and click it to focus
        let inputField = await driver.findElement(By.xpath("//*[@id='prompt-textarea']"));
        await inputField.click();
        await driver.sleep(500); // Small pause after clicking

        // Clear the input field
        await inputField.clear();

        // Type the prompt
        const fullPrompt = `/image ${prompt}`;
        for (let char of fullPrompt) {
            await inputField.sendKeys(char);
            await driver.sleep(50 + Math.random() * 100); // Type like a human
        }
        await driver.sleep(1000 + Math.random() * 1000); // Random pause

        // Find and click the send button
        let sendButton = await driver.findElement(By.xpath("//button[@aria-label='Send prompt']"));
        await sendButton.click();

        // Wait for the latest image
        await driver.wait(until.elementLocated(By.xpath("(//article//img)[last()]")), 30000);

        // Get the latest image URL
        let imageElement = await driver.findElement(By.xpath("(//article//img)[last()]"));
        let imageUrl = await imageElement.getAttribute('src');

        // Download the image
        const response = await fetch(imageUrl);
        const buffer = await response.buffer();
        const uniqueFileName = `generated_image_${Date.now()}.png`;
        await fs.writeFile(uniqueFileName, buffer);

        return uniqueFileName;
    } catch (error) {
        console.error('Error generating image:', error);
        const currentUrl = await driver.getCurrentUrl();
        console.log('Current URL:', currentUrl);
        const pageSource = await driver.getPageSource();
        console.log('Page Source:', pageSource);
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
    if (driver) {
        await driver.quit();
        console.log('Browser closed.');
    }
    process.exit();
});