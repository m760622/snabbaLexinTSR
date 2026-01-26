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
        # -> Navigate to quiz page with ?test_mode=true to bypass welcome modal and start quiz session.
        await page.goto('http://localhost:5173/?test_mode=true', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Click the 'Hoppa över' (Skip) button to bypass the welcome modal and access the main app interface or quiz mode.
        frame = context.pages[-1]
        # Click 'Hoppa över' (Skip) button to bypass welcome modal
        elem = frame.locator('xpath=html/body/div[21]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the 'Quiz / اختبار' button (index 12) to start a quiz session and begin answering questions.
        frame = context.pages[-1]
        # Click 'Quiz / اختبار' button to start quiz session
        elem = frame.locator('xpath=html/body/div[12]/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select an answer for the current question (click one of the answer buttons) and then click the 'Nästa' (Next) button to proceed to the next question.
        frame = context.pages[-1]
        # Select first answer option for the current question
        elem = frame.locator('xpath=html/body/div[13]/div/div[3]/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        # Click 'Nästa' (Next) button to submit answer and go to next question
        elem = frame.locator('xpath=html/body/div[13]/div/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Close the app (reload or navigate away) and then reopen it to verify that quiz progress and score are saved and restored correctly from LocalStorage.
        await page.goto('http://localhost:5173/index.html', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Click the 'Quiz / اختبار' button (index 12) to re-enter the quiz session and verify the score and progress inside the quiz interface.
        frame = context.pages[-1]
        # Click 'Quiz / اختبار' button to re-enter quiz session and verify score and progress
        elem = frame.locator('xpath=html/body/div[12]/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select an answer for the current question by clicking one of the answer buttons (index 15-18), then click the 'Nästa' (Next) button (index 19) to submit the answer and proceed to the next question.
        frame = context.pages[-1]
        # Select first answer option for current question
        elem = frame.locator('xpath=html/body/div[13]/div/div[3]/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        # Click 'Nästa' (Next) button to submit answer and go to next question
        elem = frame.locator('xpath=html/body/div[13]/div/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the 'Quiz / اختبار' button (index 12) to enter the quiz session and verify the current score and progress inside the quiz interface.
        frame = context.pages[-1]
        # Click 'Quiz / اختبار' button to enter quiz session and verify score and progress
        elem = frame.locator('xpath=html/body/div[12]/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select an answer for the last question by clicking one of the answer buttons (index 15-18), then click the 'Nästa' (Next) button (index 19) to submit the answer and complete the quiz session.
        frame = context.pages[-1]
        # Select first answer option for last question
        elem = frame.locator('xpath=html/body/div[13]/div/div[3]/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        # Click 'Nästa' (Next) button to submit answer and complete quiz session
        elem = frame.locator('xpath=html/body/div[13]/div/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select an answer for the current question by clicking one of the answer buttons (index 15-18), then click the 'Nästa' (Next) button (index 19) to submit the answer and proceed to the next question.
        frame = context.pages[-1]
        # Select first answer option for current question
        elem = frame.locator('xpath=html/body/div[13]/div/div[3]/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Try scrolling down to reveal the answer option buttons or refresh the page to reload the quiz interface and make the answer buttons interactable.
        await page.mouse.wheel(0, 200)
        

        await page.goto('http://localhost:5173/index.html/?test_mode=true', timeout=10000)
        await asyncio.sleep(3)
        

        frame = context.pages[-1]
        # Click 'Quiz / اختبار' button to start quiz session after reload
        elem = frame.locator('xpath=html/body/div[12]/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select an answer for the current question by clicking the first answer option button (index 15), then click the 'Nästa' (Next) button (index 19) to submit the answer and proceed.
        frame = context.pages[-1]
        # Select first answer option for current question
        elem = frame.locator('xpath=html/body/div[13]/div/div[3]/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click the 'Nästa' (Next) button (index 19) to submit the answer and proceed to the next question or complete the quiz session.
        frame = context.pages[-1]
        # Click 'Nästa' (Next) button to proceed after answer feedback
        elem = frame.locator('xpath=html/body/div[13]/div/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=11 / 10').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=+50').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=XP').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    