# CSU Policy Explorer Chatbot

This project creates a chatbot interface for exploring California State University (CSU) policy documents. It combines public and private sources, processes documents into searchable chunks, and organizes them for use in retrieval-augmented generation.

---

## Overview

We built a system to collect, process, and prepare CSU policy documents for use in a chatbot interface. Users can explore policies through conversational queries.

---

## Sources

- **Public Policies**: Collected from [calstate.policystat.com](https://calstate.policystat.com/) report.csv
- **Private Policies**: Internal SDSU policies (CSU credentials required)

---

## Step-by-Step Process

### 1. Download Policies CSV

Begin with a CSV file called:

```
report.csv
```

which includes metadata and policy links.

---

### 2. Convert CSV to JSON

Run:

```
scrape_policy_texts_by_area.py
```

This script converts `report.csv` to a structured JSON file:

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
│   │   ├── CSU Emergency Assistance Grant Application Example.pdf
```

---

### 4. Chunking Policy Texts and PDFs

We split:

- `.txt` policy files into text chunks
- `.pdf` attachments into per-page or logical chunks

Each policy folder contains:

```
2021 – 2022 Emergency Grant Allocation/
├── 2021 – 2022 Emergency Grant Allocation.txt
├── chunk_001_og.txt
├── chunk_001_og_metadata.json
├── chunk_002_og.txt
├── chunk_002_og_metadata.json
├── CSU Emergency Assistance Grant Application Example/
│   ├── chunk_001.txt
│   ├── chunk_001_metadata.json
│   ├── chunk_002.txt
│   ├── chunk_002_metadata.json
```

---

### 5. PDF Processor System

#### `pdf_processor.py` – The Main Processing Engine

This comprehensive engine prepares raw PDFs for retrieval-augmented generation (RAG). It includes:

- **Downloads PDFs from S3**: Connects to your S3 bucket and pulls policy PDFs.
- **Intelligent Chapter Detection**: Detects structure based on:
  - Font size/style changes
  - Section/chapter keywords
  - Page breaks and headers
  - Table presence
- **Smart Chunking**: Splits PDFs into ~2000 character chunks with:
  - Paragraph boundary preservation
  - Overlapping context between chunks
  - Logical structure awareness
- **Table Extraction**: Extracts tables to clean, structured JSON.
- **Metadata Generation**: Creates detailed metadata for each chunk, including:
  - Source filename
  - Area/Section
  - Chapter headings
  - Page numbers
  - Character and token counts

**Output Structure:**

```
output/
├── Academic_and_Student_Affairs/
│   ├── subfolder/
│   │   ├── document_name/
│   │   │   ├── chunk_001.txt
│   │   │   ├── chunk_001_metadata.json
│   │   │   ├── chunk_002.txt
│   │   │   └── chunk_002_metadata.json
```

#### `run_pdf_processor.sh` – The Launcher Script

This shell script manages the setup and launch of the processing engine:

- **Environment Setup**: Activates or creates a Python virtual environment.
- **AWS Credential Verification**: Ensures S3 access is configured.
- **Dependency Installation**: Installs required Python packages.
- **Error Handling**: Provides clear messages for missing dependencies or misconfigurations.

**Usage:**

```bash
./run_pdf_processor.sh
```

You will be prompted for an S3 bucket name, and processing begins automatically.

---

### 6. Vector Index Creation

To support vector-based search and retrieval:

- We created multiple **S3 buckets**, which hold chunked text data and metadata.
- A script:
  - Downloads chunked data from S3
  - Embeds it using **Amazon Titan Embeddings V2**
  - Uploads the resulting vector embeddings into a separate S3 bucket: `policy-embeddings`

This index enables real-time semantic search for the chatbot.

---

## Project Output

- `calstate-policystat-list.json`: structured metadata
- `policystat_texts/`: organized policy documents
- `output/`: intelligently chunked PDFs with metadata
- All content is retrieval-ready for AI-powered chatbot queries

---

## Future Work

- Embed text chunks into vector database (e.g., Pinecone, Faiss, OpenSearch)
- Deploy chatbot interface with real-time query + document matching
- Securely integrate SDSU internal policies

---

## Authors

- Mentor: Noor Dhaliwhal  
- Savannah Bosley  
- Val Franco  
- Alvin Henry  
- Jasmine Ng  
- Nathan Theng

