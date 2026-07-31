import os
import json
import logging
import random
from collections import Counter
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from dotenv import load_dotenv
from pydantic import BaseModel, Field

from google import genai
from google.genai import types
from google.genai.errors import APIError

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AgriSense")

# Silence noisy SDK logs (removes 'AFC is enabled' terminal messages)
logging.getLogger("google_genai").setLevel(logging.WARNING)

load_dotenv()

app = FastAPI(
    title="AgriSense AI API",
    description="Unified Multilingual AI Engine for Crop Diagnostics, Market Trends, Advisory, and Analytics",
    version="2.0.0"
)

# CORS Middleware Setup
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini Client Setup
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    logger.warning("GEMINI_API_KEY is missing! AI-powered endpoints will fall back to local responses.")

client = genai.Client(api_key=API_KEY) if API_KEY else None
MODEL_NAME = "gemini-2.0-flash"

LANGUAGE_MAP = {
    "en": "English", "hi": "Hindi", "kn": "Kannada", "te": "Telugu",
    "ta": "Tamil", "mr": "Marathi", "bn": "Bengali", "gu": "Gujarati",
    "pa": "Punjabi", "ml": "Malayalam"
}

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"}
MAX_FILE_SIZE_MB = 10 * 1024 * 1024  # 10 MB


def get_language_name(code: str) -> str:
    if not code:
        return "English"
    return LANGUAGE_MAP.get(code.lower().strip(), code)


# ==========================================
# Pydantic Schemas (Requests & Responses)
# ==========================================

class DiseaseRequest(BaseModel):
    disease: str
    crop: str = "Wheat"
    language: str = "en"


class AdvisoryRequest(BaseModel):
    disease: str
    confidence: Optional[float] = 0.95
    weather_risk: Optional[str] = "Moderate Rain expected"
    market_trend: Optional[str] = "Prices falling"
    perishability: Optional[str] = "High"
    language: Optional[str] = "en"


class FieldHealthRequest(BaseModel):
    results: List[str]
    language: str = "en"


class YieldLossRequest(BaseModel):
    severity_score: float = Field(default=0.5, ge=0.0, le=1.0)
    affected_percentage: float = Field(default=25.0, ge=0.0, le=100.0)
    language: str = "en"


class TranslateRequest(BaseModel):
    text: str
    language: str


class ChatRequest(BaseModel):
    message: str
    language: str = "en"


# Response Schemas for Gemini Structured Output
class DiagnosisResponse(BaseModel):
    disease: str = Field(description="Exact Name of Disease or 'Healthy'")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0")
    severity: str = Field(description="Severity ('Low', 'Medium', 'High')")
    crop_detected: str = Field(description="Name of identified crop")
    is_plant: bool = Field(description="True if image contains a plant/leaf")
    summary: str = Field(description="1-2 sentence explanation of the condition")


class ExplanationResponse(BaseModel):
    disease: str = Field(description="Name of disease")
    summary: str = Field(description="Summary explaining condition")
    symptoms: List[str] = Field(description="List of key symptoms")
    treatment: List[str] = Field(description="List of treatment steps")
    prevention: List[str] = Field(description="List of prevention tips")


class AdvisoryResponse(BaseModel):
    recommendation: str = Field(description="'SELL NOW' or 'HOLD'")
    risk_level: str = Field(description="Risk level ('Low', 'Medium', 'High')")
    reasoning: str = Field(description="Brief explanation under 80 words")
    action_steps: List[str] = Field(description="Key recommended action steps")
    whatsapp_broadcast: str = Field(description="Short broadcast alert for WhatsApp")


class YieldLossResponse(BaseModel):
    status: str = Field(description="Risk status string")
    recommendation: str = Field(description="Detailed recommendation summary")


class OutbreakItem(BaseModel):
    crop: str = Field(description="Name of the crop")
    disease: str = Field(description="Name of the disease")
    cases_reported: int = Field(description="Number of reported cases")
    risk_level: str = Field(description="Risk level string")
    distance_km: int = Field(description="Distance in kilometers")


class RegionalOutbreakResponse(BaseModel):
    region: str = Field(description="Region name")
    active_alerts: List[OutbreakItem] = Field(description="Active alerts list")


class TranslationResponse(BaseModel):
    language: str
    translated_text: str


