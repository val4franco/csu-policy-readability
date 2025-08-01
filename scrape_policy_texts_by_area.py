import os
import json
import time
import re
import requests
from urllib.parse import urljoin, urlparse


from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Load JSON data
with open("short-clastate-policystat-list.json", "r", encoding="utf-8") as f:
    policies = json.load(f)

# Target folder
base_dir = "output_test"
os.makedirs(base_dir, exist_ok=True)

# Sanitize folder and file names
def safe_filename(name):
    name = re.sub(r'[\\/*?:"<>|]', "", name)  # Remove illegal characters
    return name.strip().replace("\n", " ")[:150]

# Download attachment files
def download_attachments(driver, policy_dir):
    try:
        # Wait for page to load completely
        time.sleep(2)
        
        # Look for attachment links with broader selectors
        selectors = [
            "a[href*='.pdf']",
            "a[href*='.doc']", 
            "a[href*='.xls']",
            "a[href*='attachment']",
            "a[href*='download']",
            ".attachments a",
            "[class*='attachment'] a",
            "a[title*='attachment']",
            "a[title*='download']"
        ]
        
        for selector in selectors:
            links = driver.find_elements(By.CSS_SELECTOR, selector)
            for link in links:
                href = link.get_attribute('href')
                link_text = link.text.strip()
                
                if href:
                    filename = os.path.basename(urlparse(href).path)
                    if not filename and link_text:
                        filename = safe_filename(link_text) + '.pdf'
                    elif not filename:
                        filename = 'attachment.pdf'
                    
                    try:
                        response = requests.get(href, timeout=30)
                        if response.status_code == 200:
                            filepath = os.path.join(policy_dir, safe_filename(filename))
                            with open(filepath, 'wb') as f:
                                f.write(response.content)
                            print(f"📎 Downloaded: {filename}")
                    except Exception as e:
                        print(f"❌ Failed to download {filename}: {e}")
                        
    except Exception as e:
        print(f"❌ Attachment download error: {e}")

# Scrape policy text using Selenium
def scrape_policy_text_selenium(url, policy_dir):
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    driver = webdriver.Chrome(options=options)

    try:
        driver.get(url)

        # Download attachments
        download_attachments(driver, policy_dir)

        # Try multiple selectors to locate main content
        selectors = [
            "div.policy-body",
            "div.section.policy",
            "main",
        ]

        for selector in selectors:
            try:
                content = WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                )
                text = content.text.strip()
                if len(text) > 50:
                    return clean_text(text)
            except Exception:
                continue

        raise Exception("Policy content not found on page.")
    finally:
        driver.quit()

# Clean text by removing unwanted elements
def clean_text(text):
    # Remove unwanted phrases
    unwanted = [
        "Status, Active",
        "Active", 
        "Info",
        "Print",
        "Share"
    ]
    
    for phrase in unwanted:
        text = text.replace(phrase, "")
    
    # Keep content up to and including Authority section, remove everything after
    authority_end_pattern = r'(Authority.*?)(?=All Revision Dates|Attachments|Approval Signatures|Changes)'
    match = re.search(authority_end_pattern, text, re.DOTALL | re.IGNORECASE)
    if match:
        text = text[:match.end()]
    
    # Extract table of contents headings
    toc_pattern = r'Table of Contents.*?(?=\n\n|Policy|$)'
    toc_match = re.search(toc_pattern, text, re.DOTALL | re.IGNORECASE)
    toc_headings = set()
    
    if toc_match:
        toc_text = toc_match.group()
        # Extract headings from TOC (lines that don't start with numbers/bullets)
        for line in toc_text.split('\n'):
            line = line.strip()
            if line and not line.startswith(('Table of Contents', '•', '-', '1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '0.')):
                toc_headings.add(line)
    
    # Add newlines before TOC headings
    lines = text.split('\n')
    formatted_lines = []
    
    for i, line in enumerate(lines):
        line = line.strip()
        if line:
            # Check if this line matches a TOC heading
            if line in toc_headings and formatted_lines and i > 0:
                formatted_lines.append('')  # Add blank line before TOC heading
            
            formatted_lines.append(line)
    
    text = '\n'.join(formatted_lines)
    text = re.sub(r'\n\s*\n\s*\n', '\n\n', text)  # Remove triple+ newlines
    text = text.strip()
    
    return text

# Iterate through each policy
for policy in policies:
    title = policy.get("Title")
    area = policy.get("Area")
    url = policy.get("URL")

    if not title or not area or not url:
        print(f"⚠️ Skipping incomplete entry: {policy}")
        continue

    area_dir = os.path.join(base_dir, safe_filename(area))
    policy_dir = os.path.join(area_dir, safe_filename(title))
    os.makedirs(policy_dir, exist_ok=True)

    txt_path = os.path.join(policy_dir, f"{safe_filename(title)}.txt")

    if os.path.exists(txt_path):
        print(f"✅ Skipping (already exists): {area} / {title}")
        continue

    print(f"⏳ Scraping: {area} / {title}")
    try:
        text = scrape_policy_text_selenium(url, policy_dir)
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"✅ Saved: {txt_path}")
        time.sleep(1)
    except Exception as e:
        print(f"❌ Failed: {title} — {e}")
