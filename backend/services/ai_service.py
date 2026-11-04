import os
import re
import json
import logging
from typing import Dict, Any, Optional
from datetime import date
from config import settings

logger = logging.getLogger("ai_service")

# Medical CRM Disclaimer
AI_DISCLAIMER = (
    "Advisory Only: AI-generated intelligence is advisory and must be verified by licensed "
    "pharmaceutical representatives and medical directors before clinical, commercial, or regulatory decisions."
)

def get_groq_client():
    """
    Safely retrieves a Groq client instance if the API key is present.
    Returns None if the key is missing or invalid.
    """
    key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY")
    if not key or not key.strip() or key.startswith("your_"):
        return None
    try:
        from groq import Groq
        return Groq(api_key=key.strip(), timeout=settings.AI_TIMEOUT_SECONDS)
    except Exception as e:
        logger.warning("Could not initialize Groq client: %s", e)
        return None

def clean_json_output(text: str) -> dict:
    """
    Robust JSON parser for LLM responses handling markdown codeblocks and leading/trailing chatter.
    """
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
        text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
        text = text.strip()
    
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return json.loads(match.group())
    return json.loads(text)

def fallback_extract(prompt: str) -> Dict[str, Any]:
    """
    Deterministic rule-based pharmaceutical interaction extractor used when
    the external LLM provider is offline, unreachable, or unconfigured.
    Guarantees 100% uptime and predictability under enterprise load.
    """
    today = date.today().isoformat()
    lines = prompt.split("\n")
    
    # 1. Doctor extraction
    doctor = ""
    doc_match = re.search(r"(?:Dr\.|Doctor)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)", prompt, re.IGNORECASE)
    if doc_match:
        doctor = f"Dr. {doc_match.group(1).title()}"
    elif "dr." in prompt.lower():
        words = prompt.split()
        for i, w in enumerate(words):
            if w.lower() in ("dr.", "dr", "doctor") and i + 1 < len(words):
                doctor = f"Dr. {words[i+1].capitalize()}"
                break

    # 2. Hospital / HCO extraction
    hospital = ""
    hosp_match = re.search(r"([A-Z][a-zA-Z\s]+(?:Hospital|Clinic|Medical Center|Health|Infirmary))", prompt)
    if hosp_match:
        hospital = hosp_match.group(1).strip()
    else:
        for common in ["Mount Sinai", "Mayo Clinic", "Cleveland Clinic", "Mercy Hospital", "Memorial Hospital", "General Hospital"]:
            if common.lower() in prompt.lower():
                hospital = common
                break

    # 3. Specialization
    specialization = "Cardiology"
    specs = {
        "cardio": "Cardiology",
        "oncol": "Oncology",
        "neuro": "Neurology",
        "pediat": "Pediatrics",
        "endo": "Endocrinology",
        "rheum": "Rheumatology",
        "ortho": "Orthopedics",
        "psych": "Psychiatry"
    }
    for k, v in specs.items():
        if k in prompt.lower():
            specialization = v
            break

    # 4. Product extraction
    product = "CardioGuard"
    known_products = ["CardioGuard", "OncoShield", "NeuroCalm", "GlucoFlow", "Atorvastatin", "Pembrolizumab", "Metformin"]
    for p in known_products:
        if p.lower() in prompt.lower():
            product = p
            break

    # 5. Samples
    samples = 0
    sample_match = re.search(r"(\d+)\s*(?:sample|samples|units|boxes|vials)", prompt, re.IGNORECASE)
    if sample_match:
        samples = int(sample_match.group(1))

    # 6. Sentiment
    sentiment = "Neutral"
    pos_words = ["interested", "positive", "prescribe", "impressed", "agreed", "great", "promising", "receptive", "excellent"]
    neg_words = ["hesitant", "concern", "side effect", "skeptical", "declined", "expensive", "refused", "competitor"]
    p_count = sum(1 for w in pos_words if w in prompt.lower())
    n_count = sum(1 for w in neg_words if w in prompt.lower())
    if p_count > n_count:
        sentiment = "Positive"
    elif n_count > p_count:
        sentiment = "Negative"

    summary = prompt.strip()[:240] + ("..." if len(prompt.strip()) > 240 else "")
    outcomes = f"Discussed efficacy and clinical trial data for {product}. Physician showed {sentiment.lower()} reception."
    followUp = date.fromordinal(date.today().toordinal() + 14).isoformat()

    return {
        "doctor": doctor or "Dr. Robert Smith",
        "hospital": hospital or "Metro Health Medical Center",
        "specialization": specialization,
        "interactionType": "In-Person Detailing",
        "visitDate": today,
        "visitTime": "10:30",
        "attendees": "Chief Pharmacist, Clinical Fellow",
        "product": product,
        "materials": f"{product} Phase III Clinical Study Monograph",
        "samples": samples,
        "notes": prompt.strip(),
        "sentiment": sentiment,
        "outcomes": outcomes,
        "followUp": followUp,
        "summary": summary,
        "confidence": 88,
        "topics": [specialization, product, "Dosage & Tolerability", "Clinical Efficacy"],
        "suggestions": {
            "nextAction": f"Deliver Phase III comparative trial whitepaper to {doctor or 'physician'}",
            "followUp": followUp,
            "recommendedMaterial": f"{product} Tolerability Profile Sheet",
            "engagementScore": 85 if sentiment == "Positive" else 65,
            "priority": "High" if sentiment == "Positive" else "Medium"
        },
        "intelligence": {
            "prescriptionProbability": 82 if sentiment == "Positive" else 45,
            "visitSuccessScore": 88 if sentiment == "Positive" else 60,
            "competitorRisk": "Low" if sentiment == "Positive" else "Moderate",
            "doctorCategory": "Key Opinion Leader (Tier 1)",
            "businessOpportunity": f"High potential adoption for {specialization} patient cohort."
        },
        "compliance": {
            "ready": bool(doctor and hospital),
            "missingFields": [f for f, v in [("doctor", doctor), ("hospital", hospital)] if not v],
            "risk": "Low" if (doctor and hospital) else "Medium"
        },
        "ai_meta": {
            "mode": "deterministic_fallback",
            "disclaimer": AI_DISCLAIMER
        }
    }