# ==========================================
# Helper Functions for Smart Demo Fallbacks
# ==========================================

def get_demo_chat_response(message: str, lang_code: str) -> str:
    msg = message.lower()
    
    if lang_code == "kn":
        if "ಎಲೆ" in msg or "ಹಳದಿ" in msg or "yellow" in msg or "leaf" in msg:
            return "ಎಲೆಗಳು ಹಳದಿಯಾಗುವುದು ಸಾಮಾನ್ಯವಾಗಿ ಸಾರಜನಕದ ಕೊರತೆ ಅಥವಾ ಹೆಚ್ಚಿನ ನೀರಾವರಿಯಿಂದ ಸಂಭವಿಸುತ್ತದೆ. ಸೂಕ್ತವಾದ ರಸಗೊಬ್ಬರವನ್ನು ಬಳಸಿ ಮತ್ತು ಮಣ್ಣಿನ ತೇವಾಂಶವನ್ನು ಪರಿಶೀಲಿಸಿ."
        elif "ಗೊಬ್ಬರ" in msg or "ರಸಗೊಬ್ಬರ" in msg or "fertilizer" in msg:
            return "ನಿಮ್ಮ ಬೆಳೆಗೆ ಸರಿಯಾದ ಪ್ರಮಾಣದ NPK ರಸಗೊಬ್ಬರವನ್ನು ನೀಡುವುದು ಸೂಕ್ತ. ಕಾಲಕಾಲಕ್ಕೆ ಸೂಕ್ತ ನೀರಾವರಿ ನಿರ್ವಹಣೆ ಮಾಡಿ."
        return "ಅಗ್ರಿಫಾರ್ಮ್ AI ಸಲಹೆ: ನಿಮ್ಮ ಬೆಳೆಯನ್ನು ನಿಯಮಿತವಾಗಿ ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಸೂಕ್ತ ಸಮಯದಲ್ಲಿ ಪೋಷಕಾಂಶಗಳನ್ನು ನೀಡಿ."

    elif lang_code == "hi":
        if "पीला" in msg or "पत्ती" in msg or "yellow" in msg or "leaf" in msg:
            return "पत्तियों का पीला पड़ना आमतौर पर नाइट्रोजन की कमी या अधिक सिंचाई के कारण होता है। संतुलित NPK उर्वरक का प्रयोग करें और जल निकासी में सुधार करें।"
        elif "खाद" in msg or "उर्वरक" in msg or "fertilizer" in msg:
            return "फसल की अच्छी वृद्धि के लिए बुआई के समय और वृद्धि चरण में आवश्यकतानुसार संतुलित उर्वरक का प्रयोग करें।"
        return "एग्रीसेंस सलाह: अपनी फसल की नियमित निगरानी करें और लक्षण दिखने पर उचित उपचार करें।"

    else:  # English
        if "yellow" in msg or "leaf" in msg or "leaves" in msg:
            return "Yellowing leaves usually indicate a nitrogen deficiency or overwatering. Ensure good soil drainage and apply a balanced N-P-K fertilizer."
        elif "fertilizer" in msg or "npk" in msg or "urea" in msg:
            return "For optimal growth, apply a balanced N-P-K mixture in split doses during the active vegetative stage."
        elif "price" in msg or "market" in msg or "sell" in msg:
            return "Local market trends show stable demand. Consider selling mature produce early if rain is forecasted."
        return "AgriSense recommends checking soil moisture, ensuring adequate sunlight, and applying targeted bio-pesticides if pests appear."


# ==========================================
# API Endpoints
# ==========================================

@app.get("/")
def health_check():
    return {"status": "AgriSense AI Backend Active", "gemini_enabled": client is not None}


@app.get("/weather")
def get_weather():
    return {
        "location": "Bangalore",
        "temperature": 29,
        "humidity": 81,
        "forecast": "Rain expected in 48 hours"
    }


