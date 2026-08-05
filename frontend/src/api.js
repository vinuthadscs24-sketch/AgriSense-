const API_BASE = "http://localhost:8000";

// 1. Vision AI Diagnosis
export async function diagnoseCrop(imageFile, language = "en") {
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("language", language);

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
export async function getPriceTrend(crop = "Wheat") {
  const res = await fetch(`${API_BASE}/price-trend/${crop}`);

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch price trend");
  }
  return await res.json();
}

// 4. Smart Sell/Hold Decision Advisor
export async function getAdvisorRecommendation(disease, confidence = 0.95, weatherRisk = "Moderate Rain expected", marketTrend = "Prices falling", perishability = "High", language = "en") {
  const res = await fetch(`${API_BASE}/advisor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      disease: disease || "Healthy",
      confidence: confidence,
      weather_risk: weatherRisk,
      market_trend: marketTrend,
      perishability: perishability,
      language: language
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

// 6. Yield Loss & Field Health Score
export async function getYieldLoss(severityScore = 0.5, affectedPercentage = 25.0, language = "en") {
  const res = await fetch(`${API_BASE}/yield-loss`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      severity_score: severityScore,
      affected_percentage: affectedPercentage,
      language: language
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to calculate yield loss");
  }
  return await res.json();
}

// 7. Community Regional Outbreak Monitor
export async function getCommunityOutbreaks(language = "en") {
  const res = await fetch(`${API_BASE}/community-outbreaks?language=${language}`);

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch regional outbreaks");
  }
  return await res.json();
}