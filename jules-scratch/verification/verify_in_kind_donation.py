from playwright.sync_api import sync_playwright, Page, expect
import time
import re

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Navigate to the registration page
        page.goto("http://localhost:5173/register", timeout=60000)

        # 2. Fill out the registration form
        timestamp = int(time.time())
        email = f"testuser{timestamp}@example.com"
        password = "Password123!"

        page.get_by_placeholder("Email").fill(email)
        page.get_by_placeholder("Username").fill(f"testuser{timestamp}")
        page.get_by_placeholder("Password", exact=True).fill(password)
        page.get_by_placeholder("Confirm Password").fill(password)
        page.get_by_role("button", name="Signup").click()

        # Handle the "Register As" modal
        user_button = page.get_by_role("button", name="User")
        expect(user_button).to_be_visible(timeout=10000)
        user_button.click()

        # Handle the "Select User Role" modal
        generic_user_button = page.get_by_role("button", name="Generic User")
        expect(generic_user_button).to_be_visible(timeout=10000)
        generic_user_button.click()

        # Explicitly navigate to login page after registration flow
        page.goto("http://localhost:5173/login", timeout=10000)

        # 3. Log in with the new user
        page.get_by_placeholder("Email").fill(email)
        page.get_by_placeholder("Password", exact=True).fill(password)
        page.get_by_role("button", name="Login", exact=True).click()

        # Wait for login to complete and navigate to the dashboard
        expect(page).to_have_url(re.compile(r".*/donations_management/donations_dashboard"), timeout=15000)

        # 4. Navigate to the donation page
        page.goto("http://localhost:5173/donations_management/funding_donation", timeout=10000)

        # It seems there's a default funding proposal, we can click the donate button directly
        donate_button = page.get_by_role("button", name="Donate Now").first
        expect(donate_button).to_be_visible(timeout=10000)
        donate_button.click()

        # 5. Select In-Kind donation type
        in_kind_button = page.get_by_role("button", name="In-Kind (Goods or Services)")
        expect(in_kind_button).to_be_visible(timeout=10000)
        in_kind_button.click()

        # 6. Verify the "What are you donating?" section is visible
        expect(page.get_by_text("What are you donating?")).to_be_visible()

        # 7. Select checkboxes
        page.get_by_label("Clothing").check()
        page.get_by_label("Other").check()

        # 8. Verify "Other - describe" input is visible and fill it
        other_input = page.get_by_label("Other — describe")
        expect(other_input).to_be_visible()
        other_input.fill("Winter Jackets")

        # 9. Take a screenshot
        page.screenshot(path="jules-scratch/verification/in-kind-donation-form.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)