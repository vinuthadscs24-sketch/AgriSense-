// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const Dashboard = () => {
  const { lang, t } = useLanguage();

  // API State
  const [diagnosis, setDiagnosis] = useState(null);
  const [advisory, setAdvisory] = useState(null);
  const [outbreaks, setOutbreaks] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatReply, setChatReply] = useState('');
  const [affectedCoverage, setAffectedCoverage] = useState(20);
  const [yieldLoss, setYieldLoss] = useState(null);

  // Fetch dynamic AI data whenever language changes
  useEffect(() => {
    fetchOutbreaks();
    fetchAdvisory();
    recalculateYieldLoss(affectedCoverage);
  }, [lang]);

  const fetchOutbreaks = async () => {
    try {
      const res = await fetch(`http://localhost:8000/community-outbreaks?language=${lang}`);
      const data = await res.json();
      setOutbreaks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdvisory = async () => {
    try {
      const res = await fetch('http://localhost:8000/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disease: 'Stripe Rust',
          confidence: 0.94,
          perishability: 'High',
          language: lang
        })
      });
      const data = await res.json();
      setAdvisory(data);
    } catch (err) {
      console.error(err);
    }
  };

  const recalculateYieldLoss = async (coverage) => {
    try {
      const res = await fetch('http://localhost:8000/yield-loss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity_score: 0.6,
          affected_percentage: coverage,
          language: lang
        })
      });
      const data = await res.json();
      setYieldLoss(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatMessage, language: lang })
      });
      const data = await res.json();
      setChatReply(data.reply);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-emerald-400">{t('dashboardTitle')}</h1>
        <p className="text-slate-400">{t('dashboardSub')}</p>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
          <p className="text-sm text-slate-400">{t('activeField')}</p>
          <p className="text-xl font-bold">North Sector A</p>
        </div>
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
          <p className="text-sm text-slate-400">{t('primaryCrop')}</p>
          <p className="text-xl font-bold text-emerald-400">Wheat (89% Health)</p>
        </div>
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
          <p className="text-sm text-slate-400">{t('overallHealth')}</p>
          <p className="text-lg font-semibold text-amber-400">
            {yieldLoss ? yieldLoss.recommendation : "Calculating..."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Smart Sell/Hold Advisor */}
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800">
          <h2 className="text-xl font-bold mb-1 text-emerald-400">{t('advisorTitle')}</h2>
          <p className="text-sm text-slate-400 mb-4">{t('advisorSub')}</p>
          
          {advisory && (
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <span className="inline-block px-3 py-1 bg-red-900/60 text-red-300 font-bold rounded-md mb-2">
                {advisory.recommendation}
              </span>
              <p className="text-sm text-slate-300 mb-3">{advisory.reasoning}</p>
              <div className="p-3 bg-slate-900 rounded border border-emerald-900/50 text-emerald-300 text-xs">
                📱 <strong>WhatsApp Alert:</strong> {advisory.whatsapp_broadcast}
              </div>
            </div>
          )}
        </div>

        {/* Regional Outbreak Radar */}
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800">
          <h2 className="text-xl font-bold mb-4 text-emerald-400">{t('outbreakRadar')}</h2>
          {outbreaks && (
            <div>
              <p className="text-sm text-slate-400 mb-3">📍 Region: <strong>{outbreaks.region}</strong></p>
              <div className="space-y-3">
                {outbreaks.active_alerts.map((alert, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{alert.crop} — {alert.disease}</p>
                      <p className="text-xs text-slate-400">{alert.cases_reported} reports within {alert.distance_km} km</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 bg-amber-900/50 text-amber-300 rounded">
                      {alert.risk_level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Canopy Yield Impact Simulator */}
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800">
          <h2 className="text-xl font-bold mb-2 text-emerald-400">{t('yieldSimulator')}</h2>
          <label className="block text-sm text-slate-300 mb-2">
            {t('adjustCoverage')}: <strong>{affectedCoverage}%</strong>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={affectedCoverage}
            onChange={(e) => {
              setAffectedCoverage(Number(e.target.value));
              recalculateYieldLoss(Number(e.target.value));
            }}
            className="w-full accent-emerald-500 mb-4"
          />
          {yieldLoss && (
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <p className="text-sm">Health Score: <strong className="text-emerald-400">{yieldLoss.field_health_score}%</strong></p>
              <p className="text-sm text-slate-300">{yieldLoss.recommendation}</p>
            </div>
          )}
        </div>

        {/* Voice & Chat Assistant */}
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800">
          <h2 className="text-xl font-bold mb-2 text-emerald-400">{t('voiceAssistant')}</h2>
          <p className="text-sm text-slate-400 mb-3">{t('assistantGreeting')}</p>
          
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg"
            >
              Send
            </button>
          </div>

          {chatReply && (
            <div className="p-3 bg-slate-950 rounded-lg border border-emerald-800/50 text-sm text-emerald-200">
              💬 <strong>AgriOS:</strong> {chatReply}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};