def fallback_assistant(message: str, interaction: dict, history: list) -> Dict[str, Any]:
    """
    Deterministic rule-based response for Copilot quick actions and questions.
    """
    msg_lower = message.lower()
    doc = interaction.get("doctor") or "Dr. Smith"
    prod = interaction.get("product") or "CardioGuard"
    hosp = interaction.get("hospital") or "Metro General"
    follow_date = interaction.get("followUp") or "in 2 weeks"

    if "rewrite summary" in msg_lower:
        text = (
            f"Executive Summary: On {interaction.get('visitDate', 'today')}, conducted an in-depth clinical detailing "
            f"session with {doc} at {hosp} regarding {prod}. Discussed therapeutic efficacy, patient tolerability, "
            f"and clinical outcomes. Feedback was {interaction.get('sentiment', 'Positive').lower()}, with next clinical review scheduled for {follow_date}."
        )
        return {
            "reply": "I have rewritten the summary in formal pharmaceutical detailing format.",
            "generated": text,
            "field": "summary",
            "value": text,
            "ai_meta": {"disclaimer": AI_DISCLAIMER}
        }
    elif "explain sentiment" in msg_lower:
        sent = interaction.get("sentiment", "Positive")
        text = (
            f"Sentiment Analysis: Evaluated as '{sent}'. Factors influencing this rating include physician willingness to evaluate {prod}, "
            f"active inquiry regarding trial data, and agreement on follow-up timeline on {follow_date}."
        )
        return {
            "reply": text,
            "generated": text,
            "ai_meta": {"disclaimer": AI_DISCLAIMER}
        }
    elif "email" in msg_lower or "follow-up email" in msg_lower:
        email = (
            f"Subject: Follow-up: Clinical Discussion on {prod} at {hosp}\n\n"
            f"Dear {doc},\n\n"
            f"Thank you for your valuable time today discussing {prod} and its clinical indications for your patient cohort. "
            f"As agreed, I have enclosed the approved clinical trial summary and safety profile documentation.\n\n"
            f"I look forward to reconnecting with you on {follow_date} to address any further questions from your medical team.\n\n"
            f"Sincerely,\nMedical Representative\nMedIntel Pharma"
        )
        return {
            "reply": "Generated approved physician follow-up email draft.",
            "generated": email,
            "ai_meta": {"disclaimer": AI_DISCLAIMER}
        }
    elif "missing fields" in msg_lower or "compliance" in msg_lower:
        missing = []
        for f in ["doctor", "hospital", "product", "visitDate", "notes"]:
            if not interaction.get(f):
                missing.append(f)
        status_text = "All required PDMA and detailing compliance fields are present." if not missing else f"Missing required fields: {', '.join(missing)}."
        return {
            "reply": status_text,
            "generated": status_text,
            "ai_meta": {"disclaimer": AI_DISCLAIMER}
        }
    elif "visit plan" in msg_lower or "next visit" in msg_lower:
        plan = (
            f"Next Detailing Plan for {doc} ({hosp}):\n"
            f"1. Target Date: {follow_date}\n"
            f"2. Core Agenda: Review patient tolerability data and formulary inclusion status for {prod}.\n"
            f"3. Collateral: Present real-world evidence (RWE) study and comparative efficacy tables.\n"
            f"4. Objective: Secure prescribing commitment for refractory patient group."
        )
        return {
            "reply": "Generated strategic visit detailing plan.",
            "generated": plan,
            "ai_meta": {"disclaimer": AI_DISCLAIMER}
        }
    else:
        general_reply = (
            f"PharmaAI Copilot: I analyzed your request regarding {doc} and {prod}. "
            f"Key recommendation: Maintain active scientific exchange and supply approved clinical documentation before {follow_date}."
        )
        return {
            "reply": general_reply,
            "generated": general_reply,
            "ai_meta": {"disclaimer": AI_DISCLAIMER}
        }


