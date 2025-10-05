from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Log in to the application
        page.goto("http://localhost:5173/login")
        page.locator('input[name="email"]').fill("admin@idris.com")
        page.locator('input[name="password"]').fill("password")
        page.get_by_role("button", name="Login", exact=True).click()

        # Wait for navigation to the dashboard after login
        expect(page).to_have_url("http://localhost:5173/response_dashboard")

        # 2. Navigate to the donation records page
        # It's under "Donations Management" -> "Donation Records"
        page.get_by_role("link", name="Donations Management").click()
        page.get_by_role("link", name="Donation Records").click()

        # 3. Verify the page content
        expect(page).to_have_url("http://localhost:5173/donations_management/donation_records")
        expect(page.get_by_role("heading", name="Track Donations")).to_be_visible()
        expect(page.get_by_role("button", name="Filter")).to_be_visible()
        expect(page.get_by_role("table")).to_be_visible()

        # 4. Take a screenshot
        page.screenshot(path="jules-scratch/verification/donation_records.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)