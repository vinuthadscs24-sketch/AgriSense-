import React, { useState, useEffect } from 'react';
import './App.css';
import { 
  diagnoseCrop, 
  explainDiagnosis, 
  getPriceTrend, 
  getAdvisorRecommendation, 
  sendChatMessage,
  getYieldLoss,
  getCommunityOutbreaks
} from './api';

// Icon Set & Recharts Integration
import { 
  Sprout, 
  Camera, 
  TrendingUp, 
  Scale, 
  Mic, 
  Activity, 
  AlertTriangle, 
  MessageSquare, 
  Globe, 
  Send,
  ShieldAlert
} from 'lucide-react';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('en');
  const [activeTab, setActiveTab] = useState('vision');
  
  // Diagnosis & Explanation response state
  const [diagnosis, setDiagnosis] = useState(null);
  const [explanation, setExplanation] = useState(null);
  
  // Mandi trends state
  const [crop, setCrop] = useState('Wheat');
  const [priceData, setPriceData] = useState(null);
  
  // Advisor state
  const [advisorResult, setAdvisorResult] = useState(null);
  
  // Chat state
  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { sender: 'ai', text: 'Hello! I am your AgriOS companion. Ask me about crop health or market prices.' }
  ]);
  const [isRecording, setIsRecording] = useState(false);

  // Yield & Outbreaks state
  const [yieldData, setYieldData] = useState(null);
  const [affectedPercent, setAffectedPercent] = useState(20);
  const [outbreakData, setOutbreakData] = useState(null);

  // Smooth scroll handler on tab click
  const scrollToSection = (sectionId) => {
    setActiveTab(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    fetchOutbreaks();
  }, []);

  // Fetch prices whenever selected crop changes
  useEffect(() => {
    handleFetchPrice(crop);
  }, [crop]);

  // Re-trigger language-based disease explanation when global language changes
  useEffect(() => {
    if (diagnosis?.disease) {
      explainDiagnosis(diagnosis.disease, diagnosis.crop_detected || crop, lang)
        .then(res => setExplanation(res))
        .catch(err => console.error("Language explanation update error:", err));
    }
  }, [lang, diagnosis]);

  const fetchOutbreaks = async () => {
    try {
      const data = await getCommunityOutbreaks();
      setOutbreakData(data);
    } catch (err) {
      console.error("Outbreak fetch error:", err);
    }
  };

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
    setYieldData(null);

    try {
      const diagRes = await diagnoseCrop(selectedFile);
      setDiagnosis(diagRes);

      // Auto-sync crop dropdown & market prices across the entire dashboard
      const detectedCrop = diagRes.crop_detected || crop;
      setCrop(detectedCrop);

      if (diagRes && diagRes.disease) {
        const expRes = await explainDiagnosis(diagRes.disease, detectedCrop, lang);
        setExplanation(expRes);

        const severityScore = diagRes.severity === "High" ? 0.8 : diagRes.severity === "Medium" ? 0.5 : 0.2;
        const lossRes = await getYieldLoss(severityScore, affectedPercent);
        setYieldData(lossRes);
      }
    } catch (err) {
      console.error("Diagnosis error:", err);
      alert(`Diagnosis Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateYield = async () => {
    try {
      const severityScore = diagnosis?.severity === "High" ? 0.8 : diagnosis?.severity === "Medium" ? 0.5 : 0.2;
      const lossRes = await getYieldLoss(severityScore, affectedPercent);
      setYieldData(lossRes);
    } catch (err) {
      console.error("Yield recalculation error:", err);
    }
  };

  const handleFetchPrice = async (targetCrop = crop) => {
    try {
      const data = await getPriceTrend(targetCrop);
      setPriceData(data);
    } catch (err) {
      console.error("Price trend error:", err);
    }
  };

  const handleGetAdvice = async () => {
    try {
      const detectedDisease = diagnosis?.disease || "Stripe Rust (Yellow Rust)";
      const conf = diagnosis?.confidence || 0.94;
      const trendText = priceData?.trend_direction ? `Prices currently ${priceData.trend_direction}` : "Prices falling";
      
      const res = await getAdvisorRecommendation(
        detectedDisease,
        conf,
        "Moderate rain expected within 48 hours",
        trendText,
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
    recognition.lang = lang === 'hi' ? 'hi-IN' : lang === 'te' ? 'te-IN' : lang === 'ta' ? 'ta-IN' : 'en-IN';
    
    setIsRecording(true);
    recognition.start();

    recognition.onresult = async (event) => {
      setIsRecording(false);
      const transcript = event.results[0][0].transcript;
      setChatHistory(prev => [...prev, { sender: 'user', text: transcript }]);
      try {
        const res = await sendChatMessage(transcript, lang);
        setChatHistory(prev => [...prev, { sender: 'ai', text: res.reply }]);
      } catch (err) {
        console.error("Voice chat error:", err);
      }
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
  };

  const handleTextChat = async (e) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;
    
    const userText = chatQuery;
    setChatQuery('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userText }]);

    try {
      const res = await sendChatMessage(userText, lang);
      setChatHistory(prev => [...prev, { sender: 'ai', text: res.reply }]);
    } catch (err) {
      console.error("Text chat error:", err);
    }
  };

  const currentPrice = priceData?.data?.[0]?.price;
  const chartPoints = priceData?.data ? [...priceData.data].reverse() : [];

  return (
    <div className="agri-os-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="brand-header">
            <div className="brand-icon">🌱</div>
            <div>
              <span className="brand-title">AgriOS</span>
              <span className="brand-badge">Enterprise v2.4</span>
            </div>
          </div>

          <ul className="nav-menu">
            <li 
              className={`nav-item ${activeTab === 'vision' ? 'active' : ''}`} 
              onClick={() => scrollToSection('vision')}
            >
              <Camera size={18} /> Vision AI
            </li>
            <li 
              className={`nav-item ${activeTab === 'mandi' ? 'active' : ''}`} 
              onClick={() => scrollToSection('mandi')}
            >
              <TrendingUp size={18} /> Mandi Market
            </li>
            <li 
              className={`nav-item ${activeTab === 'advisor' ? 'active' : ''}`} 
              onClick={() => scrollToSection('advisor')}
            >
              <Scale size={18} /> Decision Advisor
            </li>
            <li 
              className={`nav-item ${activeTab === 'voice' ? 'active' : ''}`} 
              onClick={() => scrollToSection('voice')}
            >
              <MessageSquare size={18} /> Voice Assistant
            </li>
            <li 
              className={`nav-item ${activeTab === 'health' ? 'active' : ''}`} 
              onClick={() => scrollToSection('health')}
            >
              <Activity size={18} /> Field Health
            </li>
          </ul>
        </div>

        <div className="lang-selector-box">
          <label><Globe size={14} style={{ display: 'inline', marginRight: 4 }} /> Language / भाषा</label>
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="lang-select">
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="ta">தமிழ் (Tamil)</option>
          </select>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-farm-banner">
          <div className="banner-title">
            <h1>Farm Intelligence Dashboard</h1>
            <p>Real-time computer vision, agronomy intelligence, and price forecasting</p>
          </div>
          <div className="farm-metrics-pills">
            <div className="metric-pill">
              <span>Active Field</span>
              <strong>North Sector A</strong>
            </div>
            <div className="metric-pill">
              <span>Primary Crop</span>
              <strong>{crop}</strong>
            </div>
          </div>
        </header>

        {/* Global Field Health Bar */}
        <div id="health" className="health-gauge-card" style={{ '--health-pct': `${yieldData?.field_health_score || 89}%` }}>
          <div className="gauge-circle">
            <span className="gauge-value">{yieldData ? yieldData.field_health_score : 89}%</span>
          </div>
          <div className="gauge-details">
            <h3>Overall Field Health Score</h3>
            <p>
              {yieldData 
                ? `Estimated Yield Loss: ~${yieldData.estimated_yield_loss_percent}%. Status: ${yieldData.status}`
                : "Upload a crop diagnostic photo below to recalculate real-time canopy health."}
            </p>
          </div>
        </div>

        {/* 12-Column Grid */}
        <div className="dashboard-grid">
          
          {/* Module 1: Vision AI Crop Diagnosis */}
          <div id="vision" className="os-card col-span-7">
            <div className="card-header-flex">
              <h2><Camera size={20} /> Vision AI Crop Diagnosis</h2>
              <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '6px', fontWeight: 700 }}>
                Gemini Vision Powered
              </span>
            </div>

            <div className="drag-drop-area" onClick={() => document.getElementById('file-input').click()}>
              <input type="file" accept="image/*" onChange={handleFileChange} id="file-input" style={{ display: 'none' }} />
              <Camera size={32} color="#059669" style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {selectedFile ? selectedFile.name : "Click or drag leaf photo here for scanning"}
              </p>
            </div>

            {preview && (
              <div className="diagnosis-overlay-container">
                <div className="preview-wrapper">
                  <img src={preview} alt="Crop Leaf" />
                  {diagnosis?.confidence && (
                    <div className="confidence-overlay-badge">
                      {(diagnosis.confidence * 100).toFixed(0)}% Match
                    </div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  {diagnosis && (
                    <div>
                      <h3 style={{ fontSize: '1.1rem', color: '#991b1b', marginBottom: '0.3rem' }}>
                        {diagnosis.disease}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
                        Severity: <strong>{diagnosis.severity}</strong> | Detected Crop: <strong>{diagnosis.crop_detected || crop}</strong>
                      </p>
                      {explanation && (
                        <p style={{ fontSize: '0.85rem', background: '#f1f5f9', padding: '0.6rem', borderRadius: '8px' }}>
                          {explanation.summary}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <button onClick={handleDiagnose} className="btn-agri" disabled={loading} style={{ marginTop: '1rem' }}>
              {loading ? "Analyzing Leaf Telemetry..." : "Run AI Diagnosis"}
            </button>
          </div>

          {/* Module 2: Mandi Price Trend Analytics */}
          <div id="mandi" className="os-card col-span-5">
            <div className="card-header-flex">
              <h2><TrendingUp size={20} /> Mandi Price Forecast</h2>
              <select value={crop} onChange={(e) => setCrop(e.target.value)} className="lang-select" style={{ width: 'auto', background: '#f8fafc', color: '#0f172a', borderColor: '#cbd5e1' }}>
                <option value="Wheat">Wheat</option>
                <option value="Cotton">Cotton</option>
                <option value="Tomato">Tomato</option>
                <option value="Rice">Rice</option>
              </select>
            </div>

            <div style={{ height: 180, width: '100%', marginTop: '0.5rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartPoints.length > 0 ? chartPoints : [
                  { day: 'Day 1', price: 2450 },
                  { day: 'Day 3', price: 2410 },
                  { day: 'Day 5', price: 2380 },
                  { day: 'Day 7', price: 2340 },
                  { day: 'Next Day 3', price: 2300 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="price" stroke="#15803d" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {priceData && (
              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '0.75rem', borderRadius: '10px', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                <span>Spot Price: <strong>₹{currentPrice}/qtl</strong></span>
                <span>Trend: <strong style={{ color: priceData.trend_direction === 'FALLING' ? '#dc2626' : '#16a34a' }}>{priceData.trend_direction}</strong></span>
              </div>
            )}
            
            <button onClick={() => handleFetchPrice(crop)} className="btn-agri" style={{ marginTop: '0.75rem', background: '#0284c7' }}>
              Refresh Market Feed
            </button>
          </div>

          {/* Module 3: Decision Advisor */}
          <div id="advisor" className="os-card col-span-6">
            <div className="card-header-flex">
              <h2><Scale size={20} /> Smart Sell / Hold Advisor</h2>
            </div>
            
            <button onClick={handleGetAdvice} className="btn-agri" style={{ background: '#7c3aed' }}>
              Synthesize Market & Disease Risk
            </button>

            {advisorResult ? (
              <div className={`advisor-box ${advisorResult.recommendation === "SELL NOW" ? "sell" : "hold"}`}>
                <div className="advisor-badge">{advisorResult.recommendation}</div>
                <p><strong>Risk Rating:</strong> {advisorResult.risk_level}</p>
                <p style={{ marginTop: '0.4rem' }}>{advisorResult.reasoning}</p>
              </div>
            ) : (
              <div className="whatsapp-card" style={{ marginTop: '1rem' }}>
                <div className="wa-header">
                  <span>📱 AgriOS WhatsApp Broadcast Concept</span>
                  <span>LIVE</span>
                </div>
                <div className="wa-bubble">
                  <strong>AgriOS Advisory Bot:</strong> Stripe Rust detected & prices dropping. Heavy rain expected in 48 hrs. Recommendation: <strong>SELL NOW</strong> to avoid yield degradation.
                </div>
              </div>
            )}
          </div>

          {/* Module 4: Voice Companion */}
          <div id="voice" className="os-card col-span-6">
            <div className="card-header-flex">
              <h2><Mic size={20} /> Voice & Chat Assistant</h2>
            </div>

            <div className="chat-window">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`chat-msg ${msg.sender}`}>
                  {msg.text}
                </div>
              ))}
            </div>

            {isRecording && (
              <div className="voice-wave-container">
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
              </div>
            )}

            <form onSubmit={handleTextChat} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <input 
                type="text" 
                placeholder="Ask agronomy or price questions..." 
                value={chatQuery} 
                onChange={(e) => setChatQuery(e.target.value)}
                style={{ flex: 1, padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
              <button type="button" onClick={handleVoiceQuery} style={{ background: '#ec4899', color: '#fff', border: 'none', padding: '0.6rem 0.8rem', borderRadius: '10px', cursor: 'pointer' }}>
                <Mic size={18} />
              </button>
              <button type="submit" className="btn-agri" style={{ width: 'auto', padding: '0.6rem 1rem' }}>
                <Send size={18} />
              </button>
            </form>
          </div>

          {/* Module 5: Canopy Yield Impact Simulator */}
          <div className="os-card col-span-6">
            <div className="card-header-flex">
              <h2><Sprout size={20} /> Canopy Yield Impact Simulator</h2>
            </div>
            
            <label style={{ fontSize: '0.85rem', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
              Adjust Affected Canopy Coverage: <strong>{affectedPercent}%</strong>
            </label>
            <input 
              type="range" 
              min="5" 
              max="100" 
              value={affectedPercent} 
              onChange={(e) => setAffectedPercent(Number(e.target.value))}
            />
            <button onClick={handleRecalculateYield} className="btn-agri" style={{ marginTop: '0.5rem', background: '#15803d' }}>
              Recalculate Loss Metric
            </button>
          </div>

          {/* Module 6: Regional Community Outbreak Monitor */}
          <div className="os-card col-span-6">
            <div className="card-header-flex">
              <h2><ShieldAlert size={20} color="#dc2626" /> Regional Outbreak Radar</h2>
            </div>

            {outbreakData ? (
              <div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  Region: <strong>{outbreakData.region}</strong>
                </p>
                {outbreakData.active_alerts.map((alert, idx) => (
                  <div key={idx} style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.6rem', borderRadius: '8px', marginBottom: '0.4rem', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#991b1b', fontWeight: 700 }}>
                      <span>{alert.crop} - {alert.disease}</span>
                      <span>{alert.risk_level} RISK</span>
                    </div>
                    <span style={{ color: '#4b5563', fontSize: '0.78rem' }}>
                      {alert.cases_reported} reports within {alert.distance_km} km radius
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Loading regional threat matrix...</p>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;