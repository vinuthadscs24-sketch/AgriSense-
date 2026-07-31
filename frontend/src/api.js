const API_BASE = "http://localhost:8000";

// 1. Vision AI Diagnosis
export async function diagnoseCrop(imageFile) {
  const formData = new FormData();
  formData.append("image", imageFile); // Matches backend `image: UploadFile = File(...)`

  const res = await fetch(`${API_BASE}/diagnose`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to diagnose crop image");
  }
  return await res.json();
}

// 2. Multilingual Agronomist Explanation
export async function explainDiagnosis(disease, crop = "Cotton", language = "en") {
  const res = await fetch(`${API_BASE}/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      disease: disease || "Healthy",
      crop: crop,
      language: language,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to explain disease");
  }
  return await res.json();
}

// 3. Mandi Market Price Trend
export async function getPriceTrend(crop) {
  const res = await fetch(`${API_BASE}/price-trend/${crop}`);

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch price trend");
  }
  return await res.json();
}

// 4. Smart Sell/Hold Decision Advisor
export async function getAdvisorRecommendation(disease, confidence = 0.95, weather = "Moderate Rain expected", priceTrend = "Prices falling", perishability = "High") {
  const res = await fetch(`${API_BASE}/advisor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      disease: disease || "Healthy",
      confidence: confidence,
      weather: weather,
      price_trend: priceTrend,
      perishability: perishability,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch advisor decision");
  }
  return await res.json();
}

// 5. Conversational Voice / Text Assistant
export async function sendChatMessage(message, language = "en") {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: message,
      language: language,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to send chat message");
  }
  return await res.json();
}

// 6. Bonus Feature 1: Yield Loss & Field Health Score
export async function getYieldLoss(severityScore = 0.5, affectedPercentage = 25.0) {
  const res = await fetch(`${API_BASE}/yield-loss`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      severity_score: severityScore,
      affected_percentage: affectedPercentage,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to calculate yield loss");
  }
  return await res.json();
}

// 7. Bonus Feature 2: Community Regional Outbreak Monitor
export async function getCommunityOutbreaks() {
  const res = await fetch(`${API_BASE}/community-outbreaks`);

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch regional outbreaks");
  }
  return await res.json();
}