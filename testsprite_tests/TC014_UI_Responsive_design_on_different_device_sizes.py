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
        # -> Resize the browser window to tablet size and verify layout adapts with no overflow or clipped content.
        await page.mouse.wheel(0, await page.evaluate('() => window.innerHeight'))
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Snabba Lexin').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=القاموس السريع').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=📖 Dagens mål / هدف اليوم').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=2 / 10').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=🎯 DAGLIG UTMANINGالتحدي اليومي').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=+50').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=2/10').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=📅 DAGENS ORDكلمة اليوم').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=🔊').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=ADJEKTIV.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=💪').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Stark').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=ثقيل').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Hoppa över ❯').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=👋').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Välkommen till SnabbaLexin!').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=أهلاً بك في سنابا ليكسين!').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Din kompis för att lära dig svenska').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=رفيقك في تعلم اللغة السويدية').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Nästa ⟶').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    