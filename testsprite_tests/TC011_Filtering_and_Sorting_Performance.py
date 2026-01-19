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
        # -> Navigate to the target page with filtering and sorting functionality with ?test_mode=true appended to URL.
        await page.goto('http://localhost:5173/learn/asma_ul_husna.html?test_mode=true', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Click the 'Filter' button to open filter options and apply multiple filters in quick succession.
        frame = context.pages[-1]
        # Click the 'Filter' button to open filter options.
        elem = frame.locator('xpath=html/body/div[11]/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the 'Hoppa över' (Skip) button to dismiss the welcome modal and access the main UI.
        frame = context.pages[-1]
        # Click the 'Hoppa över' (Skip) button on the welcome modal to dismiss it.
        elem = frame.locator('xpath=html/body/div[20]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the 'Filter' button to open filter options and apply multiple filters in quick succession.
        frame = context.pages[-1]
        # Click the 'Filter' button to open filter options.
        elem = frame.locator('xpath=html/body/div[11]/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Apply multiple filters in quick succession by clicking category buttons (Spel, Lär, Ramadan, Favoriter, Quiz).
        frame = context.pages[-1]
        # Click the 'Spel' category button to apply filter.
        elem = frame.locator('xpath=html/body/div[12]/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Reload the original URL with '?test_mode=true' appended to restore the test environment and retry sorting verification.
        await page.goto('http://localhost:5173/learn/asma_ul_husna.html?test_mode=true', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Click the 'Filters' button (index 11) to open filter options and apply multiple filters in quick succession.
        frame = context.pages[-1]
        # Click the 'Filters' button to open filter options.
        elem = frame.locator('xpath=html/body/div[4]/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Apply multiple filters in quick succession by clicking category buttons: 'الكل (100)' (index 12), '❤️ (0)' (index 13), '✓ (0)' (index 14), 'الجلال (20)' (index 15), 'الجمال (12)' (index 16), 'الكمال (68)' (index 17).
        frame = context.pages[-1]
        # Click the 'الكل (100)' category button to apply filter.
        elem = frame.locator('xpath=html/body/div[4]/div/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        # Click the '❤️ (0)' category button to apply filter.
        elem = frame.locator('xpath=html/body/div[4]/div/div[3]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=الكل').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=الجلال').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=الجمال').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=الكمال').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=أَسْمَاءُ اللَّهِ الْحُسْنَى').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Den Nåderike').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    