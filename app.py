from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
load_dotenv()
import os
import pickle
import requests
import traceback
import pandas as pd
import re
import difflib
import logging

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

app = Flask(__name__)

APP_ID = os.getenv("APP_ID")
APP_KEY = os.getenv("APP_KEY")

HEADERS = {
    "App-Id": APP_ID,
    "App-Key": APP_KEY,
    "Content-Type": "application/json"
}

UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


with open("XGBoost Disease Model.pkl", "rb") as f:
    model = pickle.load(f)

with open("XGBoost Label Encoder.pkl", "rb") as f:
    le = pickle.load(f)


def normalize_text(text):
    text = text.lower()
    text = re.sub(r'[+/\\-]', ' ', text)   
    text = re.sub(r'\s+', ' ', text)       
    text = re.sub(r'[^a-z0-9 ]', '', text) 
    return text.strip()


med_df = pd.read_csv("medicines.csv")


for col in ['short_composition1', 'short_composition2']:
    if col not in med_df.columns:
        med_df[col] = ""
    else:
        med_df[col] = med_df[col].fillna("")


if 'price(â‚¹)' in med_df.columns:
    med_df.rename(columns={'price(â‚¹)': 'price_inr'}, inplace=True)
elif 'price(₹)' in med_df.columns:
    med_df.rename(columns={'price(₹)': 'price_inr'}, inplace=True)
else:
    med_df['price_inr'] = None


med_df['normalized_name'] = med_df['name'].astype(str).apply(normalize_text)


def infermedica_parse(text, age):
    url = "https://api.infermedica.com/v3/parse"
    payload = {"text": text, "age": {"value": int(age)}}
    try:
        response = requests.post(url, headers=HEADERS, json=payload)
        if response.ok:
            return response.json().get("mentions", [])
        else:
            return []
    except requests.exceptions.RequestException as e:
        print(f"Error in parsing symptoms: {e}")
        return []

def get_condition_details(condition_id, age=30):
    url = f"https://api.infermedica.com/v3/conditions/{condition_id}?age.value={age}"
    try:
        response = requests.get(url, headers=HEADERS)
        if response.ok:
            data = response.json()
            return {
                "name": data.get("name", ""),
                "common_name": data.get("common_name", ""),
                "sex_filter": data.get("sex_filter", ""),
                "categories": data.get("categories", []),
                "prevalence": data.get("prevalence", ""),
                "acuteness": data.get("acuteness", ""),
                "severity": data.get("severity", ""),
                "triage_level": data.get("triage_level", ""),
                "hint": data.get("extras", {}).get("hint", "")
            }
        else:
            print(f"❌ Error fetching condition details: {response.status_code} for ID: {condition_id}")
            return {}
    except Exception as e:
        print(f"❌ Exception in get_condition_details: {e}")
        return {}

def infermedica_diagnosis(mentions, age, sex):
    url = "https://api.infermedica.com/v3/diagnosis"
    evidence = [{"id": m["id"], "choice_id": m["choice_id"]} for m in mentions]
    payload = {"sex": sex, "age": {"value": age}, "evidence": evidence}
    try:
        response = requests.post(url, headers=HEADERS, json=payload)
        if response.ok:
            diagnosis = response.json()
            conditions = diagnosis.get("conditions", [])
            results = []
            for condition in conditions:
                condition_id = condition.get("id")
                if not condition_id:
                    continue
                details = get_condition_details(condition_id, age)
                if details:
                    details["name"] = condition.get("name", "Unknown")
                    details["probability"] = condition.get("probability", 0)
                    results.append(details)
            return results
        else:
            print(f"❌ Diagnosis request failed: {response.status_code}")
            return []
    except Exception as e:
        print(f"🔥 infermedica_diagnosis error: {e}")
        traceback.print_exc()
        return []


@app.route('/')
def home():
    return render_template('final_index.html')

@app.route('/diagnosis')
def diagnosis_page():
    return render_template('diagnosis.html')

@app.route('/medibuddy')
def medibuddy():
    return render_template('medibuddy.html')

@app.route('/diagnose', methods=['POST'])
def diagnose():
    data = request.get_json()
    symptoms = data.get("symptoms", [])
    age = data.get("age", 30)
    sex = data.get("sex", "male")

    if not symptoms:
        return jsonify({"error": "No symptoms provided."}), 400

    try:
        mentions = infermedica_parse(" ".join(symptoms), age)
        if not mentions:
            return jsonify({"error": "Unable to process symptoms."}), 400

        ai_results = infermedica_diagnosis(mentions, age, sex)

        if ai_results:
            return jsonify({"source": "infermedica", "results": ai_results})

        return jsonify({"message": "No match found."}), 404
    except Exception:
        return jsonify({"error": "Diagnosis failed."}), 500

@app.route("/upload", methods=["POST"])
def upload():
    if 'report_file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['report_file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(filepath)

    try:
        from report_analyzer import analyze_report
        result = analyze_report(filepath)
        return jsonify({"summary": result})
    except Exception:
        return jsonify({"error": "Error analyzing report"}), 500


@app.route("/search-medicine")
def search_medicine():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify([])

    normalized_query = normalize_text(query)
    matches = med_df[med_df['normalized_name'].str.contains(normalized_query, na=False)].head(10)

    
    if matches.empty:
        all_names = med_df['normalized_name'].dropna().tolist()
        close_matches = difflib.get_close_matches(normalized_query, all_names, n=10, cutoff=0.6)
        if close_matches:
            matches = med_df[med_df['normalized_name'].isin(close_matches)]

    suggestions = matches['name'].drop_duplicates().tolist()
    return jsonify(suggestions)

@app.route("/get-medicine-info")
def get_medicine_info():
    name = request.args.get("name", "").strip()
    if not name:
        return jsonify({"error": "No medicine name provided"}), 400

    normalized_name = normalize_text(name)
    matches = med_df[med_df['normalized_name'].str.contains(normalized_name, na=False)]

    
    if matches.empty:
        all_names = med_df['normalized_name'].dropna().tolist()
        close_matches = difflib.get_close_matches(normalized_name, all_names, n=3, cutoff=0.6)
        if close_matches:
            matches = med_df[med_df['normalized_name'].isin(close_matches)]

    if matches.empty:
        return jsonify({"error": f"Medicine '{name}' not found"}), 404

    med_info = matches.iloc[0].to_dict()
    med_info.pop('normalized_name', None) 

   
    if 'price_inr' in med_info:
        med_info['price'] = med_info.pop('price_inr')
    elif 'price(₹)' in med_info:
        med_info['price'] = med_info.pop('price(₹)')
    elif 'price(â‚¹)' in med_info:
        med_info['price'] = med_info.pop('price(â‚¹)')
    else:
        med_info['price'] = None

    return jsonify(med_info)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 8080)))

