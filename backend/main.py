import os
import json
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from google import genai
from google.genai import types

# Load environment variables
load_dotenv()

app = FastAPI(
    title="AgriSense AI API",
    description="AI Engine for Crop Health Diagnosis, Agronomist Advice, and Market Decision Synthesis",
    version="1.0.0"
)

# Enable CORS for React frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini Client
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file")

client = genai.Client(api_key=api_key)


# --- Pydantic Data Models ---

class DiseaseRequest(BaseModel):
    disease: str
    crop: str = "Crop"

class AdvisoryRequest(BaseModel):
    disease: str
    confidence: float
    weather: str        # e.g., "Heavy rain expected tomorrow"
    price_trend: str    # e.g., "Prices expected to rise 5% over 3 days"
    perishability: str  # e.g., "High", "Medium", "Low"


# --- API Endpoints ---

@app.get("/")
def health_check():
    """Health check endpoint to verify backend status."""
    return {"status": "AgriSense AI Engine is running!"}


@app.post("/diagnose")
async def diagnose_crop(image: UploadFile = File(...)):
    """
    Module 1: Crop Diagnosis (Vision AI)
    Accepts an uploaded image and returns disease diagnosis in structured JSON.
    """
    try:
        image_bytes = await image.read()
        
        prompt = """
        Analyze this plant/crop image carefully. 
        Identify if there is any disease, pest issue, or nutrient deficiency present.
        
        Return STRICT JSON format with these exact keys:
        {
          "disease": "Name of disease or 'Healthy'",
          "confidence": 0.95,
          "severity": "Low" | "Medium" | "High" | "None",
          "crop_detected": "Name of crop (e.g. Cotton, Tomato, Rice)",
          "is_plant": true
        }
        
        If the image is not a plant or crop, set "is_plant" to false and "disease" to "Not a plant image".
        """

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=image.content_type),
                prompt
            ],
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )

        return json.loads(response.text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/explain")
async def explain_disease(data: DiseaseRequest):
    """
    Module 2: AI Agronomist
    Takes disease name and crop type, returning structured advice in simple language.
    """
    try:
        prompt = f"""
        You are an expert agronomist explaining crop issues to a smallholder farmer.
        The crop is '{data.crop}' and the detected condition is '{data.disease}'.
        
        Provide advice in simple, actionable, and encouraging language.
        
        Return STRICT JSON format with these exact keys:
        {{
          "disease": "{data.disease}",
          "summary": "1-2 simple sentences explaining what this condition is.",
          "symptoms": ["Symptom 1", "Symptom 2"],
          "treatment": ["Immediate treatment step 1", "Immediate treatment step 2"],
          "prevention": ["Prevention tip 1", "Prevention tip 2"]
        }}
        """

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt],
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )

        return json.loads(response.text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/advisor")
async def sell_hold_advisor(data: AdvisoryRequest):
    """
    Module 3: Sell/Hold Advisor (Decision Engine)
    Synthesizes disease status, weather forecast, price trends, and crop perishability.
    """
    try:
        prompt = f"""
        You are AgriSense, an AI decision engine for smallholder farmers.
        Synthesize the following information to decide whether the farmer should SELL immediately or HOLD their harvest.
        
        Input Context:
        - Disease Detected: {data.disease} (Confidence: {data.confidence})
        - Weather Forecast: {data.weather}
        - Market Price Trend: {data.price_trend}
        - Crop Perishability: {data.perishability}
        
        Return STRICT JSON format with these exact keys:
        {{
          "recommendation": "SELL NOW" or "HOLD",
          "risk_level": "Low" | "Medium" | "High",
          "reasoning": "Under 80 words explaining why this decision was made based on weather, market prices, and crop health.",
          "action_steps": ["Step 1 for the farmer", "Step 2 for the farmer"]
        }}
        """

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt],
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )

        return json.loads(response.text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