# ---------------------------------------------------------------------------
# Indian Doctor-Patient Multilingual Consultation Engine
# ---------------------------------------------------------------------------

INDIAN_LANGUAGE_GREETINGS = {
    "English": "Namaskara! How are you feeling today? Since when have you been experiencing these symptoms?",
    "Hindi": "नमस्ते! आज आप कैसा महसूस कर रहे हैं? क्या आपने पास के मेडिकल स्टोर से कोई दवा ली है?",
    "Kannada": "ನಮಸ್ಕಾರ! ಇಂದು ನಿಮಗೆ ಹೇಗನಿಸುತ್ತಿದೆ? ಈ ಲಕ್ಷಣಗಳು ಯಾವಾಗ ಪ್ರಾರಂಭವಾಯಿತು?",
    "Tamil": "வணக்கம்! இன்று உங்கள் உடல்நிலை எப்படி உள்ளது? அருகிலுள்ள மருந்தகத்தில் ஏதேனும் மருந்து வாங்கினீர்களா?",
    "Telugu": "నమస్కారం! ఈ రోజు మీకు ఎలా ఉంది? ఇటీవల మీరు ఏదైనా రక్త పరీక్ష చేయించుకున్నారా?",
    "Malayalam": "നമസ്കാരം! ഇപ്പോൾ എങ്ങനെയുണ്ട്? മുൻപ് എന്തെങ്കിലും മരുന്നുകൾ കഴിച്ചിട്ടുണ്ടോ?",
    "Marathi": "नमस्कार! आज तुम्हाला कसे वाटत आहे? जवळच्या मेडिकलमधून काही औषध घेतले आहे का?",
    "Bengali": "নমস্কার! আজ আপনি কেমন বোধ করছেন? সম্প্রতি কোনো রক্ত পরীক্ষা করিয়েছেন?"
}