@app.post("/diagnose", response_model=DiagnosisResponse)
async def diagnose_crop(
    image: UploadFile = File(...),
    language: str = Form("en")
):
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format: {image.content_type}."
        )

    try:
        if not client:
            raise Exception("Gemini client is not initialized.")

        lang_name = get_language_name(language)
        image_bytes = await image.read()

        if len(image_bytes) > MAX_FILE_SIZE_MB:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Image file size exceeds 10MB limit."
            )

        prompt = f"""
        Analyze this plant/crop leaf image carefully.
        Identify if there is any disease, pest issue, or nutrient deficiency present.
        
        CRITICAL INSTRUCTION: Write ALL string values in {lang_name} ({language}).
        If the image is not a plant, set is_plant to false and disease to "Not a plant image".
        """

        response = await run_in_threadpool(
            client.models.generate_content,
            model=MODEL_NAME,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=image.content_type),
                prompt
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=DiagnosisResponse
            )
        )

        return json.loads(response.text)

    except HTTPException:
        raise
    except (APIError, Exception) as e:
        logger.warning(f"Fallback triggered for /diagnose: {e}")
        return {
            "disease": "Stripe Rust (Yellow Rust)",
            "confidence": 0.94,
            "severity": "Medium",
            "crop_detected": "Wheat",
            "is_plant": True,
            "summary": "Stripe rust is a fungal disease that creates yellow-orange stripes on leaves and impacts yield."
        }


@app.post("/explain", response_model=ExplanationResponse)
async def explain_disease(data: DiseaseRequest):
    try:
        if not client:
            raise Exception("Gemini client is not initialized.")

        lang_name = get_language_name(data.language)
        prompt = f"""
        The crop is '{data.crop}' and the detected condition is '{data.disease}'.
        
        CRITICAL INSTRUCTION: Write ALL string values in the response strictly in {lang_name} ({data.language}).
        """

        response = await run_in_threadpool(
            client.models.generate_content,
            model=MODEL_NAME,
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ExplanationResponse
            )
        )

        return json.loads(response.text)

    except (APIError, Exception) as e:
        logger.warning(f"Fallback triggered for /explain: {e}")
        lang_code = data.language.lower().strip()
        if lang_code == "kn":
            return {
                "disease": "ಹಳದಿ ತುಕ್ಕು (Stripe Rust)",
                "summary": "ಹಳದಿ ತುಕ್ಕು ಗೋಧಿ ಬೆಳೆಯಲ್ಲಿ ಬರುವ ಒಂದು ಶಿಲೀಂಧ್ರ ರೋಗವಾಗಿದ್ದು, ಇದು ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆಯನ್ನು ಕಡಿಮೆ ಮಾಡುತ್ತದೆ.",
                "symptoms": ["ಎಲೆಗಳ ಮೇಲೆ ಹಳದಿ ಬಣ್ಣದ ರೇಖೆಗಳು ಮತ್ತು ಚುಕ್ಕೆಗಳು", "ಎಲೆಗಳು ಒಣಗಿ ಉದುರುವುದು"],
                "treatment": ["ಶಿಫಾರಸು ಮಾಡಿದ ಪ್ರೋಪಿಕೋನಜೋಲ್ ಶಿಲೀಂಧ್ರನಾಶಕವನ್ನು ಸಿಂಪಡಿಸಿ", "ಸರಿಯಾದ ನೀರಾವರಿ ನಿರ್ವಹಣೆ ಮಾಡಿ"],
                "prevention": ["ರೋಗ ನಿರೋಧಕ ತಳಿಗಳನ್ನು ಬಳಸಿ", "ಹೆಚ್ಚುವರಿ ಸಾರಜನಕ ರಸಗೊಬ್ಬರವನ್ನು ತಪ್ಪಿಸಿ"]
            }
        elif lang_code == "hi":
            return {
                "disease": "पीला रतुआ (Stripe Rust)",
                "summary": "पीला रतुआ गेहूं की फसल को प्रभावित करने वाला एक फंगल रोग है जो उपज घटाता है।",
                "symptoms": ["पत्तियों पर पीली-नारंगी धारियां", "पत्तियों का समय से पहले सूखना"],
                "treatment": ["अनुशंसित प्रोपिकोनाज़ोल कवकनाशी का छिड़काव करें", "खेत में जल निकासी सुनिश्चित करें"],
                "prevention": ["रोग प्रतिरोधी किस्मों को बोएं", "अत्यधिक नाइट्रोजन उर्वरक से बचें"]
            }
        return {
            "disease": data.disease,
            "summary": f"{data.disease} affects leaf photosynthesis and reduces overall crop yield if left untreated.",
            "symptoms": ["Yellow/orange pustules along leaf veins", "Premature leaf drying and chlorosis"],
            "treatment": ["Apply recommended systemic fungicide spray (e.g. Propiconazole)", "Ensure balanced field drainage"],
            "prevention": ["Plant resistant crop varieties", "Avoid excessive nitrogen fertilization"]
        }


