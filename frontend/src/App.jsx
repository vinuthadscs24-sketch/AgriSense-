import React, { useState } from 'react';
import { diagnoseCrop, explainDisease, getAdvisorDecision, getPriceTrend, sendChatMessage } from './api';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [priceTrend, setPriceTrend] = useState(null);
  const [advisorResult, setAdvisorResult] = useState(null);
  const [chatQuery, setChatQuery] = useState('');
  const [chatReply, setChatReply] = useState('');

  // 1. Diagnosis Upload Handler
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const diagData = await diagnoseCrop(file);
      setDiagnosis(diagData);

      const cropName = diagData.crop_detected || "Cotton";

      if (diagData.disease) {
        // Fetch AI Agronomist Explanation
        const expData = await explainDisease(diagData.disease, cropName, "en");
        setExplanation(expData);
      }

      // Fetch Mandi Price Trend Data
      const priceData = await getPriceTrend(cropName);
      setPriceTrend(priceData);

    } catch (err) {
      alert("Error contacting AI Backend: Ensure FastAPI server is running on port 8000!");
    }
    setLoading(false);
  };

  // 2. Consult AI Decision Advisor
  const handleConsultAdvisor = async () => {
    setLoading(true);
    try {
      const payload = {
        disease: diagnosis?.disease || "Fungal Leaf Spot",
        confidence: diagnosis?.confidence || 0.9,
        weather: "Heavy rainfall forecast tomorrow",
        price_trend: priceTrend ? `Prices trajectory is ${priceTrend.trend_direction}` : "Prices expected to fall 8% next week",
        perishability: "High"
      };
      const decision = await getAdvisorDecision(payload);
      setAdvisorResult(decision);
    } catch (err) {
      alert("Error fetching AI decision recommendation!");
    }
    setLoading(false);
  };

  // 3. Web Speech API Voice Recognition
  const startVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is supported in Google Chrome browser!");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.start();

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setChatQuery(transcript);
      handleSendMessage(transcript);
    };
  };

  const handleSendMessage = async (msgText) => {
    const query = msgText || chatQuery;
    if (!query) return;

    setLoading(true);
    try {
      const res = await sendChatMessage(query, "en");
      setChatReply(res.reply);
    } catch (err) {
      alert("Error contacting AI voice assistant!");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '850px', margin: '30px auto', fontFamily: 'Arial, sans-serif', padding: '0 20px' }}>
      <h1 style={{ color: '#15803d', textAlign: 'center' }}>🌱 AgriSense AI Farm Companion</h1>
      <p style={{ textAlign: 'center', color: '#666' }}>Smart Crop Health Diagnosis, Mandi Price Trends & Market Decision Intelligence</p>

      {/* 1. Photo Upload Module */}
      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <h2>1. Upload Crop Image</h2>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {loading && <p style={{ color: '#2563eb' }}>⏳ AI Vision & Agronomist Engine processing...</p>}
      </div>

      {/* 2. Disease Diagnosis & Explanation Module */}
      {diagnosis && (
        <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '20px' }}>
          <h2 style={{ color: '#166534' }}>2. Crop Care Diagnosis</h2>
          <p><strong>Identified Crop:</strong> {diagnosis.crop_detected}</p>
          <p><strong>Detected Condition:</strong> {diagnosis.disease}</p>
          <p><strong>Model Confidence:</strong> {(diagnosis.confidence * 100).toFixed(0)}%</p>

          {explanation && (
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #86efac' }}>
              <h3>AI Agronomist Explanation</h3>
              <p>{explanation.summary}</p>
              
              <h4>Recommended Treatment Steps:</h4>
              <ul>
                {explanation.treatment?.map((step, idx) => <li key={idx}>{step}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 3. Mandi Price Trend Analytics Module */}
      {priceTrend && (
        <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '12px', border: '1px solid #bfdbfe', marginBottom: '20px' }}>
          <h2 style={{ color: '#1e40af' }}>3. Mandi Market Price Trend ({priceTrend.crop})</h2>
          <p><strong>Market Direction:</strong> <span style={{ color: priceTrend.trend_direction === 'RISING' ? 'green' : 'red', fontWeight: 'bold' }}>{priceTrend.trend_direction}</span> ({priceTrend.currency})</p>

          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '10px 0' }}>
            {priceTrend.data.map((item, idx) => (
              <div key={idx} style={{ padding: '10px', borderRadius: '6px', background: item.is_forecast ? '#dbeafe' : '#ffffff', border: '1px solid #93c5fd', minWidth: '70px', textAlign: 'center' }}>
                <small>{item.day}</small>
                <br />
                <strong>₹{item.price}</strong>
                {item.is_forecast && <div style={{ fontSize: '10px', color: '#2563eb' }}>Forecast</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Smart Market Decision Engine */}
      {diagnosis && (
        <div style={{ background: '#faf5ff', padding: '20px', borderRadius: '12px', border: '1px solid #e9d5ff', marginBottom: '20px' }}>
          <h2 style={{ color: '#6b21a8' }}>4. Smart Sell/Hold Market Advisor</h2>
          <p>Synthesizing weather forecasts, market prices, and disease severity...</p>
          
          <button 
            onClick={handleConsultAdvisor} 
            style={{ background: '#7e22ce', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
            Consult AI Advisor Engine
          </button>

          {advisorResult && (
            <div style={{ marginTop: '20px', padding: '20px', borderRadius: '8px', background: advisorResult.recommendation.includes('SELL') ? '#fef2f2' : '#f0fdf4', border: advisorResult.recommendation.includes('SELL') ? '2px solid #ef4444' : '2px solid #22c55e' }}>
              <h2 style={{ margin: 0, color: advisorResult.recommendation.includes('SELL') ? '#dc2626' : '#15803d' }}>
                RECOMMENDATION: {advisorResult.recommendation}
              </h2>
              <p><strong>Risk Level:</strong> {advisorResult.risk_level}</p>
              <p><strong>Reasoning:</strong> {advisorResult.reasoning}</p>
            </div>
          )}
        </div>
      )}

      {/* 5. Voice Input Assistant Section */}
      <div style={{ background: '#fff7ed', padding: '20px', borderRadius: '12px', border: '1px solid #ffedd5' }}>
        <h2 style={{ color: '#c2410c' }}>🎙️ Voice Assistant Companion</h2>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <input 
            type="text" 
            value={chatQuery} 
            onChange={(e) => setChatQuery(e.target.value)}
            placeholder="Ask a question or tap voice button..." 
            style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
          <button onClick={() => handleSendMessage()} style={{ padding: '10px 18px', background: '#ea580c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Ask</button>
          <button onClick={startVoiceRecognition} style={{ padding: '10px 18px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>🎤 Speak</button>
        </div>
        {chatReply && (
          <div style={{ marginTop: '15px', background: 'white', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #ea580c' }}>
            <strong>AI Companion Response:</strong>
            <p style={{ margin: '5px 0 0 0' }}>{chatReply}</p>
          </div>
        )}
      </div>
    </div>
  );
}