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
        # -> Click 'Hoppa över' button to close welcome modal and access main UI for further inspection.
        frame = context.pages[-1]
        # Click 'Hoppa över' button to close welcome modal
        elem = frame.locator('xpath=html/body/div[20]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on the moon icon (index 7) to enable dark mode in user settings.
        frame = context.pages[-1]
        # Click on the moon icon to enable dark mode
        elem = frame.locator('xpath=html/body/div[12]/a[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on 'System Config' button (index 1) to check for UI settings or navigation to Asma Ul Husna card.
        frame = context.pages[-1]
        # Click on 'System Config' button to access UI settings or navigation options
        elem = frame.locator('xpath=html/body/div/div/main/div[5]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select gold accent color button (index 20) to ensure gold accents are applied.
        frame = context.pages[-1]
        # Select gold accent color #FFD700
        elem = frame.locator('xpath=html/body/div/div/div[2]/div/div[5]/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select 'Katibeh (Calligraphic)' font (index 9) for Arabic elegant calligraphy font.
        frame = context.pages[-1]
        # Select 'Katibeh (Calligraphic)' font for Arabic text
        elem = frame.locator('xpath=html/body/div/div/div[2]/div/div[2]/div[2]/button[6]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select a clean Swedish sans-serif font for Swedish text, likely 'Kufam (Modern)' font (index 4).
        frame = context.pages[-1]
        # Select 'Kufam (Modern)' font for Swedish text
        elem = frame.locator('xpath=html/body/div/div/div[2]/div/div[2]/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click button with index 10 to set Background Energy to OFF for deep black background.
        frame = context.pages[-1]
        # Set Background Energy to OFF for deep black background
        elem = frame.locator('xpath=html/body/div/div/div[2]/div/div[3]/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Close the configuration panel (index 27) and navigate to the Asma Ul Husna card page or component to verify card layout, fonts, and animation behavior.
        frame = context.pages[-1]
        # Close the configuration panel
        elem = frame.locator('xpath=html/body/div/div/div[2]/div/div[6]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on 'System Config' button (index 1) to check if it provides navigation or access to Asma Ul Husna card or other relevant UI components.
        frame = context.pages[-1]
        # Click 'System Config' button to find navigation or UI options
        elem = frame.locator('xpath=html/body/div/div/main/div[5]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Close the configuration panel by clicking 'CLOSE PANEL' button (index 27) and then try to find a navigation element or link to the Asma Ul Husna card page or component on the main page.
        frame = context.pages[-1]
        # Close the configuration panel
        elem = frame.locator('xpath=html/body/div/div/div[2]/div/div[6]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Try to find a navigation element or link to the Asma Ul Husna card page or component on the current page or open a new tab with the URL 'http://localhost:5173/learn/asma_ul_husna.html' to access the card directly.
        await page.goto('http://localhost:5173/learn/asma_ul_husna.html', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Expand the first card to verify large Arabic text, no hover glow, and instant animations.
        frame = context.pages[-1]
        # Click to expand the first Asma Ul Husna card
        elem = frame.locator('xpath=html/body/div[4]/div/div[6]/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=أسماء الله الحسنى - Guds Vackraste Namn').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=📊').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=الجمال').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=اللَّهُ').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Gud').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Den Nåderike').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Den Barmhärtige').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Konungen').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Den Helige').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Källan till Fred').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Givaren av Tro').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Bevakaren').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Den Allsmäktige').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Den Oemotståndlige').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Den Majestätiske').first).to_be_visible(timeout=30000)
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
    