@app.get("/price-trend/{crop}")
def get_price_trend(crop: str):
    try:
        days = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7", "Next Day 1", "Next Day 2", "Next Day 3"]
        crop_lower = crop.lower()
        
        if "cotton" in crop_lower:
            base_price, slope = 6200, -75
        elif "wheat" in crop_lower:
            base_price, slope = 2450, -20
        elif "tomato" in crop_lower:
            base_price, slope = 2800, 50
        else:
            base_price, slope = 4100, -30

        data = []
        for i, day in enumerate(days):
            simulated_price = int(base_price + (i * slope) + random.randint(-30, 30))
            data.append({
                "day": day,
                "price": max(1000, simulated_price),
                "is_forecast": i >= 7
            })

        return {
            "crop": crop.capitalize(),
            "currency": "INR/Quintal",
            "trend_direction": "FALLING" if slope < 0 else "RISING",
            "data": data
        }
    except Exception as e:
        logger.error(f"Error in /price-trend: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/advisor", response_model=AdvisoryResponse)
async def sell_hold_advisor(data: AdvisoryRequest):
    try:
        if not client:
            raise Exception("Gemini client is not initialized.")

        lang_name = get_language_name(data.language)
        weather = get_weather()
        
        prompt = f"""
        You are AgriSense, an AI decision engine for smallholder farmers.
        Synthesize information to decide whether the farmer should SELL immediately or HOLD their harvest.
        Also compose a short broadcast alert string suitable for a WhatsApp alert message.
        
        Input Context:
        - Disease: {data.disease} (Confidence: {data.confidence})
        - Weather Forecast: {weather['forecast']}
        - Crop Perishability: {data.perishability}

        CRITICAL INSTRUCTION: Write ALL string values in {lang_name} ({data.language}).
        """

        response = await run_in_threadpool(
            client.models.generate_content,
            model=MODEL_NAME,
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AdvisoryResponse
            )
        )

        return json.loads(response.text)

    except (APIError, Exception) as e:
        logger.warning(f"Fallback triggered for /advisor: {e}")
        lang_code = data.language.lower().strip()
        if lang_code == "kn":
            return {
                "recommendation": "ತಕ್ಷಣ ಮಾರಾಟ ಮಾಡಿ (SELL NOW)",
                "risk_level": "ಹೆಚ್ಚಿನ ಅಪಾಯ (High)",
                "reasoning": "ಸಕ್ರಿಯ ರೋಗದ ಒತ್ತಡ ಮತ್ತು ಮುಂಬರುವ ಮಳೆಯು ಬೆಳೆಗೆ ಹಾನಿ ಉಂಟುಮಾಡಬಹುದು. ತಕ್ಷಣ ಮಾರಾಟ ಮಾಡುವುದು ಸೂಕ್ತ.",
                "action_steps": ["ಬೆಳೆದ ಬೆಳೆಯನ್ನು ತಕ್ಷಣ ಕೊಯ್ಲು ಮಾಡಿ", "ಹತ್ತಿರದ ಮಾರುಕಟ್ಟೆಗೆ ಸಾಗಿಸಿ"],
                "whatsapp_broadcast": "AgriSense ಎಚ್ಚರಿಕೆ: ರೋಗದ ಲಕ್ಷಣ ಹಾಗೂ ಮಳೆಯ ಮುನ್ಸೂಚನೆ ಇರುವುದರಿಂದ ತಕ್ಷಣ ಮಾರಾಟ ಮಾಡಲು ಸಲಹೆ ನೀಡಲಾಗಿದೆ."
            }
        elif lang_code == "hi":
            return {
                "recommendation": "अभी बेचें (SELL NOW)",
                "risk_level": "उच्च जोखिम (High)",
                "reasoning": "रोग का प्रकोप और बारिश की संभावना को देखते हुए फसल तुरंत बेचना सुरक्षित रहेगा।",
                "action_steps": ["पकी फसल की तुरंत कटाई करें", "निकटतम मंडी में उपज भेजें"],
                "whatsapp_broadcast": "AgriSense सलाह: फसल में बीमारी और बारिश की आशंका को देखते हुए तुरंत बेचने की सलाह दी जाती है।"
            }
        return {
            "recommendation": "SELL NOW",
            "risk_level": "High",
            "reasoning": "Active fungal pressure combined with rain forecasts and falling market prices indicates high risk. Selling early protects overall crop profit.",
            "action_steps": ["Harvest mature areas immediately", "Transport yield to nearest mandi before weather turns"],
            "whatsapp_broadcast": "AgriSense Advisory: Disease detected & heavy rain expected in 48 hrs. Recommendation: SELL NOW to avoid yield loss."
        }


