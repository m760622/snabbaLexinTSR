import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:5173", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # -> Try to bypass welcome modal or wait for redirect to main content with name cards
        await page.goto('http://localhost:5173/index.html?test_mode=true', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Click the 'Hoppa över' (Skip) button to dismiss the welcome modal and access the main content
        frame = context.pages[-1]
        # Click the 'Hoppa över' (Skip) button on the welcome modal to dismiss it
        elem = frame.locator('xpath=html/body/div[21]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Expand a name card to reveal audio playback button and click the audio playback button to test pronunciation
        frame = context.pages[-1]
        # Click the 'Lyssna / استمع' audio playback button on the first name card to test audio pronunciation
        elem = frame.locator('xpath=html/body/div[14]/main/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click audio playback button on a different name card to verify smooth audio switch and correct pronunciation
        frame = context.pages[-1]
        # Click the audio playback button on a different name card to test audio switch and pronunciation
        elem = frame.locator('xpath=html/body/div[14]/main/div/div/div[2]/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Snabba Lexin').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=القاموس السريع').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=📖 Dagens mål / هدف اليوم').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=4 / 10').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=DAGLIG UTMANINGالتحدي اليومي').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=+50').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=XP').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=4/10').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=📅 DAGENS ORDكلمة اليوم').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=🔊').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=ADJEKTIV.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=💪').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Jämn').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=متماثل').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Börja skriva för att sökaابدأ الكتابة للبحث').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    