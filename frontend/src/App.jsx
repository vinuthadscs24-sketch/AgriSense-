import React, { useState } from 'react';
import './App.css';
import { 
  diagnoseCrop, 
  explainDiagnosis, 
  getPriceTrend, 
  getAdvisorRecommendation, 
  sendChatMessage 
} from './api';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Diagnosis & Explanation response state
  const [diagnosis, setDiagnosis] = useState(null);
  const [explanation, setExplanation] = useState(null);
  
  // Mandi trends state
  const [crop, setCrop] = useState('Cotton');
  const [priceData, setPriceData] = useState(null);
  
  // Advisor state
  const [advisorResult, setAdvisorResult] = useState(null);
  
  // Chat state
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleDiagnose = async () => {
    if (!selectedFile) {
      alert("Please upload a leaf photo first!");
      return;
    }
    setLoading(true);
    setDiagnosis(null);
    setExplanation(null);

    try {
      // Step 1: Send image to FastAPI
      const diagRes = await diagnoseCrop(selectedFile);
      setDiagnosis(diagRes);

      // Step 2: Fetch agronomist explanation for detected condition
      if (diagRes && diagRes.disease) {
        const expRes = await explainDiagnosis(diagRes.disease, diagRes.crop_detected || crop, "en");
        setExplanation(expRes);
      }
    } catch (err) {
      console.error("Diagnosis error:", err);
      alert(`Diagnosis Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPrice = async () => {
    try {
      const data = await getPriceTrend(crop);
      setPriceData(data);
    } catch (err) {
      console.error("Price trend error:", err);
      alert(`Price Error: ${err.message}`);
    }
  };

  const handleGetAdvice = async () => {
    try {
      const detectedDisease = diagnosis?.disease || "Fungal Leaf Spot";
      const conf = diagnosis?.confidence || 0.90;
      
      const res = await getAdvisorRecommendation(
        detectedDisease,
        conf,
        "Heavy rain expected tomorrow",
        "Prices projected to fall 5% over 3 days",
        "High"
      );
      setAdvisorResult(res);
    } catch (err) {
      console.error("Advisor error:", err);
      alert(`Advisor Error: ${err.message}`);
    }
  };

  const handleVoiceQuery = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is supported in Google Chrome. Please switch to Chrome!");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setChatQuery(transcript);
      try {
        const res = await sendChatMessage(transcript, "en");
        setChatResponse(res.reply);
      } catch (err) {
        console.error("Voice chat error:", err);
      }
    };
    recognition.start();
  };

  const handleTextChat = async (e) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;
    try {
      const res = await sendChatMessage(chatQuery, "en");
      setChatResponse(res.reply);
    } catch (err) {
      console.error("Text chat error:", err);
      alert(`Chat Error: ${err.message}`);
    }
  };

  // Helper to extract current/latest price from priceData array
  const currentPrice = priceData?.data?.[0]?.price;
  const forecastPrice = priceData?.data?.[priceData.data.length - 1]?.price;

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo-badge">🌱 AgriSense AI Platform</div>
        <h1>AgriSense</h1>
        <p>AI Engine for Crop Health Diagnosis, Agronomist Advice, Price Trends, and Market Decisions</p>
      </header>

      <div className="grid">
        {/* Module 1: Vision AI Diagnosis */}
        <div className="card">
          <h2>📷 1. Vision AI Crop Diagnosis</h2>
          <p className="card-sub">Upload a leaf photo to receive real-time Gemini vision diagnosis.</p>
          
          <div className="upload-box">
            <input type="file" accept="image/*" onChange={handleFileChange} id="file-input" />
            <label htmlFor="file-input" className="file-label">
              {selectedFile ? selectedFile.name : "📷 Choose Plant/Crop Image"}
            </label>
          </div>

          {preview && <img src={preview} alt="Crop Preview" className="img-preview" />}

          <button onClick={handleDiagnose} className="btn-primary" disabled={loading}>
            {loading ? "Analyzing Image..." : "Diagnose Crop Health"}
          </button>

          {diagnosis && (
            <div className="result-box">
              <div className="badge-group">
                <span className="badge badge-disease">{diagnosis.disease}</span>
                <span className="badge badge-confidence">
                  {diagnosis.confidence ? `${(diagnosis.confidence * 100).toFixed(0)}% Confidence` : "Diagnosed"}
                </span>
                {diagnosis.severity && (
                  <span className="badge badge-severity">Severity: {diagnosis.severity}</span>
                )}
              </div>

              {explanation && (
                <div className="explanation-text">
                  <strong>AI Agronomist Summary:</strong>
                  <p>{explanation.summary}</p>
                  
                  {explanation.treatment && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <strong>Recommended Treatments:</strong>
                      <ul>
                        {explanation.treatment.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Module 2: Mandi Market Price Analytics */}
        <div className="card">
          <h2>📊 2. Mandi Price Trend Analytics</h2>
          <p className="card-sub">Track current prices and regression-projected market trends.</p>
          
          <div className="form-group">
            <select value={crop} onChange={(e) => setCrop(e.target.value)} className="select-input">
              <option value="Cotton">Cotton</option>
              <option value="Tomato">Tomato</option>
              <option value="Wheat">Wheat</option>
              <option value="Rice">Rice</option>
            </select>
            <button onClick={handleFetchPrice} className="btn-secondary">View Market Trend</button>
          </div>

          {priceData && (
            <div className="price-box">
              <div className="price-stat">
                <span>Crop:</span>
                <strong>{priceData.crop}</strong>
              </div>
              <div className="price-stat">
                <span>Current Price:</span>
                <strong>₹{currentPrice} {priceData.currency}</strong>
              </div>
              <div className="price-stat">
                <span>Projection:</span>
                <strong className={priceData.trend_direction === "FALLING" ? "text-danger" : "text-success"}>
                  ₹{forecastPrice} ({priceData.trend_direction})
                </strong>
              </div>
            </div>
          )}
        </div>

        {/* Module 3: Decision Advisor */}
        <div className="card">
          <h2>⚖️ 3. Smart Sell/Hold Market Advisor</h2>
          <p className="card-sub">Synthesize disease severity, weather forecasts, and price trends.</p>
          
          <button onClick={handleGetAdvice} className="btn-accent">
            Consult AI Decision Engine
          </button>

          {advisorResult && (
            <div className={`advisor-box ${advisorResult.recommendation === "SELL NOW" ? "sell" : "hold"}`}>
              <div className="advisor-badge">{advisorResult.recommendation}</div>
              <p><strong>Risk Level:</strong> {advisorResult.risk_level}</p>
              <p style={{ marginTop: '0.5rem' }}><strong>Reasoning:</strong> {advisorResult.reasoning}</p>
              
              {advisorResult.action_steps && (
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
                  {advisorResult.action_steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Module 4: Conversational Assistant */}
        <div className="card">
          <h2>🎤 4. Conversational Voice Companion</h2>
          <p className="card-sub">Ask crop care or market questions via voice or text input.</p>
          
          <div className="voice-actions">
            <button onClick={handleVoiceQuery} className="btn-voice">
              🎤 Speak Query
            </button>
          </div>

          <form onSubmit={handleTextChat} className="chat-form">
            <input 
              type="text" 
              placeholder="Ask a farming question..." 
              value={chatQuery} 
              onChange={(e) => setChatQuery(e.target.value)}
              className="chat-input"
            />
            <button type="submit" className="btn-primary">Ask</button>
          </form>

          {chatResponse && (
            <div className="chat-response-box">
              <strong>AgriSense Companion:</strong>
              <p>{chatResponse}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;