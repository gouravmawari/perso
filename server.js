// // const express = require("express");
// // const { Builder, By, Key, until } = require("selenium-webdriver");
// // const chrome = require('selenium-webdriver/chrome');
// // const app = express();
// // app.use(express.json()); // To parse JSON requests from frontend
// const { Builder, By, Key, until } = require('selenium-webdriver');
// const chrome = require('selenium-webdriver/chrome');
// const express = require('express');
// const app = express();

// app.use(express.json()); // To parse JSON requests from frontend

// async function generateImage(prompt) {
//     // Set up Chrome driver
//     let driver = await new Builder()
//         .forBrowser('chrome')
//         .setChromeOptions(new chrome.Options())
//         .build();

//     try {
//         // Navigate to ChatGPT/DALL·E web interface (replace with actual URL)
//         await driver.get('https://chatgpt.com/'); // Hypothetical URL

//         // Wait for the page to load (adjust timing or conditions as needed)
//         await driver.sleep(10000);

//         // Find the input field, enter prompt, and submit
//         // let inputField = await driver.findElement(By.xpath("//textarea[@id='prompt-input']")); // Adjust XPath/ID
//         let inputField = await driver.findElement(By.xpath("/html/body/div[1]/div/div[1]/div/main/div[1]/div/div[2]/div/div/div[4]/div[2]/form/div[1]/div/div[1]/div[1]/div[2]/div/div/div/div/textarea"));
        
//         await inputField.sendKeys(`Generate an image of: ${prompt}`);
//         await inputField.sendKeys(Key.ENTER);

//         // Wait for image generation (adjust timing based on actual response)
//         await driver.sleep(10000);

//         // Extract the image (assuming it’s an <img> tag)
//         let imageElement = await driver.findElement(By.xpath("//img[contains(@src, 'generated')]")); // Adjust XPath
//         let imageUrl = await imageElement.getAttribute('src');

//         // Download the image using fetch
//         const response = await fetch(imageUrl);
//         const buffer = await response.buffer(); // Buffer the image data
//         require('fs').writeFileSync('generated_image.png', buffer);

//         return 'generated_image.png';
//     } finally {
//         await driver.quit(); // Always close the browser
//     }
// }

// // Express endpoint to receive prompt and send image
// app.post('/generate', async (req, res) => {
//     const prompt = req.body.prompt;
//     try {
//         const imagePath = await generateImage(prompt);
//         res.sendFile(imagePath, { root: __dirname });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Error generating image');
//     }
// });

// // Start the server
// app.listen(3000, () => {
//     console.log('Server running on http://localhost:3000');
// });

// const { Builder, By, Key, until } = require('selenium-webdriver');
// require('chromedriver');
// const express = require('express');
// const fs = require('fs').promises;
// const app = express();

// app.use(express.json());

// // Global driver variable to reuse the browser session
// let driver;

// // Function to set up the browser and log in once
// async function initializeBrowser() {
//     driver = await new Builder().forBrowser('chrome').build();

//     try {
//         // Go to the site
//         await driver.get('https://auth0.openai.com/u/login/password?state=hKFo2SA4MWtjSVlfZnczelpSVXJRbXFWaUlnaC1weThSeFRMaKFur3VuaXZlcnNhbC1sb2dpbqN0aWTZIFVHZm9LdERaVWlZX0tCSmJEZW4teXd1ODdybVRCM1F3o2NpZNkgVGRKSWNiZTE2V29USHROOTVueXl3aDVFNHlPbzZJdEc'); // Replace with real URL

//         // Log in
//         // let usernameField = await driver.findElement(By.xpath("//input[@type='email']")); // Adjust this
//         // await usernameField.sendKeys('your_email@example.com'); // Your email
//         let passwordField = await driver.findElement(By.xpath("//input[@type='password']")); // Adjust this
//         await passwordField.sendKeys('1000%DoneDone'); // Your password
//         let loginButton = await driver.findElement(By.xpath("//button[text()='Log In']")); // Adjust this
//         await loginButton.click();

//         // Wait for the chat page to load
//         await driver.wait(until.elementLocated(By.xpath("//textarea[@id='prompt-input']")), 10000);
//         console.log('Logged in successfully!');
//     } catch (error) {
//         console.error('Login failed:', error);
//         await driver.quit(); // Close if login fails
//         process.exit(1); // Stop the server if login fails
//     }
// }

// // Function to generate an image using the existing session
// async function generateImage(prompt) {
//     try {
//         // Use the already-open browser
//         let inputField = await driver.findElement(By.xpath("/html/body/div[1]/div/div[1]/div/main/div[1]/div/div[2]/div/div/div[4]/div[2]/form/div[1]/div/div[1]/div[1]/div[2]/div/div/div/div/textarea")); // Adjust this
//         await inputField.sendKeys(`Generate an image of: ${prompt}`);
//         await inputField.sendKeys(Key.ENTER);

