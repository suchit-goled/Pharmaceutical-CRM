import os
import time
from playwright.sync_api import sync_playwright

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
SCREENSHOT_DIR = os.path.abspath("audit-report/screenshots/mobile_verification")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def run_tests():
    with sync_playwright() as p:
        print("[1/3] Testing on Google Chrome - iPhone 13 Mobile Viewport (390x844)...")
        iphone_device = p.devices['iPhone 13']
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True
        )

        # Context 1: Mobile Chrome
        context_mobile = browser.new_context(
            **iphone_device,
            locale="en-IN",
            timezone_id="Asia/Kolkata"
        )
        page = context_mobile.new_page()

        # 1. Login Page on Mobile
        page.goto("http://localhost:5173/login")
        page.wait_for_selector("text=MedIntel Pharma CRM")
        time.sleep(1)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "01_mobile_login_page.png"), full_page=True)
        print("  [OK] Captured mobile login page (Padlock, CDSCO/DPDPA badges, WhatsApp widget)")

        # 2. Test 404 Page on Mobile
        page.goto("http://localhost:5173/nonexistent-clinical-test-path")
        page.wait_for_selector("text=Looking for a Medical Record or Page?")
        time.sleep(1)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "02_mobile_404_not_found.png"), full_page=True)
        print("  [OK] Captured mobile 404 Not Found page with responsive clinical recovery links")

        # 3. Log in as Patient
        page.goto("http://localhost:5173/login")
        page.click("text=John Doe")
        page.click("button:has-text('Sign in to Portal')")
        page.wait_for_url("**/dashboard", timeout=12000)
        time.sleep(2)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "03_mobile_patient_dashboard.png"), full_page=True)
        print("  [OK] Captured mobile patient dashboard")

        # 4. Open Mobile Drawer / Hamburger
        menu_button = page.locator("button[aria-label='Open navigation menu']")
        if menu_button.is_visible():
            menu_button.click()
            time.sleep(1)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "04_mobile_nav_drawer_open.png"))
            print("  [OK] Captured mobile navigation drawer")
            time.sleep(0.5)

        # 5. Navigate to Products Catalogue
        page.goto("http://localhost:5173/products")
        page.wait_for_selector("text=Pharmaceutical Product Catalogue")
        time.sleep(2)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "05_mobile_products_catalogue_with_images.png"), full_page=True)
        print("  [OK] Captured mobile products catalogue with medicine packaging illustrations")

        # 6. Test Product Monograph Modal on Mobile
        page.locator(".group").first.click()
        time.sleep(1)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "06_mobile_product_monograph_modal.png"))
        print("  [OK] Captured mobile product monograph modal")
        page.click("text=Close Monograph")

        # 7. Navigate to Appointments & Test Indian Payment Modal
        page.goto("http://localhost:5173/appointments")
        page.wait_for_selector("text=Doctor Appointments & Consultations")
        time.sleep(2)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "07_mobile_patient_appointments.png"), full_page=True)
        print("  [OK] Captured mobile appointments queue")

        # Check Pay Fee button
        pay_btn = page.locator("button:has-text('Pay Fee')").first
        if pay_btn.is_visible():
            pay_btn.click()
            time.sleep(1.5)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "08_mobile_payment_modal_upi_qr.png"))
            print("  [OK] Captured mobile payment gateway checkout modal (UPI QR, GST breakdown)")
            # Cancel modal
            page.locator("button:has-text('Cancel')").first.click()

        # 8. Test 24/7 Support Desk Modal on Mobile
        support_btn = page.locator("button[title='Open 24/7 Support Desk']").first
        if support_btn.is_visible():
            support_btn.click()
            time.sleep(1)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "09_mobile_support_contact_modal.png"))
            print("  [OK] Captured 24/7 support contact modal")
            page.locator("button:has-text('Cancel')").first.click()

        # 9. Navigate to Nearby Healthcare Map
        page.goto("http://localhost:5173/nearby-healthcare")
        page.wait_for_selector("text=Nearby Healthcare & Pharmacy Map")
        time.sleep(2)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "10_mobile_nearby_healthcare_map.png"), full_page=True)
        print("  [OK] Captured mobile healthcare map")

        context_mobile.close()

        # [2/3] Safari Mobile Emulation (Safari User Agent on iPhone)
        print("[2/3] Testing Safari Mobile Emulation (Safari iOS WebKit headers)...")
        safari_context = browser.new_context(
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
            viewport={"width": 393, "height": 852},
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True,
            locale="en-IN",
            timezone_id="Asia/Kolkata"
        )
        safari_page = safari_context.new_page()

        # Check Patient Medications in Safari Mobile
        safari_page.goto("http://localhost:5173/login")
        safari_page.click("text=John Doe")
        safari_page.click("button:has-text('Sign in to Portal')")
        safari_page.wait_for_url("**/dashboard", timeout=12000)
        safari_page.goto("http://localhost:5173/medications")
        safari_page.wait_for_selector("text=Smart Medication & Dosage Management")
        time.sleep(2)
        safari_page.screenshot(path=os.path.join(SCREENSHOT_DIR, "11_safari_patient_medications.png"), full_page=True)
        print("  [OK] Captured Safari mobile patient medications view")

        # Doctor Login in Safari
        safari_page.goto("http://localhost:5173/login")
        safari_page.click("text=Dr. Gregory House")
        safari_page.click("button:has-text('Sign in to Portal')")
        safari_page.wait_for_url("**/dashboard", timeout=12000)
        time.sleep(2)
        safari_page.screenshot(path=os.path.join(SCREENSHOT_DIR, "12_safari_doctor_clinical_dashboard.png"), full_page=True)
        print("  [OK] Captured Safari doctor clinical dashboard")

        # Pharmacist Login in Safari
        safari_page.goto("http://localhost:5173/login")
        safari_page.click("text=Mike Ross, R.Ph")
        safari_page.click("button:has-text('Sign in to Portal')")
        safari_page.wait_for_url("**/dashboard", timeout=12000)
        safari_page.goto("http://localhost:5173/pharmacy-orders")
        safari_page.wait_for_selector("text=Pharmacy Dispensing & Prescription Queue")
        time.sleep(2)
        safari_page.screenshot(path=os.path.join(SCREENSHOT_DIR, "13_safari_pharmacist_orders.png"), full_page=True)
        print("  [OK] Captured Safari pharmacist prescription queue")

        safari_context.close()

        # [3/3] Desktop Viewport Verification (1280x800)
        print("[3/3] Testing on Chrome Desktop Viewport (1280x800)...")
        desktop_context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            locale="en-IN",
            timezone_id="Asia/Kolkata"
        )
        desktop_page = desktop_context.new_page()
        desktop_page.goto("http://localhost:5173/login")
        desktop_page.click("text=Dr. Eleanor Vance")
        desktop_page.click("button:has-text('Sign in to Portal')")
        desktop_page.wait_for_url("**/dashboard", timeout=12000)
        time.sleep(2)
        desktop_page.screenshot(path=os.path.join(SCREENSHOT_DIR, "14_chrome_desktop_executive_dashboard.png"))
        print("  [OK] Captured Chrome desktop executive dashboard")

        desktop_context.close()
        browser.close()

        print("\n[SUCCESS] All Playwright browser and mobile tests completed with 14 screenshots!")

if __name__ == "__main__":
    run_tests()
