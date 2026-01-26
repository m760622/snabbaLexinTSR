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
        # -> Reload the page with '?test_mode=true' query parameter to bypass the welcome modal and try to access Browse Mode directly.
        await page.goto('http://localhost:5173/index.html?test_mode=true', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Click the 'Hoppa över' button to skip the welcome modal and access Browse Mode.
        frame = context.pages[-1]
        # Click 'Hoppa över' button to skip welcome modal
        elem = frame.locator('xpath=html/body/div[21]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Scroll down to locate the list of 99 Names of Allah cards and verify their count and content.
        await page.mouse.wheel(0, 600)
        

        # -> Click on the 'Lär / تعلم' link (index 6) to check if it leads to Browse Mode or the list of 99 Names of Allah cards.
        frame = context.pages[-1]
        # Click on 'Lär / تعلم' link to navigate to learning or browse mode
        elem = frame.locator('xpath=html/body/div[12]/a[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Scroll down further to locate the 99 Names of Allah cards and verify their count and bilingual display.
        await page.mouse.wheel(0, 400)
        

        # -> Scroll down further to locate the 99 Names of Allah cards and verify their count and bilingual display.
        await page.mouse.wheel(0, 400)
        

        # -> Try to find a navigation element or filter that specifically leads to the 99 Names of Allah cards or browse mode containing them.
        await page.mouse.wheel(0, -600)
        

        frame = context.pages[-1]
        # Click on 'Lär / تعلم' link again to refresh or reveal the browse mode containing the 99 Names of Allah cards
        elem = frame.locator('xpath=html/body/div[12]/a[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on the '99 Namn' tab (index 4) to display the list of 99 Names of Allah cards and verify their count and bilingual display.
        frame = context.pages[-1]
        # Click on '99 Namn' tab to display the 99 Names of Allah cards
        elem = frame.locator('xpath=html/body/div[3]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Scroll down to load and verify all 99 cards are displayed with correct bilingual content and grammar badges.
        await page.mouse.wheel(0, 800)
        

        # -> Scroll down to load and verify all 99 cards are displayed with correct bilingual content and grammar badges.
        await page.mouse.wheel(0, 600)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=99 Namn').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=اللَّهُ').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Gud').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=الرَّحْمَنُ').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Den Nåderike').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=الرَّحِيمُ').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Den Barmhärtige').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=الْمَلِكُ').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Konungen').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=الْقُدُّوسُ').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Den Helige').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=السَّلَامُ').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Källan till Fred').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=الْمُؤْمِنُ').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Givaren av Tro').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=الْمُهَيْمِنُ').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Bevakaren').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=الْعَزِيزُ').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Den Allsmäktige').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=الْجَبَّارُ').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Den Oemotståndlige').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=الْمُتَكَبِّرُ').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Den Majestätiske').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=الْخَالِقُ').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Skaparen').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    