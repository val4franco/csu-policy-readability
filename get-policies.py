import pandas as pd
import json

# File paths
csv_path = "report.csv"
json_path = "test.json"

# Read UTF-16 tab-separated CSV
df = pd.read_csv(csv_path, encoding="utf-16", sep="\t")

# Clean "Codes" field
if "Codes" in df.columns:
    df["Codes"] = df["Codes"].astype(str).apply(lambda x: x.strip().strip('"').replace('\\"', '"'))

# Convert to list of dictionaries
data = df.to_dict(orient="records")

# Save to JSON
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

# Print summary
print(f"Saved {len(data)} policies to {json_path}")
