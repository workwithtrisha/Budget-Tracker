import csv
import urllib.request
import json
import re

url = "https://docs.google.com/spreadsheets/d/120-i62r-k8SV4txWkdmy4-SkcbllXB4v_6SrlTPveso/export?format=csv&gid=2145345341"
req = urllib.request.Request(url)
with urllib.request.urlopen(req) as response:
    lines = [line.decode('utf-8') for line in response.readlines()]

reader = csv.reader(lines)
data = list(reader)

transactions = []
in_transactions = False

for i, row in enumerate(data):
    if len(row) > 3 and "DATE" in row[2] and "TRANSACTION" in row[3]:
        in_transactions = True
        continue
    
    if in_transactions:
        # Check if the row looks like a transaction
        if len(row) > 11 and row[2].strip() and row[3].strip():
            date_str = row[2].strip()
            type_str = row[3].strip().upper()
            category = row[6].strip()
            amount_str = row[10].strip()
            desc = row[11].strip() if len(row) > 11 else ""
            
            # basic date validation
            if re.match(r'\d{2} [A-Za-z]{3} \d{4}', date_str):
                # parse amount
                amt = amount_str.replace('"', '').replace(',', '').replace('Php', '').replace('-', '').strip()
                if amt == '' or amt == ' ':
                    amt = '0'
                elif '(' in amt and ')' in amt:
                    amt = '-' + amt.replace('(', '').replace(')', '')
                
                try:
                    amount = float(amt)
                    if amount > 0:
                        transactions.append({
                            "date": date_str,
                            "type": type_str,
                            "category": category,
                            "amount": amount,
                            "description": desc
                        })
                except ValueError:
                    pass

print(json.dumps(transactions, indent=2))
