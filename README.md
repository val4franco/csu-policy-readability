# CSU Policy Explorer Chatbot

This project creates a chatbot interface for exploring California State University (CSU) policy documents. It combines public and private sources, processes documents into searchable chunks, and organizes them for use in retrieval-augmented generation.

---

## 📚 Overview

We built a system to collect, process, and prepare CSU policy documents for use in a chatbot interface. Users can explore policies through conversational queries.

---

## 🔍 Sources

- **Public Policies**: Collected from [calstate.policystat.com](https://calstate.policystat.com/)
- **Private Policies**: Internal SDSU policies (login required)

---

## 🧾 Step-by-Step Process

### 1. Download Policies CSV

We started with a CSV file called:

```
report.csv
```

which includes metadata and policy links.

---

### 2. Convert CSV to JSON

We ran:

```
scrape_policy_texts_by_area.py
```

This script converted `report.csv` to a structured JSON file:

```
calstate-policystat-list.json
```

Each entry looks like:

```json
{
  "PolicyStat Id": 10719972,
  "Title": "2021 – 2022 Emergency Grant Allocation",
  "URL": "https://calstate.policystat.com/policy/10719972/",
  "Area": "Academic and Student Affairs",
  "Owner": "Grommo, April: Asst VC, Enroll Mgmt Srvcs",
  "Last Approved": "2021-12-07",
  "Has Attachments": "Yes",
  "Restricted": "Public"
}
```

---

### 3. Web Scraping with Selenium

We used `Selenium` to:

- Scrape the main policy text
- Download attachments (PDFs)
- Organize content by **Area** and **Title**

Directory structure:

```
policystat_texts/
├── Academic and Student Affairs/
│   ├── 2021 – 2022 Emergency Grant Allocation/
│   │   ├── 2021 – 2022 Emergency Grant Allocation.txt
│   │   └── attachments/
│   │       └── CSU Emergency Assistance Grant Application Example.pdf
```

---

### 4. Chunking Policy Texts and PDFs

We split:

- `.txt` policy files into text chunks
- `.pdf` attachments into per-page or logical chunks

Each folder contains:

```
├── chunks/
│   ├── chunk_001.txt
│   ├── chunk_002.txt
├── attachments/
│   ├── [original PDFs]
```

---

## ✅ Project Output

- `calstate-policystat-list.json`: structured metadata
- `policystat_texts/`: organized policy documents
- All text and PDFs split into retrieval-ready chunks

---

## 💬 Future Work

- Embed text chunks using vector database
- Deploy chatbot with LLM retrieval backend (e.g., OpenAI, Claude, etc.)
- Add SDSU internal policies once integrated securely

---

## 🧠 Authors

- Savannah Bosley and collaborators
