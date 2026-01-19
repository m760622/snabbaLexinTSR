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
        await page.goto("http://localhost:5173/learn/asma_ul_husna.html", wait_until="commit", timeout=10000)
        
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
        # -> Navigate to main search page with '?test_mode=true' appended to URL.
        await page.goto('http://localhost:5173/?test_mode=true', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Try to navigate directly to the main search page URL with '?test_mode=true' appended or find any clickable elements to bypass welcome screen.
        await page.goto('http://localhost:5173/index.html?test_mode=true', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Try to reload the page or navigate to a different URL to bypass the loading screen or wait longer for loading to complete.
        await page.goto('http://localhost:5173/index.html?test_mode=true', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Click the 'Hoppa över' (Skip) button to dismiss the welcome modal and access the search input.
        frame = context.pages[-1]
        # Click the 'Hoppa över' (Skip) button to dismiss the welcome modal.
        elem = frame.locator('xpath=html/body/div[20]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Enter special characters into the search input field to test handling of invalid inputs.
        frame = context.pages[-1]
        # Enter special characters into the search field to test handling of invalid inputs.
        elem = frame.locator('xpath=html/body/div[11]/div/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('!@#$%^&*()_+{}:"<>?')
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Snabba Lexin').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=القاموس السريع').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=📖').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=2').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=🔥').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=1').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=0').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=🎮').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Spelألعاب').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=📚').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Lärتعلم').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=🌙').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Ramadanرمضان').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=⭐').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Favoriterمفضلة').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=⚡').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Quizاختبار').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    