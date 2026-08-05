import base64
import json
import logging
import os
from collections import Counter
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AgriSense")

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

# API Setup
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    logger.error("GEMINI_API_KEY is missing! Direct AI requests will fail with HTTP 500.")

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# High-rate-limit, active standard models & dynamic alias for long-term stability
FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-flash-lite-latest"
]

LANGUAGE_MAP = {
    "en": "English", "hi": "Hindi", "kn": "Kannada", "te": "Telugu",
    "ta": "Tamil", "mr": "Marathi", "bn": "Bengali", "gu": "Gujarati",
    "pa": "Punjabi", "ml": "Malayalam"
}

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"}
MAX_FILE_SIZE_MB = 10 * 1024 * 1024  # 10 MB


def clean_model_name(model_str: str) -> str:
    """Strips 'models/' prefix if present."""
    if model_str.startswith("models/"):
        return model_str.replace("models/", "")
    return model_str


def get_language_name(code: str) -> str:
    if not code:
        return "English"
    return LANGUAGE_MAP.get(code.lower().strip(), code)


def verify_key_or_raise():
    if not API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gemini API key is missing or not configured in .env file."
        )


def make_gemini_request(contents: list, response_schema: Optional[dict] = None) -> str:
    """
    Uses official Google GenAI SDK to call supported Flash models with dynamic fallback logic.
    """
    verify_key_or_raise()
    client = genai.Client(api_key=API_KEY)
    
    configured_model = clean_model_name(MODEL_NAME)
    models_to_try = [configured_model] + [m for m in FALLBACK_MODELS if m != configured_model]
    
    last_error = None

    for model in models_to_try:
        try:
            config = None
            if response_schema:
                config = types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=response_schema
                )

            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=config
            )

            if response.text:
                return response.text
            
            last_error = f"Empty response text received from model '{model}'."

        except Exception as e:
            logger.warning(f"Request failed for model '{model}': {str(e)}")
            last_error = str(e)
            continue

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Gemini API request failed across all candidate models. Last error: {last_error}"
    )


# ==========================================
# Pydantic Schemas
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


# Structured JSON schemas
DIAGNOSIS_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "disease": {"type": "STRING", "description": "Exact Name of Disease or Healthy"},
        "confidence": {"type": "NUMBER", "description": "Confidence score between 0.0 and 1.0"},
        "severity": {"type": "STRING", "description": "Severity (Low, Medium, High)"},
        "crop_detected": {"type": "STRING", "description": "Name of identified crop"},
        "is_plant": {"type": "BOOLEAN", "description": "True if image contains a plant/leaf"},
        "summary": {"type": "STRING", "description": "1-2 sentence explanation of condition"}
    },
    "required": ["disease", "confidence", "severity", "crop_detected", "is_plant", "summary"]
}

EXPLANATION_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "disease": {"type": "STRING"},
        "summary": {"type": "STRING"},
        "symptoms": {"type": "ARRAY", "items": {"type": "STRING"}},
        "treatment": {"type": "ARRAY", "items": {"type": "STRING"}},
        "prevention": {"type": "ARRAY", "items": {"type": "STRING"}}
    },
    "required": ["disease", "summary", "symptoms", "treatment", "prevention"]
}

ADVISORY_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "recommendation": {"type": "STRING", "enum": ["SELL NOW", "HOLD"]},
        "risk_level": {"type": "STRING", "enum": ["Low", "Medium", "High"]},
        "reasoning": {"type": "STRING"},
        "action_steps": {"type": "ARRAY", "items": {"type": "STRING"}},
        "whatsapp_broadcast": {"type": "STRING"}
    },
    "required": ["recommendation", "risk_level", "reasoning", "action_steps", "whatsapp_broadcast"]
}

YIELD_LOSS_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "status": {"type": "STRING"},
        "recommendation": {"type": "STRING"}
    },
    "required": ["status", "recommendation"]
}

OUTBREAK_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "region": {"type": "STRING"},
        "active_alerts": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "crop": {"type": "STRING"},
                    "disease": {"type": "STRING"},
                    "cases_reported": {"type": "INTEGER"},
                    "risk_level": {"type": "STRING"},
                    "distance_km": {"type": "INTEGER"}
                },
                "required": ["crop", "disease", "cases_reported", "risk_level", "distance_km"]
            }
        }
    },
    "required": ["region", "active_alerts"]
}

TRANSLATION_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "language": {"type": "STRING"},
        "translated_text": {"type": "STRING"}
    },
    "required": ["language", "translated_text"]
}


# ==========================================
# API Endpoints
# ==========================================

@app.get("/")
def health_check():
    return {"status": "AgriSense AI Backend Active", "gemini_enabled": bool(API_KEY)}


@app.get("/weather")
def get_weather():
    return {
        "location": "Bangalore",
        "temperature": 29,
        "humidity": 81,
        "forecast": "Rain expected in 48 hours"
    }


