// src/context/LanguageContext.jsx
import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' }
];

export const UI_TRANSLATIONS = {
  en: {
    dashboardTitle: "Farm Intelligence Dashboard",
    dashboardSub: "Real-time computer vision, agronomy intelligence, and price forecasting",
    activeField: "Active Field",
    primaryCrop: "Primary Crop",
    overallHealth: "Overall Field Health Score",
    visionTitle: "Vision AI Crop Diagnosis",
    runDiagnosis: "Run AI Diagnosis",
    mandiTitle: "Mandi Price Forecast",
    spotPrice: "Spot Price",
    trend: "Trend",
    advisorTitle: "Smart Sell / Hold Advisor",
    advisorSub: "Synthesize Market & Disease Risk",
    yieldSimulator: "Canopy Yield Impact Simulator",
    adjustCoverage: "Adjust Affected Canopy Coverage",
    recalculate: "Recalculate Loss Metric",
    outbreakRadar: "Regional Outbreak Radar",
    voiceAssistant: "Voice & Chat Assistant",
    assistantGreeting: "Hello! I am your AgriOS companion. Ask me about crop health or market prices."
  },
  hi: {
    dashboardTitle: "कृषि बुद्धिमत्ता डैशबोर्ड",
    dashboardSub: "वास्तविक समय कंप्यूटर दृष्टि, कृषि विज्ञान ज्ञान और मूल्य पूर्वानुमान",
    activeField: "सक्रिय खेत",
    primaryCrop: "मुख्य फसल",
    overallHealth: "खेत का कुल स्वास्थ्य स्कोर",
    visionTitle: "विजन एआई फसल निदान",
    runDiagnosis: "एआई निदान चलाएं",
    mandiTitle: "मंडी मूल्य पूर्वानुमान",
    spotPrice: "हाजिर मूल्य",
    trend: "रुझान",
    advisorTitle: "स्मार्ट बेचें / रोकें सलाहकार",
    advisorSub: "बाजार और बीमारी के जोखिम का विश्लेषण",
    yieldSimulator: "उपज प्रभाव सिम्युलेटर",
    adjustCoverage: "प्रभावित फसल क्षेत्र समायोजित करें",
    recalculate: "नुकसान की गणना करें",
    outbreakRadar: "क्षेत्रीय प्रकोप राडार",
    voiceAssistant: "वॉइस और चैट सहायक",
    assistantGreeting: "नमस्ते! मैं आपका एग्री-ओएस साथी हूं। फसल स्वास्थ्य या मंडी भाव के बारे में पूछें।"
  },
  kn: {
    dashboardTitle: "ಕೃಷಿ ಜಾಣ್ಮೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    dashboardSub: "ನೈಜ-ಸಮಯದ ಕಂಪ್ಯೂಟರ್ ವಿಷನ್, ಕೃಷಿ ಜ್ಞಾನ ಮತ್ತು ಬೆಲೆ ಮುನ್ಸೂಚನೆ",
    activeField: "ಸಕ್ರಿಯ ಜಮೀನು",
    primaryCrop: "ಮುಖ್ಯ ಬೆಳೆ",
    overallHealth: "ಒಟ್ಟು ಜಮೀನಿನ ಆರೋಗ್ಯ ಸ್ಕೋರ್",
    visionTitle: "ವಿಷನ್ AI ಬೆಳೆ ರೋಗ ಪತ್ತೆ",
    runDiagnosis: "AI ತಪಾಸಣೆ ನಡೆಸಿ",
    mandiTitle: "ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ಮುನ್ಸೂಚನೆ",
    spotPrice: "ಪ್ರಸ್ತುತ ಬೆಲೆ",
    trend: "ಪ್ರವೃತ್ತಿ",
    advisorTitle: "ಮಾರಾಟ / ಕಾಯುವಿಕೆ ಸಲಹೆಗಾರ",
    advisorSub: "ಮಾರುಕಟ್ಟೆ ಮತ್ತು ರೋಗದ ಅಪಾಯದ ವಿಶ್ಲೇಷಣೆ",
    yieldSimulator: "ಇಳುವರಿ ನಷ್ಟದ ಸಿಮ್ಯುಲೇಟರ್",
    adjustCoverage: "ಬಾಧಿತ ಬೆಳೆಯ ಶೇಕಡಾವಾರು ಬದಲಾಯಿಸಿ",
    recalculate: "ಲೆಕ್ಕಾಚಾರ ಮಾಡಿ",
    outbreakRadar: "ಪ್ರಾದೇಶಿಕ ರೋಗ ಎಚ್ಚರಿಕೆ ರೇಡಾರ್",
    voiceAssistant: "ಧ್ವನಿ ಮತ್ತು ಚಾಟ್ ಸಹಾಯಕ",
    assistantGreeting: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯಕ. ಬೆಳೆ ಆರೋಗ್ಯ ಅಥವಾ ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳ ಬಗ್ಗೆ ಕೇಳಿ."
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('en');

  const t = (key) => {
    return UI_TRANSLATIONS[lang]?.[key] || UI_TRANSLATIONS['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);