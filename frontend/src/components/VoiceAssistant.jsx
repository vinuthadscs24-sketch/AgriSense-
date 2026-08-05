import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, VolumeX, Send } from 'lucide-react';
import { sendChatMessage } from '../api';

export default function VoiceAssistant({ lang = 'kn' }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಕೃಷಿ ಸಹಾಯಕ. ಬೆಳೆ ಆರೋಗ್ಯ ಅಥವಾ ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳ ಬಗ್ಗೆ ಕೇಳಿ.' }
  ]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);

  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    // Language mapping
    const langLocales = {
      kn: 'kn-IN', hi: 'hi-IN', te: 'te-IN', ta: 'ta-IN',
      mr: 'mr-IN', bn: 'bn-IN', gu: 'gu-IN', pa: 'pa-IN',
      ml: 'ml-IN', en: 'en-US'
    };
    recognition.lang = langLocales[lang] || 'kn-IN';

    recognition.onresult = (event) => {
      let current = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
    };

    recognition.onerror = (err) => {
      console.error("Mic error:", err);
      setIsListening(false);
    };

    // AUTO-SUBMIT WHEN YOU STOP SPEAKING
    recognition.onend = () => {
      setIsListening(false);
      setTranscript((finalTranscript) => {
        if (finalTranscript && finalTranscript.trim()) {
          handleSend(finalTranscript);
        }
        return '';
      });
    };

    recognitionRef.current = recognition;
  }, [lang]);

  // Toggle Mic
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Please use Google Chrome for voice recognition.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      stopSpeaking();
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Text-To-Speech Output
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const langLocales = {
      kn: 'kn-IN', hi: 'hi-IN', te: 'te-IN', ta: 'ta-IN',
      mr: 'mr-IN', bn: 'bn-IN', gu: 'gu-IN', pa: 'pa-IN',
      ml: 'ml-IN', en: 'en-US'
    };
    utterance.lang = langLocales[lang] || 'kn-IN';
    utterance.rate = 0.9;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Send query to API
  const handleSend = async (textToSend) => {
    const query = textToSend || transcript;
    if (!query || !query.trim()) return;

    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    setTranscript('');
    setLoading(true);

    try {
      const res = await sendChatMessage(query, lang);
      const aiReply = res.reply || res.message || "ಉತ್ತರ ದೊರೆತಿಲ್ಲ.";

      setMessages((prev) => [...prev, { sender: 'ai', text: aiReply }]);
      speakText(aiReply); // SPEAKS KANNADA REPLY OUT LOUD
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { sender: 'ai', text: "ಸರ್ವರ್ ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="os-card col-span-6">
      <div className="card-header-flex">
        <h2><Mic size={20} /> ಧ್ವನಿ ಸಹಾಯಕ</h2>
        {isSpeaking && (
          <button 
            onClick={stopSpeaking} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
            title="Stop Speaking"
          >
            <VolumeX size={20} />
          </button>
        )}
      </div>

      <div className="chat-window" style={{ height: '200px', overflowY: 'auto' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {loading && <div className="chat-msg ai">ಉತ್ತರಿಸಲಾಗುತ್ತಿದೆ...</div>}
      </div>

      {isListening && (
        <div className="voice-wave-container">
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <input
          type="text"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={isListening ? "ಆಲಿಸಲಾಗುತ್ತಿದೆ..." : "ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ..."}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(transcript)}
          style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
        />
        
        <button
          onClick={toggleListening}
          style={{
            background: isListening ? '#dc2626' : '#ec4899',
            color: '#fff',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        <button
          onClick={() => handleSend(transcript)}
          disabled={loading || !transcript.trim()}
          className="btn-agri"
          style={{ width: 'auto', padding: '8px 16px' }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}