const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';

const DIR_PATIENT = 'C:\\CompanyProject\\audit-report\\screenshots\\patient';
const DIR_DOCTOR = 'C:\\CompanyProject\\audit-report\\screenshots\\doctor';
const DIR_PHARM = 'C:\\CompanyProject\\audit-report\\screenshots\\pharmacist';
const DIR_COMP = 'C:\\CompanyProject\\audit-report\\comparisons';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loginUser(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
  await delay(500);

  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await delay(500);

  await page.waitForSelector('input[type="email"]');
  await page.click('input[type="email"]', { clickCount: 3 });
  await page.type('input[type="email"]', email);

  await page.waitForSelector('input[type="password"]');
  await page.click('input[type="password"]', { clickCount: 3 });
  await page.type('input[type="password"]', password);

  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
  await delay(2000);
}

async function run() {
  console.log('Launching browser for updated role interface capture...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // -------------------------------------------------------------------------
  // 1. PATIENT INTERFACE
  // -------------------------------------------------------------------------
  console.log('Capturing Patient Interface...');
  await loginUser(page, 'patient.john@example.com', 'PatientPassword123!');

  // 1.1 Patient Dashboard
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(DIR_PATIENT, '01_patient_dashboard_distinct.png'), fullPage: true });

  // 1.2 Patient Appointments
  await page.goto(`${BASE_URL}/appointments`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(DIR_PATIENT, '02_patient_appointments.png'), fullPage: true });

  // 1.3 Patient Pharmacy Orders
  await page.goto(`${BASE_URL}/pharmacy-orders`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(DIR_PATIENT, '03_patient_pharmacy_orders.png'), fullPage: true });

  // 1.4 Patient Medical Reports
  await page.goto(`${BASE_URL}/medical-reports`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(DIR_PATIENT, '04_patient_medical_reports.png'), fullPage: true });

  // 1.5 Mobile View (Fixed - No Crushing!)
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(DIR_PATIENT, '05_patient_mobile_dashboard_fixed.png') });

  // -------------------------------------------------------------------------
  // 2. DOCTOR INTERFACE
  // -------------------------------------------------------------------------
  console.log('Capturing Doctor Interface...');
  await page.setViewport({ width: 1440, height: 900 });
  await loginUser(page, 'medical.director@medintelcrm.com', 'MedDirector123!');

  // 2.1 Doctor Clinical Dashboard
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(DIR_DOCTOR, '01_doctor_clinical_dashboard.png'), fullPage: true });

  // 2.2 Doctor Appointments Queue
  await page.goto(`${BASE_URL}/appointments`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(DIR_DOCTOR, '02_doctor_appointments_queue.png'), fullPage: true });

  // 2.3 Doctor Medical Reports Review
  await page.goto(`${BASE_URL}/medical-reports`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(DIR_DOCTOR, '03_doctor_reports_review.png'), fullPage: true });

  // -------------------------------------------------------------------------
  // 3. PHARMACIST INTERFACE
  // -------------------------------------------------------------------------
  console.log('Capturing Pharmacist Interface...');
  await page.setViewport({ width: 1440, height: 900 });
  await loginUser(page, 'pharmacist.mike@example.com', 'PharmacistPassword123!');

  // 3.1 Pharmacist Dashboard
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(DIR_PHARM, '01_pharmacist_dispensing_dashboard.png'), fullPage: true });

  // 3.2 Pharmacist Prescription Order Queue
  await page.goto(`${BASE_URL}/pharmacy-orders`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(DIR_PHARM, '02_pharmacist_dispensing_queue.png'), fullPage: true });

  // 3.3 Pharmacist Retail Stock Inventory
  await page.goto(`${BASE_URL}/pharmacy-inventory`, { waitUntil: 'networkidle0' });
  await delay(1500);
  await page.screenshot({ path: path.join(DIR_PHARM, '03_pharmacist_retail_inventory.png'), fullPage: true });

  await browser.close();
  console.log('All updated role screenshots successfully captured!');
}

run().catch(console.error);