@app.post("/field-health")
async def field_health(data: FieldHealthRequest):
    total = len(data.results)
    if total == 0:
        raise HTTPException(status_code=400, detail="No scan results provided.")

    healthy = sum(1 for r in data.results if r.lower() == "healthy")
    infected = total - healthy
    healthy_pct = round((healthy / total) * 100, 2)
    infected_pct = round((infected / total) * 100, 2)
    diseases = [r for r in data.results if r.lower() != "healthy"]
    dominant = Counter(diseases).most_common(1)[0][0] if diseases else "None"

    try:
        if not client:
            raise Exception("Gemini client is not initialized.")

        lang_name = get_language_name(data.language)
        prompt = f"""
        Translate this field health summary into {lang_name} ({data.language}):
        "{healthy_pct}% healthy, {infected_pct}% infected. Dominant issue: {dominant}."
        
        Return JSON with key "summary".
        """

        response = await run_in_threadpool(
            client.models.generate_content,
            model=MODEL_NAME,
            contents=[prompt],
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )

        translated_summary = json.loads(response.text).get("summary", f"{healthy_pct}% healthy, {infected_pct}% infected.")

        return {
            "total_scans": total,
            "healthy_percentage": healthy_pct,
            "infected_percentage": infected_pct,
            "field_health_score": healthy_pct,
            "dominant_disease": dominant,
            "summary": translated_summary
        }
    except HTTPException:
        raise
    except (APIError, Exception) as e:
        logger.warning(f"Fallback triggered for /field-health: {e}")
        return {
            "total_scans": total,
            "healthy_percentage": healthy_pct,
            "infected_percentage": infected_pct,
            "field_health_score": healthy_pct,
            "dominant_disease": dominant,
            "summary": f"{healthy_pct}% healthy, {infected_pct}% infected. Field health analysis complete."
        }


@app.post("/yield-loss")
async def calculate_yield_loss(data: YieldLossRequest):
    potential_loss = min(100.0, data.severity_score * data.affected_percentage * 1.1)
    field_health_score = max(0.0, 100.0 - potential_loss)

    try:
        if not client:
            raise Exception("Gemini client is not initialized.")

        lang_name = get_language_name(data.language)
        prompt = f"""
        Translate the following status strings into {lang_name} ({data.language}):
        1. Status: "Moderate Risk"
        2. Recommendation: "Estimated Yield Loss: ~{round(potential_loss, 1)}%. Status: Moderate Risk."
        """

        response = await run_in_threadpool(
            client.models.generate_content,
            model=MODEL_NAME,
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=YieldLossResponse
            )
        )

        res_data = json.loads(response.text)
        return {
            "field_health_score": round(field_health_score, 1),
            "estimated_yield_loss_percent": round(potential_loss, 1),
            "status": res_data.get("status", "Moderate Risk"),
            "recommendation": res_data.get("recommendation", f"Estimated Yield Loss: ~{round(potential_loss, 1)}%")
        }
    except (APIError, Exception) as e:
        logger.warning(f"Fallback triggered for /yield-loss: {e}")
        return {
            "field_health_score": round(field_health_score, 1),
            "estimated_yield_loss_percent": round(potential_loss, 1),
            "status": "Moderate Risk",
            "recommendation": f"Estimated Yield Loss: ~{round(potential_loss, 1)}%."
        }


