import React, { useState, useEffect, useRef } from 'react';
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

import { 
  Sprout, 
  Camera, 
  TrendingUp, 
  Scale, 
  Mic, 
  Activity, 
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

// --- UI Translation Dictionary ---
const TRANSLATIONS = {
  en: {
    visionAi: "Vision AI",
    mandiMarket: "Mandi Market",
    decisionAdvisor: "Decision Advisor",
    voiceAssistant: "Voice Assistant",
    fieldHealth: "Field Health",
    langSelect: "Language / भाषा",
    dashboardTitle: "Farm Intelligence Dashboard",
    dashboardSub: "Real-time computer vision, agronomy intelligence, and price forecasting",
    activeField: "Active Field",
    primaryCrop: "Primary Crop",
    northSector: "North Sector A",
    healthScoreTitle: "Overall Field Health Score",
    healthDefaultSub: "Upload a crop diagnostic photo below to recalculate real-time canopy health.",
    visionTitle: "Vision AI Crop Diagnosis",
    visionSubBadge: "Gemini Vision Powered",
    dragDropText: "Click or drag leaf photo here for scanning",
    match: "Match",
    severityLabel: "Severity",
    detectedCropLabel: "Detected Crop",
    analyzingText: "Analyzing Leaf Telemetry...",
    runDiagnosisBtn: "Run AI Diagnosis",
    mandiTitle: "Mandi Price Forecast",
    spotPrice: "Spot Price",
    trend: "Trend",
    refreshMarket: "Refresh Market Feed",
    advisorTitle: "Smart Sell / Hold Advisor",
    synthesizeBtn: "Synthesize Market & Disease Risk",
    riskRating: "Risk Rating",
    waConcept: "📱 AgriOS WhatsApp Broadcast Concept",
    waDefaultMsg: "AgriOS Advisory Bot: Stripe Rust detected & prices dropping. Heavy rain expected in 48 hrs. Recommendation: SELL NOW to avoid yield degradation.",
    chatPlaceholder: "Ask agronomy or price questions...",
    chatDefaultGreeting: "Hello! I am your AgriOS companion. Ask me about crop health or market prices.",
    yieldSimulatorTitle: "Canopy Yield Impact Simulator",
    adjustCoverage: "Adjust Affected Canopy Coverage",
    recalculateBtn: "Recalculate Loss Metric",
    outbreakRadarTitle: "Regional Outbreak Radar",
    regionLabel: "Region",
    loadingOutbreaks: "Loading regional threat matrix...",
    yieldLossPrefix: "Estimated Yield Loss",
    statusPrefix: "Status",
    falling: "FALLING",
    rising: "RISING",
    highRisk: "HIGH RISK",
    mediumRisk: "MEDIUM RISK",
    lowRisk: "LOW RISK",
    reportsWithin: "reports within",
    radius: "km radius",
    live: "LIVE",
    cropWheat: "Wheat",
    cropCotton: "Cotton",
    cropTomato: "Tomato",
    cropRice: "Rice",
    day1: "Day 1",
    day3: "Day 3",
    day5: "Day 5",
    day7: "Day 7",
    nextDay3: "Next Day 3"
  },
  hi: {
    visionAi: "विजन एआई",
    mandiMarket: "मंडी बाजार",
    decisionAdvisor: "निर्णय सलाहकार",
    voiceAssistant: "वॉइस असिस्टेंट",
    fieldHealth: "खेत स्वास्थ्य",
    langSelect: "भाषा / Language",
    dashboardTitle: "कृषि बुद्धिमत्ता डैशबोर्ड",
    dashboardSub: "वास्तविक समय कंप्यूटर दृष्टि, कृषि विज्ञान ज्ञान और मूल्य पूर्वानुमान",
    activeField: "सक्रिय खेत",
    primaryCrop: "मुख्य फसल",
    northSector: "उत्तर क्षेत्र ए",
    healthScoreTitle: "कुल खेत स्वास्थ्य स्कोर",
    healthDefaultSub: "कैनोपी स्वास्थ्य की गणना के लिए नीचे फसल फोटो अपलोड करें।",
    visionTitle: "विजन एआई फसल निदान",
    visionSubBadge: "जेमिनी एआई द्वारा संचालित",
    dragDropText: "स्कैनिंग के लिए यहां पत्ती की फोटो क्लिक करें या खींचें",
    match: "समानता",
    severityLabel: "गंभीरता",
    detectedCropLabel: "पहचानी गई फसल",
    analyzingText: "पत्ती डेटा का विश्लेषण हो रहा है...",
    runDiagnosisBtn: "एआई निदान चलाएं",
    mandiTitle: "मंडी मूल्य पूर्वानुमान",
    spotPrice: "हाजिर मूल्य",
    trend: "रुझान",
    refreshMarket: "बाजार मूल्य अपडेट करें",
    advisorTitle: "स्मार्ट बेचें / रोकें सलाहकार",
    synthesizeBtn: "बाजार और बीमारी के जोखिम का विश्लेषण करें",
    riskRating: "जोखिम रेटिंग",
    waConcept: "📱 एग्री-ओएस व्हाट्सएप ब्रॉडकास्ट संदेश",
    waDefaultMsg: "एग्री-ओएस बॉट: स्ट्राइप रस्ट की पहचान हुई है और कीमतें गिर रही हैं। 48 घंटों में भारी बारिश की उम्मीद है। सिफारिश: नुकसान से बचने के लिए अभी बेचें।",
    chatPlaceholder: "कृषि या मंडी भाव से जुड़े सवाल पूछें...",
    chatDefaultGreeting: "नमस्ते! मैं आपका एग्री-ओएस साथी हूं। फसल स्वास्थ्य या मंडी भाव के बारे में पूछें।",
    yieldSimulatorTitle: "उपज प्रभाव सिम्युलेटर",
    adjustCoverage: "प्रभावित फसल क्षेत्र समायोजित करें",
    recalculateBtn: "नुकसान की पुनर्गणना करें",
    outbreakRadarTitle: "क्षेत्रीय प्रकोप राडार",
    regionLabel: "क्षेत्र",
    loadingOutbreaks: "क्षेत्रीय बीमारी डेटा लोड हो रहा है...",
    yieldLossPrefix: "अनुमानित उपज हानि",
    statusPrefix: "स्थिति",
    falling: "गिर रहा है",
    rising: "बढ़ रहा है",
    highRisk: "उच्च जोखिम",
    mediumRisk: "मध्यम जोखिम",
    lowRisk: "कम जोखिम",
    reportsWithin: "मामले दर्ज",
    radius: "किमी के दायरे में",
    live: "लाइव",
    cropWheat: "गेहूं",
    cropCotton: "कपास",
    cropTomato: "टमाटर",
    cropRice: "चावल",
    day1: "दिन 1",
    day3: "दिन 3",
    day5: "दिन 5",
    day7: "दिन 7",
    nextDay3: "अगला दिन 3"
  },
  kn: {
    visionAi: "ವಿಷನ್ AI",
    mandiMarket: "ಮಾರುಕಟ್ಟೆ ಬೆಲೆ",
    decisionAdvisor: "ತೀರ್ಮಾನ ಸಲಹೆಗಾರ",
    voiceAssistant: "ಧ್ವನಿ ಸಹಾಯಕ",
    fieldHealth: "ಜಮೀನಿನ ಆರೋಗ್ಯ",
    langSelect: "ಭಾಷೆ / Language",
    dashboardTitle: "ಕೃಷಿ ಜಾಣ್ಮೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    dashboardSub: "ನೈಜ-ಸಮಯದ ಕಂಪ್ಯೂಟರ್ ವಿಷನ್, ಕೃಷಿ ಜ್ಞಾನ ಮತ್ತು ಬೆಲೆ ಮುನ್ಸೂಚನೆ",
    activeField: "ಸಕ್ರಿಯ ಜಮೀನು",
    primaryCrop: "ಮುಖ್ಯ ಬೆಳೆ",
    northSector: "ಉತ್ತರ ವಲಯ A",
    healthScoreTitle: "ಒಟ್ಟು ಜಮೀನಿನ ಆರೋಗ್ಯ ಸ್ಕೋರ್",
    healthDefaultSub: "ಆರೋಗ್ಯವನ್ನು ಲೆಕ್ಕಾಚಾರ ಮಾಡಲು ಕೆಳಗೆ ಎಲೆಯ ಫೋಟೋ ಅಪ್ಲೋಡ್ ಮಾಡಿ.",
    visionTitle: "ವಿಷನ್ AI ಬೆಳೆ ರೋಗ ಪತ್ತೆ",
    visionSubBadge: "ಜೆಮಿನಿ AI ಚಾಲಿತ",
    dragDropText: "ತಪಾಸಣೆಗಾಗಿ ಎಲೆಯ ಫೋಟೋವನ್ನು ಇಲ್ಲಿ ಕ್ಲಿಕ್ ಮಾಡಿ ಅಥವಾ ಹಾಕಿ",
    match: "ಹೊಂದಾಣಿಕೆ",
    severityLabel: "ತೀವ್ರತೆ",
    detectedCropLabel: "ಪತ್ತೆಯಾದ ಬೆಳೆ",
    analyzingText: "ಎಲೆಯ ರೋಗ ತಪಾಸಣೆ ನಡೆಯುತ್ತಿದೆ...",
    runDiagnosisBtn: "AI ತಪಾಸಣೆ ನಡೆಸಿ",
    mandiTitle: "ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ಮುನ್ಸೂಚನೆ",
    spotPrice: "ಪ್ರಸ್ತುತ ಬೆಲೆ",
    trend: "ಪ್ರವೃತ್ತಿ",
    refreshMarket: "ಮಾರುಕಟ್ಟೆ ಮಾಹಿತಿಯನ್ನು ನವೀಕರಿಸಿ",
    advisorTitle: "ಮಾರಾಟ / ಕಾಯುವಿಕೆ ಸಲಹೆಗಾರ",
    synthesizeBtn: "ಮಾರುಕಟ್ಟೆ ಮತ್ತು ರೋಗದ ಅಪಾಯದ ವಿಶ್ಲೇಷಣೆ",
    riskRating: "ಅಪಾಯದ ಮಟ್ಟ",
    waConcept: "📱 AgriOS ವಾಟ್ಸಾಪ್ ಸಂದೇಶ ಪರಿಕಲ್ಪನೆ",
    waDefaultMsg: "AgriOS ಬಾಟ್: ಹಳದಿ ರೋಗ ಪತ್ತೆಯಾಗಿದೆ ಮತ್ತು ಬೆಲೆಗಳು ಕುಸಿಯುತ್ತಿವೆ. 48 ಗಂಟೆಗಳಲ್ಲಿ ಭಾರಿ ಮಳೆಯಾಗುವ ಸಾಧ್ಯತೆಯಿದೆ. ಸಲಹೆ: ನಷ್ಟ ತಪ್ಪಿಸಲು ತಕ್ಷಣ ಮಾರಾಟ ಮಾಡಿ.",
    chatPlaceholder: "ಕೃಷಿ ಅಥವಾ ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳ ಬಗ್ಗೆ ಕೇಳಿ...",
    chatDefaultGreeting: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯಕ. ಬೆಳೆ ಆರೋಗ್ಯ ಅಥವಾ ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳ ಬಗ್ಗೆ ಕೇಳಿ.",
    yieldSimulatorTitle: "ಇಳುವರಿ ನಷ್ಟದ ಸಿಮ್ಯುಲೇಟರ್",
    adjustCoverage: "ಬಾಧಿತ ಬೆಳೆಯ ಶೇಕಡಾವಾರು ಬದಲಾಯಿಸಿ",
    recalculateBtn: "ಮರು ಲೆಕ್ಕಾಚಾರ ಮಾಡಿ",
    outbreakRadarTitle: "ಪ್ರಾದೇಶಿಕ ರೋಗ ಎಚ್ಚರಿಕೆ ರೇಡಾರ್",
    regionLabel: "ಪ್ರದೇಶ",
    loadingOutbreaks: "ಪ್ರಾದೇಶಿಕ ರೋಗದ ಮಾಹಿತಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    yieldLossPrefix: "ಅಂದಾಜು ಇಳುವರಿ ನಷ್ಟ",
    statusPrefix: "ಸ್ಥಿತಿ",
    falling: "ಕುಸಿಯುತ್ತಿದೆ",
    rising: "ಏರಿಕೆಯಾಗುತ್ತಿದೆ",
    highRisk: "ಹೆಚ್ಚಿನ ಅಪಾಯ",
    mediumRisk: "ಮಧ್ಯಮ ಅಪಾಯ",
    lowRisk: "ಕಡಿಮೆ ಅಪಾಯ",
    reportsWithin: "ವರದಿಗಳು",
    radius: "ಕಿಮೀ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ",
    live: "ಲೈವ್",
    cropWheat: "ಗೋಧಿ",
    cropCotton: "ಹತ್ತಿ",
    cropTomato: "ಟೊಮೇಟೊ",
    cropRice: "ಅಕ್ಕಿ",
    day1: "ದಿನ 1",
    day3: "ದಿನ 3",
    day5: "ದಿನ 5",
    day7: "ದಿನ 7",
    nextDay3: "ಮುಂದಿನ ದಿನ 3"
  }
};

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('en');
  const [activeTab, setActiveTab] = useState('vision');
  
  const t = (key) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || key;

  const translateStatus = (statusStr) => {
    if (!statusStr) return '';
    const cleanStr = statusStr.toUpperCase();
    if (cleanStr.includes('FALLING')) return t('falling');
    if (cleanStr.includes('RISING')) return t('rising');
    if (cleanStr.includes('HIGH')) return t('highRisk');
    if (cleanStr.includes('MEDIUM')) return t('mediumRisk');
    if (cleanStr.includes('LOW')) return t('lowRisk');
    return statusStr;
  };

  const [diagnosis, setDiagnosis] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [crop, setCrop] = useState('Wheat');
  const [priceData, setPriceData] = useState(null);
  const [advisorResult, setAdvisorResult] = useState(null);
  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const [yieldData, setYieldData] = useState(null);
  const [affectedPercent, setAffectedPercent] = useState(20);
  const [outbreakData, setOutbreakData] = useState(null);

  const scrollToSection = (sectionId) => {
    setActiveTab(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Inject Google Translate Engine Script automatically for non-listed languages
  useEffect(() => {
    const addGoogleTranslateScript = () => {
      if (!document.getElementById('google-translate-script')) {
        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        document.body.appendChild(script);

        window.googleTranslateElementInit = () => {
          new window.google.translate.TranslateElement(
            { pageLanguage: 'en', autoDisplay: false },
            'google_translate_element'
          );
        };
      }
    };
    addGoogleTranslateScript();
  }, []);

  // Update Google Translate widget when dropdown changes
  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    const selectElem = document.querySelector('.goog-te-combo');
    if (selectElem) {
      selectElem.value = newLang;
      selectElem.dispatchEvent(new Event('change'));
    }
  };

  useEffect(() => {
    setChatHistory([{ sender: 'ai', text: t('chatDefaultGreeting') }]);
    fetchOutbreaks(lang);
  }, [lang]);

  useEffect(() => {
    handleFetchPrice(crop);
  }, [crop]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    let isMounted = true;
    if (diagnosis?.disease) {
      explainDiagnosis(diagnosis.disease, diagnosis.crop_detected || crop, lang)
        .then(res => {
          if (isMounted) setExplanation(res);
        })
        .catch(err => console.error("Language explanation update error:", err));
    }
    return () => { isMounted = false; };
  }, [lang, diagnosis]);

  const fetchOutbreaks = async (targetLang = lang) => {
    try {
      // 1. Request real-time API outbreak data
      const data = await getCommunityOutbreaks(targetLang);

      // 2. Fetch user's live position via Geolocation API
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;

            try {
              // Geocode latitude & longitude to localized district name
              const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
              );
              const geoData = await geoRes.json();

              const detectedLocation =
                geoData.address?.state_district ||
                geoData.address?.county ||
                geoData.address?.city ||
                geoData.address?.state ||
                "Mysuru District";

              setOutbreakData({
                ...(data || {}),
                region: `${detectedLocation} / Southern Region`,
                active_alerts: data?.active_alerts || [
                  { crop: "Tomato", disease: "Early Blight", risk_level: "HIGH RISK", cases_reported: 12, distance_km: 15 },
                  { crop: "Rice", disease: "Blast Disease", risk_level: "MEDIUM RISK", cases_reported: 5, distance_km: 28 }
                ]
              });
            } catch (geoErr) {
              console.warn("Geocoding failed, falling back to default district:", geoErr);
              setOutbreakData({
                ...(data || {}),
                region: data?.region || "Mysuru District / Southern Region",
                active_alerts: data?.active_alerts || [
                  { crop: "Tomato", disease: "Early Blight", risk_level: "HIGH RISK", cases_reported: 12, distance_km: 15 }
                ]
              });
            }
          },
          (geoErr) => {
            console.warn("Geolocation permission denied/failed:", geoErr.message);
            setOutbreakData({
              ...(data || {}),
              region: data?.region || "Mysuru District / Southern Region",
              active_alerts: data?.active_alerts || [
                { crop: "Tomato", disease: "Early Blight", risk_level: "HIGH RISK", cases_reported: 12, distance_km: 15 }
              ]
            });
          }
        );
      } else {
        setOutbreakData({
          ...(data || {}),
          region: data?.region || "Mysuru District / Southern Region",
          active_alerts: data?.active_alerts || [
            { crop: "Tomato", disease: "Early Blight", risk_level: "HIGH RISK", cases_reported: 12, distance_km: 15 }
          ]
        });
      }
    } catch (err) {
      console.error("Outbreak fetch error:", err);
      // Fallback state on network/API failure
      setOutbreakData({
        region: "Mysuru District / Southern Region",
        active_alerts: [
          { crop: "Tomato", disease: "Early Blight", risk_level: "HIGH RISK", cases_reported: 12, distance_km: 15 },
          { crop: "Rice", disease: "Blast Disease", risk_level: "MEDIUM RISK", cases_reported: 5, distance_km: 28 }
        ]
      });
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
      const diagRes = await diagnoseCrop(selectedFile, lang);
      setDiagnosis(diagRes);

      const detectedCrop = diagRes.crop_detected || crop;
      setCrop(detectedCrop);

      if (diagRes && diagRes.disease) {
        const expRes = await explainDiagnosis(diagRes.disease, detectedCrop, lang);
        setExplanation(expRes);

        const severityScore = diagRes.severity === "High" ? 0.8 : diagRes.severity === "Medium" ? 0.5 : 0.2;
        const lossRes = await getYieldLoss(severityScore, affectedPercent, lang);
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
      const lossRes = await getYieldLoss(severityScore, affectedPercent, lang);
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
        "High",
        lang
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

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    const langLocales = {
      hi: 'hi-IN',
      te: 'te-IN',
      ta: 'ta-IN',
      kn: 'kn-IN',
      mr: 'mr-IN',
      bn: 'bn-IN',
      gu: 'gu-IN',
      pa: 'pa-IN',
      ml: 'ml-IN',
      en: 'en-IN'
    };
    recognition.lang = langLocales[lang] || 'en-IN';
    
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
  const chartPoints = Array.isArray(priceData?.data) ? [...priceData.data].reverse() : [];

  return (
    <div className="agri-os-layout">
      {/* Hidden Google Translate Widget */}
      <div id="google_translate_element" style={{ display: 'none' }}></div>

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
            <li className={`nav-item ${activeTab === 'vision' ? 'active' : ''}`} onClick={() => scrollToSection('vision')}>
              <Camera size={18} /> {t('visionAi')}
            </li>
            <li className={`nav-item ${activeTab === 'mandi' ? 'active' : ''}`} onClick={() => scrollToSection('mandi')}>
              <TrendingUp size={18} /> {t('mandiMarket')}
            </li>
            <li className={`nav-item ${activeTab === 'advisor' ? 'active' : ''}`} onClick={() => scrollToSection('advisor')}>
              <Scale size={18} /> {t('decisionAdvisor')}
            </li>
            <li className={`nav-item ${activeTab === 'voice' ? 'active' : ''}`} onClick={() => scrollToSection('voice')}>
              <MessageSquare size={18} /> {t('voiceAssistant')}
            </li>
            <li className={`nav-item ${activeTab === 'health' ? 'active' : ''}`} onClick={() => scrollToSection('health')}>
              <Activity size={18} /> {t('fieldHealth')}
            </li>
          </ul>
        </div>

        <div className="lang-selector-box">
          <label><Globe size={14} style={{ display: 'inline', marginRight: 4 }} /> {t('langSelect')}</label>
          <select value={lang} onChange={(e) => handleLanguageChange(e.target.value)} className="lang-select">
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="mr">ಮರಾಠಿ (Marathi)</option>
            <option value="bn">বাংলা (Bengali)</option>
            <option value="gu">ગુજરાતી (Gujarati)</option>
            <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
            <option value="ml">മലയാളം (Malayalam)</option>
          </select>
        </div>
      </aside>

      {/* Main Area */}
      <main className="main-content">
        <header className="top-farm-banner">
          <div className="banner-title">
            <h1>{t('dashboardTitle')}</h1>
            <p>{t('dashboardSub')}</p>
          </div>
          <div className="farm-metrics-pills">
            <div className="metric-pill">
              <span>{t('activeField')}</span>
              <strong>{t('northSector')}</strong>
            </div>
            <div className="metric-pill">
              <span>{t('primaryCrop')}</span>
              <strong>{t(`crop${crop}`) || crop}</strong>
            </div>
          </div>
        </header>

        {/* Global Field Health Bar */}
        <div id="health" className="health-gauge-card" style={{ '--health-pct': `${yieldData?.field_health_score || 89}%` }}>
          <div className="gauge-circle">
            <span className="gauge-value">{yieldData ? yieldData.field_health_score : 89}%</span>
          </div>
          <div className="gauge-details">
            <h3>{t('healthScoreTitle')}</h3>
            <p>
              {yieldData 
                ? `${t('yieldLossPrefix')}: ~${yieldData.estimated_yield_loss_percent}%. ${t('statusPrefix')}: ${yieldData.status}`
                : t('healthDefaultSub')}
            </p>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Module 1: Vision AI */}
          <div id="vision" className="os-card col-span-7">
            <div className="card-header-flex">
              <h2><Camera size={20} /> {t('visionTitle')}</h2>
              <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '6px', fontWeight: 700 }}>
                {t('visionSubBadge')}
              </span>
            </div>

            <div 
              className="drag-drop-area" 
              role="button"
              tabIndex={0}
              onClick={() => document.getElementById('file-input').click()}
            >
              <input type="file" accept="image/*" onChange={handleFileChange} id="file-input" style={{ display: 'none' }} />
              <Camera size={32} color="#059669" style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {selectedFile ? selectedFile.name : t('dragDropText')}
              </p>
            </div>

            {preview && (
              <div className="diagnosis-overlay-container">
                <div className="preview-wrapper">
                  <img src={preview} alt="Crop Leaf" />
                  {diagnosis?.confidence && (
                    <div className="confidence-overlay-badge">
                      {(diagnosis.confidence * 100).toFixed(0)}% {t('match')}
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
                        {t('severityLabel')}: <strong>{diagnosis.severity}</strong> | {t('detectedCropLabel')}: <strong>{t(`crop${diagnosis.crop_detected || crop}`) || crop}</strong>
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
              {loading ? t('analyzingText') : t('runDiagnosisBtn')}
            </button>
          </div>

          {/* Module 2: Mandi Market */}
          <div id="mandi" className="os-card col-span-5">
            <div className="card-header-flex">
              <h2><TrendingUp size={20} /> {t('mandiTitle')}</h2>
              <select value={crop} onChange={(e) => setCrop(e.target.value)} className="lang-select" style={{ width: 'auto', background: '#f8fafc', color: '#0f172a', borderColor: '#cbd5e1' }}>
                <option value="Wheat">{t('cropWheat')}</option>
                <option value="Cotton">{t('cropCotton')}</option>
                <option value="Tomato">{t('cropTomato')}</option>
                <option value="Rice">{t('cropRice')}</option>
              </select>
            </div>

            <div style={{ height: 180, width: '100%', marginTop: '0.5rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartPoints.length > 0 ? chartPoints.map(pt => ({
                  ...pt,
                  day: pt.day === 'Day 1' ? t('day1') : 
                       pt.day === 'Day 3' ? t('day3') : 
                       pt.day === 'Day 5' ? t('day5') : 
                       pt.day === 'Day 7' ? t('day7') : 
                       pt.day === 'Next Day 3' ? t('nextDay3') : pt.day
                })) : [
                  { day: t('day1'), price: 2450 },
                  { day: t('day3'), price: 2410 },
                  { day: t('day5'), price: 2380 },
                  { day: t('day7'), price: 2340 },
                  { day: t('nextDay3'), price: 2300 },
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
                <span>{t('spotPrice')}: <strong>₹{currentPrice}/qtl</strong></span>
                <span>{t('trend')}: <strong style={{ color: priceData.trend_direction === 'FALLING' ? '#dc2626' : '#16a34a' }}>{translateStatus(priceData.trend_direction)}</strong></span>
              </div>
            )}
            
            <button onClick={() => handleFetchPrice(crop)} className="btn-agri" style={{ marginTop: '0.75rem', background: '#0284c7' }}>
              {t('refreshMarket')}
            </button>
          </div>

          {/* Module 3: Advisor */}
          <div id="advisor" className="os-card col-span-6">
            <div className="card-header-flex">
              <h2><Scale size={20} /> {t('advisorTitle')}</h2>
            </div>
            
            <button onClick={handleGetAdvice} className="btn-agri" style={{ background: '#7c3aed' }}>
              {t('synthesizeBtn')}
            </button>

            {advisorResult ? (
              <div className={`advisor-box ${advisorResult.recommendation?.includes("SELL") ? "sell" : "hold"}`}>
                <div className="advisor-badge">{advisorResult.recommendation}</div>
                <p><strong>{t('riskRating')}:</strong> {translateStatus(advisorResult.risk_level)}</p>
                <p style={{ marginTop: '0.4rem' }}>{advisorResult.reasoning}</p>
                {advisorResult.whatsapp_broadcast && (
                  <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', opacity: 0.9 }}>
                    💬 {advisorResult.whatsapp_broadcast}
                  </div>
                )}
              </div>
            ) : (
              <div className="whatsapp-card" style={{ marginTop: '1rem' }}>
                <div className="wa-header">
                  <span>{t('waConcept')}</span>
                  <span>{t('live')}</span>
                </div>
                <div className="wa-bubble">
                  {t('waDefaultMsg')}
                </div>
              </div>
            )}
          </div>

          {/* Module 4: Voice Assistant */}
          <div id="voice" className="os-card col-span-6">
            <div className="card-header-flex">
              <h2><Mic size={20} /> {t('voiceAssistant')}</h2>
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
                placeholder={t('chatPlaceholder')} 
                value={chatQuery} 
                onChange={(e) => setChatQuery(e.target.value)}
                style={{ flex: 1, padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
              <button type="button" onClick={handleVoiceQuery} style={{ background: isRecording ? '#dc2626' : '#ec4899', color: '#fff', border: 'none', padding: '0.6rem 0.8rem', borderRadius: '10px', cursor: 'pointer' }}>
                <Mic size={18} />
              </button>
              <button type="submit" className="btn-agri" style={{ width: 'auto', padding: '0.6rem 1rem' }}>
                <Send size={18} />
              </button>
            </form>
          </div>

          {/* Module 5: Yield Impact Simulator */}
          <div className="os-card col-span-6">
            <div className="card-header-flex">
              <h2><Sprout size={20} /> {t('yieldSimulatorTitle')}</h2>
            </div>
            
            <label style={{ fontSize: '0.85rem', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
              {t('adjustCoverage')}: <strong>{affectedPercent}%</strong>
            </label>
            <input 
              type="range" 
              min="5" 
              max="100" 
              value={affectedPercent} 
              onChange={(e) => setAffectedPercent(Number(e.target.value))}
            />
            <button onClick={handleRecalculateYield} className="btn-agri" style={{ marginTop: '0.5rem', background: '#15803d' }}>
              {t('recalculateBtn')}
            </button>
          </div>

          {/* Module 6: Regional Outbreak Radar */}
          <div className="os-card col-span-6">
            <div className="card-header-flex">
              <h2><ShieldAlert size={20} color="#dc2626" /> {t('outbreakRadarTitle')}</h2>
            </div>

            {outbreakData ? (
              <div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  {t('regionLabel')}: <strong>{outbreakData.region}</strong>
                </p>
                {outbreakData.active_alerts?.map((alertItem, idx) => (
                  <div key={idx} style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.6rem', borderRadius: '8px', marginBottom: '0.4rem', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#991b1b', fontWeight: 700 }}>
                      <span>{t(`crop${alertItem.crop}`) || alertItem.crop} - {alertItem.disease}</span>
                      <span>{translateStatus(alertItem.risk_level)}</span>
                    </div>
                    <span style={{ color: '#4b5563', fontSize: '0.78rem' }}>
                      {alertItem.cases_reported} {t('reportsWithin')} {alertItem.distance_km} {t('radius')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{t('loadingOutbreaks')}</p>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;