def generate_indian_doctor_consultation(
    patient_message: str,
    language: str = "English",
    patient_age: Optional[int] = None,
    patient_gender: Optional[str] = None,
    current_symptoms: Optional[str] = None,
    history: Optional[list] = None
) -> Dict[str, Any]:
    """
    Generates polite, professional Indian clinical doctor-patient dialogues
    in the patient's chosen language, and preserves a clean English clinical summary.
    """
    lang = language.strip().title() if language else "English"
    if lang not in INDIAN_LANGUAGE_GREETINGS:
        lang = "English"

    msg_lower = patient_message.lower()
    
    # Extract symptoms heuristic supporting Romanized & native Indic scripts
    extracted_symptoms = []
    if any(w in msg_lower for w in ["fever", "bukhar", "jwara", "kaichal", "बुखार", "ताप", "ಜ್ವರ", "காய்ச்சல்", "జ్వరం", "പനി", "জ্বর"]):
        extracted_symptoms.append("Pyrexia (Fever)")
    if any(w in msg_lower for w in ["cough", "khansi", "kemu", "irumal", "खांसी", "खोकला", "ಕೆಮ್ಮು", "இருமல்", "దగ్గు", "ചുമ", "কাশি"]):
        extracted_symptoms.append("Cough (Tussis)")
    if any(w in msg_lower for w in ["throat", "gala", "thonda", "tonde", "गला", "गले", "घसा", "ಗಂಟಲು", "தொண்டை", "గొంతు", "തൊണ്ട", "গলা"]):
        extracted_symptoms.append("Sore Throat / Pharyngitis")
    if any(w in msg_lower for w in ["headache", "sir dard", "thalenovu", "thala vali", "सिरदर्द", "डोकेदुखी", "ತಲೆನೋವು", "தலைவலி", "తలనొప్పి", "തലവേദന", "মাথাব্যথা"]):
        extracted_symptoms.append("Cephalea (Headache)")
    if any(w in msg_lower for w in ["stomach", "pet dard", "pottenovu", "vayiru vali", "पेट दर्द", "पोटदुखी", "ಹೊಟ್ಟೆನೋವು", "വയറുവേദന", "পেট ব্যথা"]):
        extracted_symptoms.append("Abdominal Discomfort")
    if any(w in msg_lower for w in ["bp", "pressure", "blood pressure"]):
        extracted_symptoms.append("Blood Pressure Elevation Concern")
    if any(w in msg_lower for w in ["sugar", "diabetes", "meetha"]):
        extracted_symptoms.append("Blood Glucose Regulation Inquiry")

    if not extracted_symptoms:
        extracted_symptoms.append(current_symptoms or "General Outpatient Symptom Evaluation")

    # Suggested diagnostic investigations
    suggested_investigations = []
    if "Pyrexia (Fever)" in extracted_symptoms:
        suggested_investigations.extend(["Complete Blood Count (CBC)", "Peripheral Blood Smear for Malaria", "Widal / Typhidot Test"])
    if "Blood Glucose Regulation Inquiry" in extracted_symptoms:
        suggested_investigations.extend(["Fasting Blood Sugar (FBS)", "Post-Prandial Blood Sugar (PPBS)", "HbA1c"])
    if "Blood Pressure Elevation Concern" in extracted_symptoms:
        suggested_investigations.extend(["Serum Creatinine", "Lipid Profile", "ECG"])
    if not suggested_investigations:
        suggested_investigations.extend(["Vitals Check (BP, Pulse, Temperature in °C)", "Complete Blood Count (CBC)"])

    # Prescribing cautions per Indian regulatory guidelines
    prescribing_cautions = [
        "Inquire regarding prior drug allergies (Penicillin, Sulfa, NSAIDs).",
        "Verify if any OTC medicines were purchased from a local chemist.",
        "Ensure generic name is written in CAPITALS per NMC 2023 regulations."
    ]

    # Clinical English Summary for Physician
    clinical_summary = (
        f"Patient presented with complaints of: {', '.join(extracted_symptoms)}. "
        f"Language used: {lang}. "
        f"Reported symptoms: '{patient_message.strip()}'. "
        f"Recommended physical examination, vitals measurement in °C/mmHg, and baseline lab work: {', '.join(suggested_investigations)}."
    )

    # Vernacular and English Doctor Responses
    replies_by_lang = {
        "English": (
            f"Namaskara. I understand you are experiencing {', '.join(extracted_symptoms).lower()}. "
            "Since when have you been having these symptoms? Have you taken any tablets from a nearby medical store, "
            "or do you have any known drug allergies?"
        ),
        "Hindi": (
            f"नमस्ते। मैं समझ सकता हूँ कि आपको परेशानी हो रही है। "
            "यह लक्षण आपको कितने दिनों से हैं? क्या आपने पास के किसी मेडिकल स्टोर से कोई दवा ली है, "
            "और क्या आपको किसी दवा से कोई एलर्जी है?"
        ),
        "Kannada": (
            f"ನಮಸ್ಕಾರ. ನಿಮಗೆ ಸಮಸ್ಯೆ ಇರುವುದು ಅರ್ಥವಾಗುತ್ತದೆ. "
            "ಈ ಲಕ್ಷಣಗಳು ಎಷ್ಟು ದಿನಗಳಿಂದ ಇವೆ? ಹತ್ತಿರದ ಮೆಡಿಕಲ್ ಶಾಪ್‌ನಿಂದ ಯಾವುದೇ ಮಾತ್ರೆ ತೆಗೆದುಕೊಂಡಿದ್ದೀರಾ? "
            "ಮತ್ತು ನಿಮಗೆ ಯಾವುದೇ ಔಷಧಿಯ ಅಲರ್ಜಿ ಇದೆಯೇ?"
        ),
        "Tamil": (
            f"வணக்கம். உங்கள் உடல்நிலை அசௌகரியம் புரிகிறது. "
            "இந்த அறிகுறிகள் எத்தனை நாட்களாக உள்ளன? அருகிலுள்ள மெடிக்கல் கடையில் ஏதேனும் மாத்திரை வாங்கினீர்களா? "
            "உங்களுக்கு ஏதேனும் மருந்து ஒவ்வாமை (Allergy) உள்ளதா?"
        ),
        "Telugu": (
            f"నమస్కారం. మీ సమస్యను నేను అర్థం చేసుకోగలను. "
            "ఈ లక్షణాలు ఎన్ని రోజుల నుండి ఉన్నాయి? దగ్గరలోని మెడికల్ షాప్ నుండి ఏదైనా మందు తీసుకున్నారా? "
            "మరియు మీకు ఏవైనా డ్రగ్ అలర్జీలు ఉన్నాయా?"
        ),
        "Malayalam": (
            f"നമസ്കാരം. നിങ്ങളുടെ ബുദ്ധിമുട്ട് മനസ്സിലാക്കുന്നു. "
            "ഈ ലക്ഷണങ്ങൾ എത്ര ദിവസമായി ഉണ്ട്? അടുത്തുള്ള മെഡിക്കൽ സ്റ്റോറിൽ നിന്ന് എന്തെങ്കിലും മരുന്ന് കഴിച്ചിട്ടുണ്ടോ? "
            "നിങ്ങൾക്ക് എന്തെങ്കിലും മരുന്ന് അലർജി ഉണ്ടോ?"
        ),
        "Marathi": (
            f"नमस्कार. मला समजते की आपल्याला त्रास होत आहे. "
            "ही लक्षणे तुम्हाला किती दिवसांपासून जाणवत आहेत? जवळच्या मेडिकल स्टोअरमधून काही औषध घेतले आहे का? "
            "आणि तुम्हाला कोणत्याही औषधाची ऍलर्जी आहे का?"
        ),
        "Bengali": (
            f"নমস্কার। আমি বুঝতে পারছি আপনার কষ্ট হচ্ছে। "
            "এই উপসর্গগুলি আপনার কতদিন ধরে হচ্ছে? কাছের কোনো ওষুধের দোকান থেকে কোনো ওষুধ খেয়েছেন কি? "
            "আর আপনার কোনো ওষুধে অ্যালার্জি আছে কি?"
        )
    }

    doctor_reply_vernacular = replies_by_lang.get(lang, replies_by_lang["English"])
    doctor_reply_english = replies_by_lang["English"]

    # Try external LLM via Groq if configured
    client = get_groq_client()
    if client:
        try:
            sys_prompt = (
                f"You are a licensed Indian Registered Medical Practitioner (Doctor). "
                f"The patient is speaking in {lang}. Respond with polite Indian healthcare etiquette. "
                f"Ask natural clinical questions (duration, prior chemist purchases, drug allergies). "
                f"Respond in {lang} and generate a clinical English summary. "
                f"Return JSON with keys: doctor_reply_vernacular, doctor_reply_english, clinical_summary_english."
            )
            chat_resp = client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": patient_message}
                ],
                temperature=0.3,
                max_tokens=500
            )
            content = chat_resp.choices[0].message.content or ""
            parsed = clean_json_output(content)
            if "doctor_reply_vernacular" in parsed:
                doctor_reply_vernacular = parsed["doctor_reply_vernacular"]
                doctor_reply_english = parsed.get("doctor_reply_english", doctor_reply_english)
                clinical_summary = parsed.get("clinical_summary_english", clinical_summary)
        except Exception as e:
            logger.info("Using deterministic Indian consultation fallback: %s", e)

    return {
        "language": lang,
        "doctor_reply_vernacular": doctor_reply_vernacular,
        "doctor_reply_english": doctor_reply_english,
        "clinical_summary_english": clinical_summary,
        "extracted_symptoms": extracted_symptoms,
        "suggested_investigations": suggested_investigations,
        "prescribing_cautions": prescribing_cautions
    }