//         // Wait for the latest image
//         await driver.wait(until.elementLocated(By.xpath("(//article//img)[last()]")), 20000);

//         // Get the image URL
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
//         throw error; // Let the API handle the error
//     }
// }

// // Start the browser when the server starts
// initializeBrowser().then(() => {
//     // API endpoint
//     app.post('/generate', async (req, res) => {
//         const prompt = req.body.prompt;
//         try {
//             const imagePath = await generateImage(prompt);
//             res.sendFile(imagePath, { root: __dirname }, (err) => {
//                 if (!err) fs.unlink(imagePath).catch(console.error); // Clean up
//             });
//         } catch (error) {
//             res.status(500).send('Error generating image');
//         }
//     });

//     // Start the server
//     app.listen(3000, () => console.log('Server running on http://localhost:3000'));
// });

// // Optional: Clean up when the server stops
// process.on('SIGINT', async () => {
//     if (driver) {
//         await driver.quit();
//         console.log('Browser closed.');
//     }
//     process.exit();
// });




// ---------------------------------------------------------------------------------------------------
const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
require('chromedriver');
const express = require('express');
const fs = require('fs').promises;
const app = express();
//*[@id="auth0-widget"]/main/section/div/div/div/form/div[2]/button
//*[@id="auth0-widget"]/main/section/div/div/div/form/div[2]/button
app.use(express.json());

let driver;

async function initializeBrowser() {
    let options = new chrome.Options();
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    try {
        // Hide the webdriver flag
        await driver.executeScript("Object.defineProperty(navigator, 'webdriver', { get: () => undefined });");

        // Step 1: Go to the site and enter email
        await driver.get('https://auth.openai.com/authorize?audience=https%3A%2F%2Fapi.openai.com%2Fv1&client_id=TdJIcbe16WoTHtN95nyywh5E4yOo6ItG&country_code=IN&device_id=0b1d6e35-16a5-4655-9041-b1c611e3ed10&ext-login-allow-phone=true&ext-oai-did=0b1d6e35-16a5-4655-9041-b1c611e3ed10&ext-signup-allow-phone=true&prompt=login&redirect_uri=https%3A%2F%2Fchatgpt.com%2Fapi%2Fauth%2Fcallback%2Fopenai&response_type=code&scope=openid+email+profile+offline_access+model.request+model.read+organization.read+organization.write&screen_hint=login&state=c8SRbhyh1aRITc-hoYPl_fRaUYYStY5mjFzuYG96its&flow=treatment'); // Replace with real URL
        let emailField = await driver.findElement(By.xpath("//*[@id='email-input']")); // Adjust XPath/ID
        await emailField.sendKeys('nathu1@proton.me'); // Your email
        let nextButton = await driver.findElement(By.xpath("//button[contains(text(), 'Log In')] | //button[contains(text(), 'Next')]")); // Adjust XPath
        await nextButton.click();

        // Step 2: Wait for password page, then enter password
        await driver.wait(until.elementLocated(By.xpath("//input[@type='password']")), 10000); // Wait for password field
        let passwordField = await driver.findElement(By.xpath("//input[@type='password']")); // Adjust XPath/ID
        await passwordField.sendKeys('your_password'); // Your password
        let continueButton = await driver.findElement(By.xpath("//button[contains(text(), 'Continue')]")); // Adjust XPath
        await continueButton.click();

        // Step 3: Wait for the chat page to load
        await driver.wait(until.elementLocated(By.xpath("//textarea[@id='prompt-input']")), 10000); // Adjust XPath
        console.log('Logged in successfully!');
    } catch (error) {
        console.error('Login failed:', error);
        await driver.quit();
        process.exit(1);
    }
}

async function generateImage(prompt) {
    try {
        let inputField = await driver.findElement(By.xpath("//textarea[@id='prompt-input']")); // Adjust XPath
        for (let char of `Generate an image of: ${prompt}`) {
            await inputField.sendKeys(char);
            await driver.sleep(50 + Math.random() * 100); // Type like a human
        }
        await driver.sleep(1000 + Math.random() * 1000); // Random pause
        await inputField.sendKeys(Key.ENTER);

        await driver.wait(until.elementLocated(By.xpath("(//article//img)[last()]")), 20000);

        let imageElement = await driver.findElement(By.xpath("(//article//img)[last()]"));
        let imageUrl = await imageElement.getAttribute('src');

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
    if (driver) {
        await driver.quit();
        console.log('Browser closed.');
    }
    process.exit();
});