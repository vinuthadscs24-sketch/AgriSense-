const API_BASE = "http://localhost:8000";

export async function diagnoseCrop(imageFile) {
  const formData = new FormData();
  formData.append("image", imageFile);

  const res = await fetch(`${API_BASE}/diagnose`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export async function explainDisease(disease, crop, language = "en") {
  const res = await fetch(`${API_BASE}/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ disease, crop, language }),
  });
  return res.json();
}

export async function getPriceTrend(crop) {
  const res = await fetch(`${API_BASE}/price-trend/${crop}`);
  return res.json();
}

export async function getAdvisorDecision(payload) {
  const res = await fetch(`${API_BASE}/advisor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function sendChatMessage(message, language = "en") {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, language }),
  });
  return res.json();
}