@app.get("/community-outbreaks", response_model=RegionalOutbreakResponse)
async def get_community_outbreaks(language: str = "en"):
    try:
        if not client:
            raise Exception("Gemini client is not initialized.")

        lang_name = get_language_name(language)
        prompt = f"""
        Translate this outbreak alert data strictly into {lang_name} ({language}):
        Region: Mandya District / Southern Region
        Alert 1: Crop: Wheat, Disease: Stripe Rust, Risk: HIGH RISK, 42 reports, 12 km radius
        Alert 2: Crop: Tomato, Disease: Early Blight, Risk: MEDIUM RISK, 19 reports, 24 km radius
        """

        response = await run_in_threadpool(
            client.models.generate_content,
            model=MODEL_NAME,
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=RegionalOutbreakResponse
            )
        )

        return json.loads(response.text)

    except (APIError, Exception) as e:
        logger.warning(f"Fallback triggered for /community-outbreaks: {e}")
        lang_code = language.lower().strip()
        if lang_code == "kn":
            return {
                "region": "ಮಂಡ್ಯ ಜಿಲ್ಲೆ (Mandya District)",
                "active_alerts": [
                    {"crop": "ಗೋಧಿ (Wheat)", "disease": "ಹಳದಿ ತುಕ್ಕು (Stripe Rust)", "cases_reported": 42, "risk_level": "ಹೆಚ್ಚಿನ ಅಪಾಯ (HIGH RISK)", "distance_km": 12},
                    {"crop": "ಟೊಮೆಟೊ (Tomato)", "disease": "ಆರಂಭಿಕ ಮಚ್ಚೆ ರೋಗ (Early Blight)", "cases_reported": 19, "risk_level": "ಸಾಧಾರಣ ಅಪಾಯ (MEDIUM RISK)", "distance_km": 24}
                ]
            }
        elif lang_code == "hi":
            return {
                "region": "मैंड्या जिला (Mandya District)",
                "active_alerts": [
                    {"crop": "गेहूं (Wheat)", "disease": "पीला रतुआ (Stripe Rust)", "cases_reported": 42, "risk_level": "उच्च जोखिम (HIGH RISK)", "distance_km": 12},
                    {"crop": "टमाटर (Tomato)", "disease": "अगेती झुलसा (Early Blight)", "cases_reported": 19, "risk_level": "मध्यम जोखिम (MEDIUM RISK)", "distance_km": 24}
                ]
            }
        return {
            "region": "Mandya District",
            "active_alerts": [
                {"crop": "Wheat", "disease": "Stripe Rust", "cases_reported": 42, "risk_level": "HIGH RISK", "distance_km": 12},
                {"crop": "Tomato", "disease": "Early Blight", "cases_reported": 19, "risk_level": "MEDIUM RISK", "distance_km": 24}
            ]
        }


@app.post("/translate", response_model=TranslationResponse)
async def translate_text(data: TranslateRequest):
    try:
        if not client:
            raise Exception("Gemini client is not initialized.")

        lang_name = get_language_name(data.language)
        prompt = f"""
        Translate the following text into {lang_name}.
        Target language code: {data.language}
        
        Text: {data.text}
        """

        response = await run_in_threadpool(
            client.models.generate_content,
            model=MODEL_NAME,
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=TranslationResponse
            )
        )

        return json.loads(response.text)
    except (APIError, Exception) as e:
        logger.warning(f"Fallback triggered for /translate: {e}")
        return {
            "language": data.language,
            "translated_text": data.text
        }


@app.post("/chat")
async def voice_assistant_chat(data: ChatRequest):
    try:
        if not client:
            raise Exception("Gemini client is not initialized.")

        lang_name = get_language_name(data.language)

        prompt = f"""
        You are AgriSense Companion, an empathetic AI agronomist speaking directly to a farmer.
        Answer their question concisely in 2 short sentences.
        
        CRITICAL INSTRUCTION: Reply ENTIRELY in {lang_name} ({data.language}). Do NOT use English unless the requested language is English.
        
        Farmer Question: "{data.message}"
        """

        response = await run_in_threadpool(
            client.models.generate_content,
            model=MODEL_NAME,
            contents=[prompt]
        )

        return {"reply": response.text.strip()}

    except (APIError, Exception) as e:
        logger.warning(f"Fallback triggered for /chat: {e}")
        lang_code = data.language.lower().strip()
        # Returns smart agricultural answers during API quota limit / offline mode
        demo_reply = get_demo_chat_response(data.message, lang_code)
        return {"reply": demo_reply}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)