@app.post("/diagnose")
async def diagnose_crop(
    image: UploadFile = File(...),
    language: str = Form("en")
):
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format: {image.content_type}."
        )

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

    image_part = types.Part.from_bytes(data=image_bytes, mime_type=image.content_type)
    contents = [image_part, prompt]

    res_text = await run_in_threadpool(make_gemini_request, contents, DIAGNOSIS_SCHEMA)
    return json.loads(res_text)


@app.post("/explain")
async def explain_disease(data: DiseaseRequest):
    lang_name = get_language_name(data.language)
    prompt = f"The crop is '{data.crop}' and the detected condition is '{data.disease}'. Write all string attributes in {lang_name} ({data.language})."

    contents = [prompt]
    res_text = await run_in_threadpool(make_gemini_request, contents, EXPLANATION_SCHEMA)
    return json.loads(res_text)


@app.post("/advisor")
async def sell_hold_advisor(data: AdvisoryRequest):
    lang_name = get_language_name(data.language)
    weather = get_weather()
    
    prompt = f"""
    Synthesize information to decide whether the farmer should SELL immediately or HOLD their harvest.
    Disease: {data.disease}, Confidence: {data.confidence}, Weather: {weather['forecast']}, Perishability: {data.perishability}.
    Write ALL strings in {lang_name} ({data.language}).
    """

    contents = [prompt]
    res_text = await run_in_threadpool(make_gemini_request, contents, ADVISORY_SCHEMA)
    return json.loads(res_text)


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

    lang_name = get_language_name(data.language)
    prompt = f'Translate this summary into {lang_name} ({data.language}): "{healthy_pct}% healthy, {infected_pct}% infected. Dominant issue: {dominant}."'

    schema = {
        "type": "OBJECT",
        "properties": {"summary": {"type": "STRING"}},
        "required": ["summary"]
    }

    contents = [prompt]
    res_text = await run_in_threadpool(make_gemini_request, contents, schema)
    translated_summary = json.loads(res_text).get("summary", f"{healthy_pct}% healthy, {infected_pct}% infected.")

    return {
        "total_scans": total,
        "healthy_percentage": healthy_pct,
        "infected_percentage": infected_pct,
        "field_health_score": healthy_pct,
        "dominant_disease": dominant,
        "summary": translated_summary
    }


@app.post("/yield-loss")
async def calculate_yield_loss(data: YieldLossRequest):
    potential_loss = min(100.0, data.severity_score * data.affected_percentage * 1.1)
    field_health_score = max(0.0, 100.0 - potential_loss)

    lang_name = get_language_name(data.language)
    prompt = f"Translate into {lang_name} ({data.language}): Status: 'Moderate Risk', Recommendation: 'Estimated Yield Loss: ~{round(potential_loss, 1)}%. Status: Moderate Risk.'"

    contents = [prompt]
    res_text = await run_in_threadpool(make_gemini_request, contents, YIELD_LOSS_SCHEMA)
    res_data = json.loads(res_text)

    return {
        "field_health_score": round(field_health_score, 1),
        "estimated_yield_loss_percent": round(potential_loss, 1),
        "status": res_data.get("status", "Moderate Risk"),
        "recommendation": res_data.get("recommendation", f"Estimated Yield Loss: ~{round(potential_loss, 1)}%")
    }


@app.get("/community-outbreaks")
async def get_community_outbreaks(language: str = "en"):
    lang_name = get_language_name(language)
    prompt = f"""
    Translate this outbreak alert data strictly into {lang_name} ({language}):
    Region: Mandya District / Southern Region
    Alert 1: Crop: Wheat, Disease: Stripe Rust, Risk: HIGH RISK, 42 reports, 12 km radius
    Alert 2: Crop: Tomato, Disease: Early Blight, Risk: MEDIUM RISK, 19 reports, 24 km radius
    """

    contents = [prompt]
    res_text = await run_in_threadpool(make_gemini_request, contents, OUTBREAK_SCHEMA)
    return json.loads(res_text)


@app.post("/translate")
async def translate_text(data: TranslateRequest):
    lang_name = get_language_name(data.language)
    prompt = f"Translate into {lang_name} ({data.language}): {data.text}"

    contents = [prompt]
    res_text = await run_in_threadpool(make_gemini_request, contents, TRANSLATION_SCHEMA)
    return json.loads(res_text)


@app.post("/chat")
async def voice_assistant_chat(data: ChatRequest):
    lang_name = get_language_name(data.language)

    prompt = f"""
    You are AgriSense Companion, an empathetic AI agronomist speaking directly to a farmer.
    Answer their question concisely in 2 short sentences.
    Reply ENTIRELY in {lang_name} ({data.language}).
    
    Farmer Question: "{data.message}"
    """

    contents = [prompt]
    res_text = await run_in_threadpool(make_gemini_request, contents)
    return {"reply": res_text.strip()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)