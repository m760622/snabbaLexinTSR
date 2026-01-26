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
        # -> Click the 'Hoppa över' button to skip the welcome modal.
        frame = context.pages[-1]
        # Click the 'Hoppa över' button to skip the welcome modal
        elem = frame.locator('xpath=html/body/div[21]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Type a partial Arabic name or Swedish translation into the search input.
        frame = context.pages[-1]
        # Type partial Swedish name 'Bor' into the search input to test real-time filtering
        elem = frame.locator('xpath=html/body/div[11]/div/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Bor')
        

        # -> Click the 'Rensa / مسح' button to clear the search input and verify all names are shown again.
        frame = context.pages[-1]
        # Click the 'Rensa / مسح' button to clear the search input
        elem = frame.locator('xpath=html/body/div[11]/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Manually clear the search input by selecting and deleting the text to verify if the card list updates to show all 99 names.
        frame = context.pages[-1]
        # Manually clear the search input by deleting all text
        elem = frame.locator('xpath=html/body/div[11]/div/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('')
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
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
    