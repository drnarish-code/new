import React, { useState, useEffect, useRef } from 'react';
import {
  Monitor,
  Smartphone,
  Settings,
  Users,
  Building2,
  LogOut,
  ChevronRight,
  XCircle,
  Play,
  Volume2,
  Film,
  Image as ImageIcon,
  MapPin,
  Map,
  ShieldAlert,
  Clock,
  UserCheck,
  RotateCcw
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAYwXDITqFSLJaRImMvX0eTOrxhrdCylok",
  authDomain: "pkd-qms.firebaseapp.com",
  databaseURL: "https://pkd-qms-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pkd-qms",
  storageBucket: "pkd-qms.firebasestorage.app",
  messagingSenderId: "121516361841",
  appId: "1:121516361841:web:6625dde82a3ec46c1f73d0",
  measurementId: "G-RWMC278HEC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && (
      event.reason.message?.includes('message channel closed') ||
      event.reason.message?.includes('A listener indicated an asynchronous')
    )) {
      event.preventDefault();
    }
  });
}

const DEFAULT_HIERARCHY = {
  "Pahang": {
    "Pekan": [
      "Klinik Kesihatan Padang Rumbia",
      "Klinik Kesihatan Bandar Pekan",
      "Klinik Kesihatan Temai",
      "Klinik Kesihatan Peramu Jaya",
      "Klinik Kesihatan Nenasi",
      "Klinik Kesihatan Runchang",
      "Klinik Kesihatan Chini",
      "Klinik Komuniti Kuala Pahang"
    ]
  }
};

const DEFAULT_DEPARTMENTS = ["OPD", "MCH", "Farmasi", "Makmal"];

const DEFAULT_MEDIA = [
  { type: 'image', url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=1200' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1200' }
];

const selectActiveStyle = {
  backgroundColor: '#0f172a',
  color: '#f8fafc',
  borderColor: '#334155',
  borderWidth: '1px'
};

const selectDisabledStyle = {
  backgroundColor: '#020617',
  color: '#475569',
  borderColor: '#1e293b',
  borderWidth: '1px',
  cursor: 'not-allowed',
  opacity: 0.6
};

function getQueryParam(name) {
  if (typeof window === 'undefined') return '';
  const match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
  return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : '';
}

function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function pcmToWav(pcm16Data, sampleRate) {
  const buffer = new ArrayBuffer(44 + pcm16Data.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcm16Data.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, pcm16Data.length * 2, true);

  let offset = 44;
  for (let i = 0; i < pcm16Data.length; i++, offset += 2) {
    view.setInt16(offset, pcm16Data[i], true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

const Modal = ({ isOpen, title, message, onConfirm, onCancel, type = 'confirm' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-955/65 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-3xl p-8 w-full max-w-md border border-slate-800 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-300 mb-6 text-sm">{message}</p>
        <div className="flex gap-3">
          {type === 'confirm' && (
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-slate-800 text-slate-200 font-bold rounded-2xl border border-slate-700 hover:bg-slate-700"
            >
              Batal
            </button>
          )}
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"
          >
            {type === 'confirm' ? 'Sahkan' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};

const InputScreen = ({
  hierarchy,
  departments,
  selectedState, setSelectedState,
  selectedDistrict, setSelectedDistrict,
  selectedClinic, setSelectedClinic,
  selectedDept, setSelectedDept,
  setCurrentView, showModal, updateQueueNumber, dbStatus,
  isSuperadmin,
  queues
}) => {
  const [step, setStep] = useState(1);
  const [localRoom, setLocalRoom] = useState('Bilik 1');
  const [currentInput, setCurrentInput] = useState('');

  const statesList = Object.keys(hierarchy || {});
  const districtsList = selectedState ? Object.keys(hierarchy[selectedState] || {}) : [];
  const clinicsList = (selectedState && selectedDistrict) ? (hierarchy[selectedState]?.[selectedDistrict] || []) : [];

  const roomData = queues?.[selectedState]?.[selectedDistrict]?.[selectedClinic]?.[selectedDept]?.[localRoom];
  const activeNumber = roomData && typeof roomData === 'object' ? roomData.number : (roomData || '');
  const hasActiveNumber = activeNumber && activeNumber !== '----' && activeNumber !== '0000';

  const handleCallNext = () => {
    if (!currentInput) {
      showModal('Ralat', 'Sila masukkan nombor giliran.', 'info');
      return;
    }
    showModal(
      'Sahkan Panggilan',
      `Panggil nombor ${currentInput} ke ${localRoom}?`,
      'confirm',
      () => {
        updateQueueNumber(selectedState, selectedDistrict, selectedClinic, selectedDept, localRoom, currentInput);
        setCurrentInput('');
      }
    );
  };

  const handleRedial = () => {
    if (!hasActiveNumber) {
      showModal('Ralat', 'Tiada nombor panggilan aktif untuk dipanggil semula.', 'info');
      return;
    }
    showModal(
      'Panggil Semula',
      `Panggil semula nombor ${activeNumber} ke ${localRoom}?`,
      'confirm',
      () => {
        updateQueueNumber(selectedState, selectedDistrict, selectedClinic, selectedDept, localRoom, activeNumber);
      }
    );
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-slate-955 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-black text-white">Sesi Panggilan</h2>
              <p className="text-xs text-indigo-400 font-bold uppercase mt-0.5 tracking-wider">
                {isSuperadmin ? "Mod Superadmin" : "Mod Kakitangan Terselia"}
              </p>
            </div>
            <button onClick={() => setCurrentView('login')} className="p-2 text-slate-400 hover:text-white bg-slate-850 rounded-xl">
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Negeri</label>
              <select
                disabled={!isSuperadmin}
                style={isSuperadmin ? selectActiveStyle : selectDisabledStyle}
                className="w-full p-3.5 border rounded-2xl outline-none font-semibold focus:ring-2 focus:ring-indigo-500"
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedDistrict('');
                  setSelectedClinic('');
                }}
              >
                <option value="">Pilih Negeri...</option>
                {statesList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Daerah</label>
              <select
                disabled={!isSuperadmin || !selectedState}
                style={(isSuperadmin && selectedState) ? selectActiveStyle : selectDisabledStyle}
                className="w-full p-3.5 border rounded-2xl outline-none font-semibold focus:ring-2 focus:ring-indigo-500"
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setSelectedClinic('');
                }}
              >
                <option value="">Pilih Daerah...</option>
                {districtsList.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Klinik Kesihatan</label>
              <select
                disabled={!isSuperadmin || !selectedDistrict}
                style={(isSuperadmin && selectedDistrict) ? selectActiveStyle : selectDisabledStyle}
                className="w-full p-3.5 border rounded-2xl outline-none font-semibold focus:ring-2 focus:ring-indigo-500"
                value={selectedClinic}
                onChange={(e) => setSelectedClinic(e.target.value)}
              >
                <option value="">Pilih Klinik...</option>
                {clinicsList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Jabatan / Zon</label>
              <select
                style={selectActiveStyle}
                className="w-full p-3.5 border rounded-2xl outline-none font-semibold"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="">Pilih Jabatan...</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Bilik</label>
              <select
                style={selectActiveStyle}
                className="w-full p-3.5 border rounded-2xl outline-none font-semibold"
                value={localRoom}
                onChange={(e) => setLocalRoom(e.target.value)}
              >
                {Array.from({ length: 20 }, (_, i) => (
                  <option key={i} value={`Bilik ${i + 1}`}>Bilik {i + 1}</option>
                ))}
              </select>
            </div>

            <button
              disabled={!selectedState || !selectedDistrict || !selectedClinic || !selectedDept}
              onClick={() => setStep(2)}
              className="w-full py-4 mt-4 bg-indigo-600 text-white font-bold rounded-2xl disabled:opacity-50 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"
            >
              Mula Memanggil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-955 text-white flex flex-col justify-center p-4">
      <div className="w-full max-w-sm mx-auto flex flex-col bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">{selectedDept} • {localRoom}</p>
              <div className={`h-2.5 w-2.5 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
            </div>
            <h1 className="text-xl font-black mt-1 truncate w-48">{selectedClinic}</h1>
            <p className="text-xs text-slate-400 mt-0.5 truncate w-48">{selectedDistrict}, {selectedState}</p>
          </div>
          <button onClick={() => setStep(1)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl">
            <Settings className="h-5 w-5 text-slate-300" />
          </button>
        </div>

        <div className="bg-slate-955 rounded-2xl p-6 mb-6 flex justify-center items-center border border-slate-800 min-h-[120px]">
          <span className="text-6xl font-mono font-black tracking-wider text-indigo-400">
            {currentInput || '----'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => setCurrentInput(prev => (prev.length < 4 ? prev + num : prev))}
              className="bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-2xl py-5 text-2xl font-bold font-mono"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setCurrentInput('')}
            className="bg-rose-950/80 text-rose-300 rounded-2xl py-5 text-lg font-bold border border-rose-900/40"
          >
            CLR
          </button>
          <button
            onClick={() => setCurrentInput(prev => (prev.length < 4 ? prev + '0' : prev))}
            className="bg-slate-800 hover:bg-slate-700 rounded-2xl py-5 text-2xl font-bold font-mono"
          >
            0
          </button>
          <button
            onClick={() => setCurrentInput(prev => prev.slice(0, -1))}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl py-5 text-lg font-bold"
          >
            DEL
          </button>
        </div>

        <div className="flex flex-col space-y-3">
          {hasActiveNumber && (
            <button
              onClick={handleRedial}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 shadow-lg"
            >
              <RotateCcw className="h-5 w-5" />
              <span>Panggil Semula ({activeNumber})</span>
            </button>
          )}

          <button
            onClick={handleCallNext}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center space-x-2 shadow-xl shadow-indigo-950/50"
          >
            <Volume2 className="h-6 w-6" />
            <span>Panggil Nombor</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const OutputScreen = ({
  hierarchy,
  departments,
  selectedState, setSelectedState,
  selectedDistrict, setSelectedDistrict,
  selectedClinic, setSelectedClinic,
  selectedDept, setSelectedDept,
  setCurrentView, queues, mediaList, dbStatus,
  isSuperadmin
}) => {
  const [setupDone, setSetupDone] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [previousQueues, setPreviousQueues] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);

  const audioCtxRef = useRef(null);
  const [highlightedRoom, setHighlightedRoom] = useState(null);
  const videoRefs = useRef({});

  const activeMedia = mediaList[currentMediaIndex] || DEFAULT_MEDIA[0];

  const statesList = Object.keys(hierarchy || {});
  const districtsList = selectedState ? Object.keys(hierarchy[selectedState] || {}) : [];
  const clinicsList = (selectedState && selectedDistrict) ? (hierarchy[selectedState]?.[selectedDistrict] || []) : [];

  const digitToMalay = (char) => {
    const dict = {
      '0': 'kosong', '1': 'satu', '2': 'dua', '3': 'tiga', '4': 'empat',
      '5': 'lima', '6': 'enam', '7': 'tujuh', '8': 'lapan', '9': 'sembilan'
    };
    return dict[char] || char;
  };

  const convertNumberToMalayDigits = (numStr) => {
    return numStr.toString().split('').map(digitToMalay).join(' ');
  };

  const playChime = () => {
    return new Promise((resolve) => {
      try {
        const ctx = audioCtxRef.current;
        if (!ctx) {
          resolve();
          return;
        }
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        gain1.gain.setValueAtTime(0, ctx.currentTime);
        gain1.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.8);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.4);
        gain2.gain.setValueAtTime(0, ctx.currentTime + 0.4);
        gain2.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.45);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
        osc2.start(ctx.currentTime + 0.4);
        osc2.stop(ctx.currentTime + 1.5);

        setTimeout(resolve, 1200);
      } catch (e) {
        console.error("Audio API error", e);
        resolve();
      }
    });
  };

  const speakNumber = async (room, number) => {
    await playChime();

    const malayDigits = convertNumberToMalayDigits(number);
    const textPrompt = `Sebutkan dengan nada yang lembut, tenang dan jelas dalam Bahasa Melayu: Nombor ${malayDigits}, sila ke ${room}.`;

    try {
      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

      const payload = {
        contents: [{ parts: [{ text: textPrompt }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Despina" }
            }
          }
        }
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Gemini TTS API error.");

      const result = await response.json();
      const audioPart = result?.candidates?.[0]?.content?.parts?.[0];
      const audioData = audioPart?.inlineData?.data;
      const mimeType = audioPart?.inlineData?.mimeType || "audio/L16;rate=24000";

      if (audioData) {
        const rateMatch = mimeType.match(/rate=(\d+)/);
        const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

        const rawBuffer = base64ToArrayBuffer(audioData);
        const pcm16 = new Int16Array(rawBuffer);
        const wavBlob = pcmToWav(pcm16, sampleRate);
        const audioUrl = URL.createObjectURL(wavBlob);

        const audio = new Audio(audioUrl);
        audio.play().catch(e => console.warn("Failed playing wave binary", e));
        return;
      }
    } catch (apiError) {
      console.warn("Gemini TTS falling back to native WebSpeech...", apiError);
    }

    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const textToSpeak = `Nombor ${malayDigits}, sila ke ${room}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'ms-MY';

      const voices = window.speechSynthesis.getVoices();
      const malayVoice = voices.find(v => (v.lang.startsWith('ms') || v.lang.startsWith('id')));
      if (malayVoice) utterance.voice = malayVoice;

      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    } catch (fallbackError) {
      console.warn("TTS fallback failed.", fallbackError);
    }
  };

  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  useEffect(() => {
    if (!setupDone || !selectedState || !selectedDistrict || !selectedClinic || !selectedDept) return;

    const currentData = queues[selectedState]?.[selectedDistrict]?.[selectedClinic]?.[selectedDept];
    if (!currentData) return;

    const getNum = (val) => {
      if (!val) return '';
      return typeof val === 'object' ? val.number : val;
    };
    const getTs = (val) => {
      if (!val) return 0;
      return typeof val === 'object' ? val.timestamp : 0;
    };

    if (!previousQueues) {
      setPreviousQueues(JSON.parse(JSON.stringify(currentData)));
      const initial = Object.entries(currentData)
        .map(([room, val]) => ({ room, number: getNum(val), timestamp: getTs(val) }))
        .filter(({ number }) => number !== "0000" && number !== "----")
        .slice(0, 4);
      setRecentCalls(initial);
      return;
    }

    let roomChanged = null;
    let newNumber = null;

    for (const [room, val] of Object.entries(currentData)) {
      const prevVal = previousQueues[room];
      const currentNum = getNum(val);
      const prevNum = getNum(prevVal);
      const currentTs = getTs(val);
      const prevTs = getTs(prevVal);

      if (
        currentNum !== prevNum ||
        (currentNum === prevNum && currentTs > prevTs && currentNum !== "0000" && currentNum !== "----")
      ) {
        roomChanged = room;
        newNumber = currentNum;
        break;
      }
    }

    if (roomChanged && newNumber && newNumber !== "0000") {
      speakNumber(roomChanged, newNumber);
      setHighlightedRoom(roomChanged);
      setTimeout(() => setHighlightedRoom(null), 1500);

      setRecentCalls(prev => {
        const filteredList = prev.filter(call => call.room !== roomChanged);
        return [{ room: roomChanged, number: newNumber }, ...filteredList].slice(0, 4);
      });
    }
    setPreviousQueues(JSON.parse(JSON.stringify(currentData)));

  }, [queues, setupDone, selectedState, selectedDistrict, selectedClinic, selectedDept, previousQueues]);

  useEffect(() => {
    if (currentMediaIndex >= mediaList.length) setCurrentMediaIndex(0);
  }, [mediaList.length, currentMediaIndex]);

  useEffect(() => {
    if (!setupDone || mediaList.length === 0) return;
    if (activeMedia && activeMedia.type === 'video') return;

    const timer = setTimeout(() => {
      setCurrentMediaIndex(prev => (prev + 1) % mediaList.length);
    }, 12000);

    return () => clearTimeout(timer);
  }, [setupDone, currentMediaIndex, mediaList, activeMedia]);

  useEffect(() => {
    if (!setupDone) return;

    Object.keys(videoRefs.current).forEach(key => {
      const vid = videoRefs.current[key];
      if (vid) {
        try {
          vid.pause();
          vid.currentTime = 0;
        } catch (e) { }
      }
    });

    if (activeMedia && activeMedia.type === 'video') {
      const activeVideo = videoRefs.current[`${activeMedia.url}-${currentMediaIndex}`];
      if (activeVideo) {
        activeVideo.play().catch((err) => {
          console.warn("Autoplay was prevented.", err);
        });
      }
    }
  }, [currentMediaIndex, activeMedia, setupDone]);

  const handleStartTV = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext && !audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.getVoices();
      const silentCheck = new SpeechSynthesisUtterance("");
      silentCheck.volume = 0;
      window.speechSynthesis.speak(silentCheck);
    }
    // Save chosen department to localstorage to avoid re-asking on TV reboots
    localStorage.setItem('qms_tv_cached_dept', selectedDept);
    setSetupDone(true);
  };

  useEffect(() => {
    const isBypassMode = getQueryParam('mode') === 'tv';
    if (isBypassMode && selectedState && selectedDistrict && selectedClinic) {
      const cachedDept = localStorage.getItem('qms_tv_cached_dept');
      if (cachedDept) {
        setSelectedDept(cachedDept);
        setSetupDone(true);
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext && !audioCtxRef.current) {
          audioCtxRef.current = new AudioContext();
        }
      }
    }
  }, [selectedState, selectedDistrict, selectedClinic]);

  const handleClearSetupAndReset = () => {
    localStorage.removeItem('qms_tv_cached_dept');
    setSetupDone(false);
  };

  if (!setupDone) {
    return (
      <div className="min-h-screen bg-slate-955 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 text-white animate-in fade-in zoom-in duration-300">
          <h2 className="text-2xl font-black text-center text-white">Konfigurasi TV Display</h2>
          <p className="text-xs text-indigo-400 text-center uppercase tracking-wider mb-6 font-bold">
            {isSuperadmin ? "Mod Superadmin" : "Mod Kakitangan Terselia"}
          </p>

          <div className="space-y-5">
            {isSuperadmin ? (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">Negeri</label>
                  <select
                    style={selectActiveStyle}
                    className="w-full p-4 border rounded-2xl text-white outline-none focus:ring-4 focus:ring-indigo-500"
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value);
                      setSelectedDistrict('');
                      setSelectedClinic('');
                    }}
                  >
                    <option value="">Pilih...</option>
                    {statesList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">Daerah</label>
                  <select
                    disabled={!selectedState}
                    style={selectedState ? selectActiveStyle : selectDisabledStyle}
                    className="w-full p-4 border rounded-2xl text-white outline-none focus:ring-4 focus:ring-indigo-500"
                    value={selectedDistrict}
                    onChange={(e) => {
                      setSelectedDistrict(e.target.value);
                      setSelectedClinic('');
                    }}
                  >
                    <option value="">Pilih...</option>
                    {districtsList.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">Klinik Kesihatan</label>
                  <select
                    disabled={!selectedDistrict}
                    style={selectedDistrict ? selectActiveStyle : selectDisabledStyle}
                    className="w-full p-4 border rounded-2xl text-white outline-none focus:ring-4 focus:ring-indigo-500"
                    value={selectedClinic}
                    onChange={(e) => setSelectedClinic(e.target.value)}
                  >
                    <option value="">Pilih...</option>
                    {clinicsList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <div className="p-4 bg-slate-955 border border-slate-800 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Lokasi Bertugas Diluluskan:</p>
                <p className="text-base font-bold text-white leading-tight">{selectedClinic}</p>
                <p className="text-xs text-slate-400 font-semibold">{selectedDistrict}, {selectedState}</p>
              </div>
            )}

            <div>
              <label htmlFor="dept-spinner" className="block text-sm font-semibold text-slate-400 mb-2">PILIH JABATAN / ZON</label>
              <select
                id="dept-spinner"
                style={selectActiveStyle}
                className="w-full p-4 border rounded-2xl text-white outline-none focus:ring-4 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="">Pilih Jabatan...</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="pt-4 flex space-x-3">
              <button
                onClick={() => setCurrentView('login')}
                className="flex-1 py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-colors focus:ring-4 focus:ring-slate-500 focus:outline-none"
              >
                Kembali
              </button>
              <button
                disabled={!selectedState || !selectedDistrict || !selectedClinic || !selectedDept}
                onClick={handleStartTV}
                className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl disabled:opacity-50 hover:bg-indigo-500 flex items-center justify-center transition-colors shadow-lg focus:ring-4 focus:ring-indigo-500 focus:outline-none"
              >
                <Play className="h-5 w-5 mr-2" /> Mula TV
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden font-sans">
      <header className="bg-slate-900 border-b border-slate-800 px-8 py-6 flex justify-between items-center shadow-lg relative z-20">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-indigo-400 tracking-wide uppercase">
            Pejabat Kesihatan Daerah
          </h1>
          <h2 className="text-xl md:text-4xl font-bold text-white mt-2 uppercase">
            {selectedClinic} - {selectedDept}
          </h2>
          <p className="text-sm text-slate-400 mt-1 uppercase font-semibold">{selectedDistrict}, {selectedState}</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="flex items-center space-x-2 mb-1">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
            <p className="text-slate-400 text-sm font-semibold tracking-widest uppercase">Sistem QMS</p>
          </div>
          <button
            onClick={handleClearSetupAndReset}
            className="text-xs bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-slate-300 transition-all font-semibold"
          >
            Tukar Jabatan
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row relative z-10">
        <div className="flex-1 relative bg-slate-955 flex items-center justify-center overflow-hidden">
          {mediaList.map((media, index) => (
            media.type === 'video' ? (
              <video
                key={`${media.url}-${index}`}
                src={media.url}
                muted
                playsInline
                onEnded={() => setCurrentMediaIndex(prev => (prev + 1) % mediaList.length)}
                ref={el => { videoRefs.current[`${media.url}-${index}`] = el; }}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${index === currentMediaIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
              />
            ) : (
              <img
                key={`${media.url}-${index}`}
                src={media.url}
                alt="Gallery"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${index === currentMediaIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
              />
            )
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none z-10" />
          <div className="absolute bottom-10 left-10 z-10">
            <p className="text-white/80 text-2xl font-semibold bg-black/40 px-6 py-3 rounded-2xl backdrop-blur-md shadow-xl border border-white/10">
              Sila tunggu nombor anda dipanggil
            </p>
          </div>
        </div>

        <div className="w-full md:w-[500px] lg:w-[600px] bg-slate-900 border-l border-slate-800 flex flex-col relative z-20 shadow-2xl">
          <div className="grid grid-cols-2 bg-slate-800 py-6 px-8 border-b border-slate-700 shadow-md">
            <h3 className="text-2xl font-black text-slate-300 uppercase tracking-wider">Bilik</h3>
            <h3 className="text-2xl font-black text-slate-300 uppercase tracking-wider text-right">Nombor</h3>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col bg-slate-955">
            {recentCalls.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-600 text-2xl font-semibold font-sans">
                Tiada panggilan
              </div>
            ) : (
              recentCalls.map((call, index) => (
                <div
                  key={call.room}
                  className={`grid grid-cols-2 py-10 px-8 border-b border-slate-800 items-center transition-all duration-700 ${index === 0
                      ? (highlightedRoom === call.room ? 'bg-indigo-600 border-l-8 border-l-white scale-[1.02] shadow-2xl z-10' : 'bg-indigo-900/30 border-l-8 border-l-indigo-500 shadow-inner')
                      : 'bg-slate-900/40'
                    }`}
                >
                  <div className={`text-4xl font-bold transition-colors duration-700 ${index === 0 ? (highlightedRoom === call.room ? 'text-white font-black' : 'text-indigo-400 font-bold drop-shadow-md') : 'text-emerald-500/80'}`}>
                    {call.room}
                  </div>
                  <div className={`text-7xl font-extrabold text-right tracking-wider tabular-nums transition-colors duration-700 ${index === 0
                      ? (highlightedRoom === call.room ? 'text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.8)]' : 'text-white drop-shadow-[0_0_20px_rgba(99,102,241,0.6)]')
                      : 'text-slate-400'
                    }`}>
                    {call.number}
                  </div>
                </div>
              ))
            )}
            <div className="flex-1"></div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState('login');
  const [hierarchy, setHierarchy] = useState(DEFAULT_HIERARCHY);
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [mediaList, setMediaList] = useState(DEFAULT_MEDIA);
  const [queues, setQueues] = useState({});
  const [userPermissions, setUserPermissions] = useState(null);

  const [newClinicName, setNewClinicName] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState('image');

  const [newHierarchyState, setNewHierarchyState] = useState('');
  const [newHierarchyDistrict, setNewHierarchyDistrict] = useState('');
  const [adminSelectedState, setAdminSelectedState] = useState('');
  const [adminSelectedDistrict, setAdminSelectedDistrict] = useState('');

  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedClinic, setSelectedClinic] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null, onCancel: null });
  const [dbStatus, setDbStatus] = useState('connecting');

  const getDocRef = () => doc(db, 'qms', 'state');

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
        }
      })
      .catch((error) => {
        console.error("Redirect auth parsing failed:", error);
      });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const isTvMode = getQueryParam('mode') === 'tv';
    if (!isTvMode || !user || !userPermissions) return;

    const myPerm = userPermissions[user.uid];
    if (myPerm && myPerm.status === 'approved') {
      setSelectedState(myPerm.assignedState || '');
      setSelectedDistrict(myPerm.assignedDistrict || '');
      setSelectedClinic(myPerm.assignedClinic || '');

      const bDept = getQueryParam('dept') || 'OPD';
      setSelectedDept(bDept);

      setCurrentView('output');
    }
  }, [user, userPermissions]);

  useEffect(() => {
    if (!user || !userPermissions) return;
    const isSuper = user.email === 'dr.narish@gmail.com';
    if (isSuper) return;

    if (!userPermissions[user.uid]) {
      setDoc(doc(db, 'qms', 'users'), {
        [user.uid]: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Kakitangan',
          photoURL: user.photoURL || '',
          status: 'pending',
          assignedState: '',
          assignedDistrict: '',
          assignedClinic: ''
        }
      }, { merge: true }).catch((err) => console.error("Write profile error:", err));
    }
  }, [user, userPermissions]);

  useEffect(() => {
    if (!user || !userPermissions) return;
    const isSuper = user.email === 'dr.narish@gmail.com';
    if (isSuper) return;

    const myPerm = userPermissions[user.uid];
    if (myPerm && myPerm.status === 'approved') {
      setSelectedState(myPerm.assignedState || '');
      setSelectedDistrict(myPerm.assignedDistrict || '');
      setSelectedClinic(myPerm.assignedClinic || '');
    }
  }, [user, userPermissions]);

  useEffect(() => {
    const isTvBypass = getQueryParam('mode') === 'tv';
    if (!user && !isTvBypass) return;

    const qmsDocRef = getDocRef();
    const configRef = doc(db, 'qms', 'config');
    const usersRef = doc(db, 'qms', 'users');

    const unsubConfig = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.hierarchy) setHierarchy(data.hierarchy);
        if (data.departments) setDepartments(data.departments);
        if (data.media) setMediaList(data.media);
      } else {
        setDoc(configRef, { hierarchy: DEFAULT_HIERARCHY, departments: DEFAULT_DEPARTMENTS, media: DEFAULT_MEDIA }, { merge: true })
          .catch((err) => console.error("Init config error:", err));
      }
    }, (error) => {
      console.error("Config load error:", error);
    });

    const unsubUsers = onSnapshot(usersRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserPermissions(docSnap.data());
      } else {
        setUserPermissions({});
      }
    }, (error) => {
      console.error("Users sync error:", error);
      setUserPermissions({});
    });

    const unsubQueues = onSnapshot(
      qmsDocRef,
      (docSnap) => {
        setDbStatus('connected');
        if (docSnap.exists()) {
          setQueues(prev => ({ ...prev, ...docSnap.data() }));
        }
      },
      (error) => {
        console.error("Queues sync error:", error);
        setDbStatus('error');
      }
    );

    return () => {
      unsubConfig();
      unsubUsers();
      unsubQueues();
    };
  }, [user]);

  const showModal = (title, message, type, onConfirm) => {
    setModalConfig({
      isOpen: true, title, message, type,
      onConfirm: () => {
        if (onConfirm) onConfirm();
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleGoogleLogin = async () => {
    try {
      const isTvMode = getQueryParam('mode') === 'tv';
      if (isTvMode) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error) {
      console.error("Google login failed:", error);
      showModal("Daftar Masuk Gagal", "Sila cuba lagi. " + error.message, "info");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentView('login');
      setSelectedState('');
      setSelectedDistrict('');
      setSelectedClinic('');
      setSelectedDept('');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const updateQueueNumber = async (stateVal, districtVal, clinicVal, deptVal, roomVal, newNumber) => {
    if (!user) return showModal("Ralat", "Sila log masuk dahulu.", "info");

    const timestamp = Date.now();
    const updatedQueues = { ...queues };
    if (!updatedQueues[stateVal]) updatedQueues[stateVal] = {};
    if (!updatedQueues[stateVal][districtVal]) updatedQueues[stateVal][districtVal] = {};
    if (!updatedQueues[stateVal][districtVal][clinicVal]) updatedQueues[stateVal][districtVal][clinicVal] = {};
    if (!updatedQueues[stateVal][districtVal][clinicVal][deptVal]) updatedQueues[stateVal][districtVal][clinicVal][deptVal] = {};

    updatedQueues[stateVal][districtVal][clinicVal][deptVal][roomVal] = { number: newNumber, timestamp };
    setQueues(updatedQueues);

    try {
      await setDoc(getDocRef(), {
        [stateVal]: {
          [districtVal]: {
            [clinicVal]: {
              [deptVal]: {
                [roomVal]: {
                  number: newNumber,
                  timestamp
                }
              }
            }
          }
        }
      }, { merge: true });
    } catch (err) {
      console.error("Failed to update database:", err);
      showModal("Database Error", "Error: " + err.message, "info");
    }
  };

  const addState = async () => {
    if (!newHierarchyState.trim()) return;
    const cleanStateName = newHierarchyState.trim();
    if (hierarchy[cleanStateName]) {
      showModal("Info", "Negeri ini sudah wujud.", "info");
      return;
    }
    const updatedHierarchy = { ...hierarchy, [cleanStateName]: {} };
    setHierarchy(updatedHierarchy);
    setNewHierarchyState('');
    await setDoc(doc(db, 'qms', 'config'), { hierarchy: updatedHierarchy }, { merge: true });
  };

  const removeState = async (stateToRemove) => {
    showModal('Padam Negeri', `Padam negeri ${stateToRemove} dan semua daerah & klinik di bawahnya?`, 'confirm', async () => {
      const updatedHierarchy = { ...hierarchy };
      delete updatedHierarchy[stateToRemove];
      setHierarchy(updatedHierarchy);
      if (adminSelectedState === stateToRemove) {
        setAdminSelectedState('');
        setAdminSelectedDistrict('');
      }
      await setDoc(doc(db, 'qms', 'config'), { hierarchy: updatedHierarchy }, { merge: true });
    });
  };

  const addDistrict = async () => {
    if (!adminSelectedState || !newHierarchyDistrict.trim()) return;
    const cleanDistrictName = newHierarchyDistrict.trim();
    const stateObj = hierarchy[adminSelectedState] || {};
    if (stateObj[cleanDistrictName]) {
      showModal("Info", "Daerah ini sudah wujud dalam negeri ini.", "info");
      return;
    }
    const updatedHierarchy = {
      ...hierarchy,
      [adminSelectedState]: {
        ...stateObj,
        [cleanDistrictName]: []
      }
    };
    setHierarchy(updatedHierarchy);
    setNewHierarchyDistrict('');
    await setDoc(doc(db, 'qms', 'config'), { hierarchy: updatedHierarchy }, { merge: true });
  };

  const removeDistrict = async (districtToRemove) => {
    showModal('Padam Daerah', `Padam daerah ${districtToRemove} dan semua klinik di bawahnya?`, 'confirm', async () => {
      const updatedHierarchy = { ...hierarchy };
      delete updatedHierarchy[adminSelectedState][districtToRemove];
      setHierarchy(updatedHierarchy);
      if (adminSelectedDistrict === districtToRemove) {
        setAdminSelectedDistrict('');
      }
      await setDoc(doc(db, 'qms', 'config'), { hierarchy: updatedHierarchy }, { merge: true });
    });
  };

  const addClinic = async () => {
    if (!adminSelectedState || !adminSelectedDistrict || !newClinicName.trim()) return;
    const cleanClinicName = newClinicName.trim();
    const currentClinics = hierarchy[adminSelectedState]?.[adminSelectedDistrict] || [];
    if (currentClinics.includes(cleanClinicName)) {
      showModal("Info", "Klinik ini sudah wujud dalam daerah ini.", "info");
      return;
    }
    const updatedHierarchy = {
      ...hierarchy,
      [adminSelectedState]: {
        ...hierarchy[adminSelectedState],
        [adminSelectedDistrict]: [...currentClinics, cleanClinicName]
      }
    };
    setHierarchy(updatedHierarchy);
    setNewClinicName('');
    await setDoc(doc(db, 'qms', 'config'), { hierarchy: updatedHierarchy }, { merge: true });
  };

  const removeClinic = async (clinicToRemove) => {
    showModal('Padam Klinik', `Padam klinik ${clinicToRemove}?`, 'confirm', async () => {
      const updatedClinics = (hierarchy[adminSelectedState]?.[adminSelectedDistrict] || []).filter(c => c !== clinicToRemove);
      const updatedHierarchy = {
        ...hierarchy,
        [adminSelectedState]: {
          ...hierarchy[adminSelectedState],
          [adminSelectedDistrict]: updatedClinics
        }
      };
      setHierarchy(updatedHierarchy);
      await setDoc(doc(db, 'qms', 'config'), { hierarchy: updatedHierarchy }, { merge: true });
    });
  };

  const addDepartment = async () => {
    if (!newDeptName.trim()) return;
    const updatedDepts = [...departments, newDeptName.trim()];
    setDepartments(updatedDepts);
    setNewDeptName('');
    await setDoc(doc(db, 'qms', 'config'), { departments: updatedDepts }, { merge: true });
  };

  const removeDepartment = async (deptToRemove) => {
    showModal('Padam', `Pasti mahu memadam ${deptToRemove}?`, 'confirm', async () => {
      const updatedDepts = departments.filter(d => d !== deptToRemove);
      setDepartments(updatedDepts);
      await setDoc(doc(db, 'qms', 'config'), { departments: updatedDepts }, { merge: true });
    });
  };

  const addMedia = async () => {
    if (!newMediaUrl.trim()) return;
    const updatedMedia = [...mediaList, { url: newMediaUrl.trim(), type: newMediaType }];
    setMediaList(updatedMedia);
    setNewMediaUrl('');
    await setDoc(doc(db, 'qms', 'config'), { media: updatedMedia }, { merge: true });
  };

  const removeMedia = async (idxToRemove) => {
    showModal('Padam Media', `Pasti mahu memadam media ini dari playlist?`, 'confirm', async () => {
      const updatedMedia = mediaList.filter((_, idx) => idx !== idxToRemove);
      setMediaList(updatedMedia);
      await setDoc(doc(db, 'qms', 'config'), { media: updatedMedia }, { merge: true });
    });
  };

  const updateUserStatus = async (uid, status) => {
    await setDoc(doc(db, 'qms', 'users'), {
      [uid]: { status }
    }, { merge: true });
  };

  const updateUserAssignment = async (uid, field, value) => {
    await setDoc(doc(db, 'qms', 'users'), {
      [uid]: { [field]: value }
    }, { merge: true });
  };

  const deleteUserRecord = async (uid) => {
    showModal('Padam Kakitangan', 'Padam rekod pendaftaran kakitangan ini?', 'confirm', async () => {
      const updatedPermissions = { ...userPermissions };
      delete updatedPermissions[uid];
      await setDoc(doc(db, 'qms', 'users'), updatedPermissions);
    });
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-955 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-955 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 bg-slate-900 p-8 rounded-[32px] shadow-2xl border border-slate-800 text-center animate-in fade-in zoom-in duration-350">
          <div className="mx-auto h-20 w-20 bg-indigo-650 rounded-full flex items-center justify-center shadow-xl shadow-indigo-950/50 mb-6">
            <svg className="h-10 w-10 text-white animate-pulse" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight leading-none">PKD QMS Gateway</h2>
          <p className="mt-2 text-sm text-slate-400 mb-8 font-semibold">Sistem Pengurusan Giliran Bersepadu & Kawalan Akses</p>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center space-x-3 py-4 bg-slate-955 border-2 border-slate-850 rounded-2xl hover:bg-slate-850 hover:border-indigo-500 transition-all shadow-sm group"
          >
            <svg className="w-6 h-6 group-hover:scale-105 transition-transform" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            <span className="text-white font-extrabold text-base">Log Masuk dengan Google</span>
          </button>
        </div>
        <Modal {...modalConfig} />
      </div>
    );
  }

  const isSuperadmin = user.email === 'dr.narish@gmail.com';
  const myPermission = userPermissions ? userPermissions[user.uid] : null;

  if (!isSuperadmin && (!myPermission || myPermission.status !== 'approved')) {
    const isRejected = myPermission?.status === 'rejected';
    return (
      <div className="min-h-screen bg-slate-955 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 p-8 rounded-[32px] shadow-2xl border border-slate-800 text-center space-y-6">
          <div className="mx-auto h-20 w-20 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            {isRejected ? (
              <div className="h-full w-full bg-rose-950 text-rose-500 rounded-full flex items-center justify-center border border-rose-900/30">
                <ShieldAlert className="h-10 w-10" />
              </div>
            ) : (
              <div className="h-full w-full bg-amber-950 text-amber-500 rounded-full flex items-center justify-center border border-amber-900/30">
                <Clock className="h-10 w-10" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">
              {isRejected ? "Akses Ditolak" : "Akses Menunggu Kelulusan"}
            </h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              {isRejected
                ? "Maaf, akses akaun anda ke sistem QMS telah ditolak. Sila hubungi pentadbir sistem untuk maklumat lanjut."
                : "Akaun anda berjaya didaftarkan! Namun, akses anda perlu diluluskan dan diberikan penetapan klinik terlebih dahulu."
              }
            </p>
          </div>

          <div className="bg-slate-955 p-4 rounded-2xl border border-slate-800 flex items-center space-x-3 text-left">
            <img src={user.photoURL} alt="Profile" className="h-12 w-12 rounded-full border border-slate-850 shadow-sm" />
            <div className="overflow-hidden">
              <p className="font-bold text-white truncate">{user.displayName}</p>
              <p className="text-xs text-slate-500 truncate font-semibold">{user.email}</p>
            </div>
          </div>

          {!isRejected && (
            <div className="bg-indigo-950/50 border border-indigo-900/30 text-indigo-400 text-xs py-3 px-4 rounded-xl font-bold">
              Tip: Maklumkan kepada Dr. Narish untuk mengesahkan akaun anda sekarang!
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-colors"
          >
            Log Keluar dari Akaun
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-slate-955 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-200">
          <div className="text-center bg-slate-900 p-6 rounded-[32px] shadow-xl border border-slate-800">
            <div className="mx-auto h-16 w-16 mb-4 relative">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profil" className="h-full w-full rounded-full shadow-md border border-slate-700" />
              ) : (
                <div className="h-full w-full bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
                  <Users className="h-8 w-8 text-white" />
                </div>
              )}
              <span className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-slate-900 ${isSuperadmin ? 'bg-purple-500' : 'bg-emerald-500'}`} />
            </div>
            <h2 className="text-2xl font-extrabold text-white leading-tight">Hai, {user.displayName || 'Kakitangan'}</h2>
            <p className="text-sm font-semibold text-slate-400 mt-1">{user.email}</p>
            {!isSuperadmin && myPermission && (
              <div className="mt-3 inline-flex items-center space-x-1.5 bg-emerald-950/40 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-900/30">
                <UserCheck className="h-3.5 w-3.5" />
                <span>KK: {myPermission.assignedClinic || 'Belum ditetapkan'}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="block mx-auto mt-5 text-xs font-bold px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-rose-950 hover:text-rose-400 transition-colors"
            >
              Log Keluar
            </button>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => {
                if (isSuperadmin) {
                  setCurrentView('admin');
                } else {
                  showModal('Akses Ditolak', 'Hanya Superadmin dibenarkan untuk mengakses portal ini.', 'info');
                }
              }}
              className="w-full flex items-center justify-between p-5 bg-slate-900 border-2 border-slate-850 rounded-2xl shadow-sm hover:border-purple-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center">
                <div className="h-12 w-12 bg-purple-950 rounded-xl flex items-center justify-center text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Settings className="h-6 w-6" />
                </div>
                <div className="ml-4 text-left">
                  <p className="text-lg font-bold text-white">Superadmin Portal</p>
                  <p className="text-sm text-slate-500">Konfigurasi & Kelulusan Kakitangan</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-purple-500" />
            </button>

            <button
              onClick={() => setCurrentView('input')}
              className="w-full flex items-center justify-between p-5 bg-slate-900 border-2 border-slate-850 rounded-2xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center">
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div className="ml-4 text-left">
                  <p className="text-lg font-bold text-white">Portal Staf (Input)</p>
                  <p className="text-sm text-slate-500">Panggil nombor giliran pesakit</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500" />
            </button>

            <button
              onClick={() => setCurrentView('output')}
              className="w-full flex items-center justify-between p-5 bg-slate-900 border-2 border-slate-850 rounded-2xl shadow-sm hover:border-emerald-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center">
                <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Monitor className="h-6 w-6" />
                </div>
                <div className="ml-4 text-left">
                  <p className="text-lg font-bold text-white">Skrin TV (Output)</p>
                  <p className="text-sm text-slate-500">Paparan ruang menunggu pesakit</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-500" />
            </button>
          </div>
        </div>
        <Modal {...modalConfig} />
      </div>
    );
  }

  return (
    <>
      {currentView === 'admin' && (
        <div className="min-h-screen bg-slate-955 flex flex-col text-white">
          <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
            <div>
              <h1 className="text-xl font-bold text-white">Dashboard Superadmin</h1>
              <p className="text-sm text-slate-400">Konfigurasi Wilayah, Playlist & Kawalan Kakitangan</p>
            </div>
            <button onClick={() => setCurrentView('login')} className="px-4 py-2 text-sm font-semibold bg-slate-800 hover:bg-slate-700 rounded-lg">
              Kembali
            </button>
          </header>

          <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-8">
            <section className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6 space-y-6">
              <div className="flex items-center mb-2">
                <Users className="h-6 w-6 text-indigo-450 mr-2" />
                <h2 className="text-xl font-bold text-white">1. Pengurusan Hak Akses Kakitangan</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400 bg-slate-950/50">
                      <th className="p-3 font-bold">Kakitangan</th>
                      <th className="p-3 font-bold">Status Akses</th>
                      <th className="p-3 font-bold">Penetapan Klinik (Lokasi Bertugas)</th>
                      <th className="p-3 font-bold text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(userPermissions || {}).length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-slate-500 font-medium">Tiada pendaftaran kakitangan dikesan.</td>
                      </tr>
                    ) : (
                      Object.values(userPermissions || {}).map((u) => {
                        const userState = u.assignedState || '';
                        const userDistrict = u.assignedDistrict || '';
                        const stateDistricts = userState ? Object.keys(hierarchy[userState] || {}) : [];
                        const districtClinics = (userState && userDistrict) ? (hierarchy[userState]?.[userDistrict] || []) : [];

                        return (
                          <tr key={u.uid} className="border-b border-slate-850 last:border-0 hover:bg-slate-850/20 transition-colors">
                            <td className="p-3 flex items-center space-x-3">
                              <img src={u.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} alt="Profile" className="h-10 w-10 rounded-full border border-slate-800 shadow-sm" />
                              <div className="overflow-hidden w-40 md:w-56">
                                <p className="font-bold text-white truncate text-sm">{u.displayName}</p>
                                <p className="text-xs text-slate-500 truncate font-semibold">{u.email}</p>
                              </div>
                            </td>
                            <td className="p-3">
                              <select
                                id={`status-${u.uid}`}
                                style={selectActiveStyle}
                                className={`text-xs font-bold py-1.5 px-3 rounded-full border outline-none ${u.status === 'approved' ? 'bg-emerald-955/40 text-emerald-400 border-emerald-900/30' :
                                    u.status === 'rejected' ? 'bg-rose-955/40 text-rose-400 border-rose-900/30' :
                                      'bg-amber-955/40 text-amber-400 border-amber-900/30'
                                  }`}
                                value={u.status}
                                onChange={(e) => updateUserStatus(u.uid, e.target.value)}
                              >
                                <option value="pending">Menunggu</option>
                                <option value="approved">Dibenarkan</option>
                                <option value="rejected">Ditolak</option>
                              </select>
                            </td>
                            <td className="p-3 space-y-2">
                              <div className="flex flex-col sm:flex-row gap-2">
                                <select
                                  id={`state-assign-${u.uid}`}
                                  style={selectActiveStyle}
                                  className="text-xs p-2 rounded-lg outline-none w-32"
                                  value={userState}
                                  onChange={(e) => {
                                    updateUserAssignment(u.uid, 'assignedState', e.target.value);
                                    updateUserAssignment(u.uid, 'assignedDistrict', '');
                                    updateUserAssignment(u.uid, 'assignedClinic', '');
                                  }}
                                >
                                  <option value="">Negeri...</option>
                                  {Object.keys(hierarchy).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>

                                <select
                                  id={`dist-assign-${u.uid}`}
                                  disabled={!userState}
                                  style={userState ? selectActiveStyle : selectDisabledStyle}
                                  className="text-xs p-2 rounded-lg outline-none w-32"
                                  value={userDistrict}
                                  onChange={(e) => {
                                    updateUserAssignment(u.uid, 'assignedDistrict', e.target.value);
                                    updateUserAssignment(u.uid, 'assignedClinic', '');
                                  }}
                                >
                                  <option value="">Daerah...</option>
                                  {stateDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>

                                <select
                                  id={`clinic-assign-${u.uid}`}
                                  disabled={!userDistrict}
                                  style={userDistrict ? selectActiveStyle : selectDisabledStyle}
                                  className="text-xs p-2 rounded-lg outline-none w-44"
                                  value={u.assignedClinic || ''}
                                  onChange={(e) => updateUserAssignment(u.uid, 'assignedClinic', e.target.value)}
                                >
                                  <option value="">Klinik...</option>
                                  {districtClinics.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => deleteUserRecord(u.uid)}
                                className="text-slate-500 hover:text-rose-500 transition-colors"
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6 space-y-6">
              <div className="flex items-center mb-2">
                <Map className="h-6 w-6 text-purple-400 mr-2" />
                <h2 className="text-xl font-bold">2. Pengurusan Struktur Regional (Klinik)</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-slate-800 rounded-2xl p-4 bg-slate-955/40 flex flex-col h-[400px]">
                  <h3 className="font-bold text-slate-300 mb-3 flex justify-between items-center text-sm uppercase tracking-wider text-slate-400">
                    <span>Negeri</span>
                    <span className="bg-purple-950 text-purple-400 px-2 py-0.5 rounded-full text-xs font-bold">{Object.keys(hierarchy).length}</span>
                  </h3>

                  <div className="flex space-x-2 mb-3">
                    <input
                      id="input-hierarchy-state"
                      type="text"
                      placeholder="Negeri Baru..."
                      value={newHierarchyState}
                      onChange={(e) => setNewHierarchyState(e.target.value)}
                      className="border border-slate-800 bg-slate-955 p-2 rounded-lg text-sm flex-1 outline-none text-white focus:ring-2 focus:ring-purple-500"
                    />
                    <button onClick={addState} className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm font-bold">Tambah</button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2">
                    {Object.keys(hierarchy).map(stateName => (
                      <div
                        key={stateName}
                        onClick={() => {
                          setAdminSelectedState(stateName);
                          setAdminSelectedDistrict('');
                        }}
                        className={`p-3 border rounded-xl flex justify-between items-center cursor-pointer transition-all ${adminSelectedState === stateName ? 'bg-purple-950/40 border-purple-500 shadow-sm' : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                          }`}
                      >
                        <span className="font-semibold text-slate-300">{stateName}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeState(stateName);
                          }}
                          className="text-slate-500 hover:text-rose-500"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-800 rounded-2xl p-4 bg-slate-955/40 flex flex-col h-[400px]">
                  <h3 className="font-bold text-slate-300 mb-3 flex justify-between items-center text-sm uppercase tracking-wider text-slate-400">
                    <span>Daerah</span>
                    {adminSelectedState && (
                      <span className="bg-blue-950 text-blue-400 px-2 py-0.5 rounded-full text-xs font-bold">
                        {Object.keys(hierarchy[adminSelectedState] || {}).length}
                      </span>
                    )}
                  </h3>

                  {adminSelectedState ? (
                    <>
                      <div className="flex space-x-2 mb-3">
                        <input
                          id="input-hierarchy-district"
                          type="text"
                          placeholder={`Daerah Baru...`}
                          value={newHierarchyDistrict}
                          onChange={(e) => setNewHierarchyDistrict(e.target.value)}
                          className="border border-slate-800 bg-slate-955 p-2 rounded-lg text-sm flex-1 outline-none text-white focus:ring-2 focus:ring-blue-500"
                        />
                        <button onClick={addDistrict} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-bold">Tambah</button>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2">
                        {Object.keys(hierarchy[adminSelectedState] || {}).map(distName => (
                          <div
                            key={distName}
                            onClick={() => setAdminSelectedDistrict(distName)}
                            className={`p-3 border rounded-xl flex justify-between items-center cursor-pointer transition-all ${adminSelectedDistrict === distName ? 'bg-blue-950/40 border-blue-500 shadow-sm' : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                              }`}
                          >
                            <span className="font-semibold text-slate-300">{distName}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeDistrict(distName);
                              }}
                              className="text-slate-500 hover:text-rose-500"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm text-center">
                      <MapPin className="h-8 w-8 mb-2 text-slate-600" />
                      Sila pilih Negeri dahulu untuk menguruskan Daerah.
                    </div>
                  )}
                </div>

                <div className="border border-slate-800 rounded-2xl p-4 bg-slate-955/40 flex flex-col h-[400px]">
                  <h3 className="font-bold text-slate-300 mb-3 flex justify-between items-center text-sm uppercase tracking-wider text-slate-400">
                    <span>Klinik Kesihatan</span>
                    {adminSelectedState && adminSelectedDistrict && (
                      <span className="bg-emerald-950 text-emerald-400 px-2.5 py-0.5 rounded-full text-xs font-bold">
                        {(hierarchy[adminSelectedState]?.[adminSelectedDistrict] || []).length}
                      </span>
                    )}
                  </h3>

                  {adminSelectedState && adminSelectedDistrict ? (
                    <>
                      <div className="flex space-x-2 mb-3">
                        <input
                          id="input-hierarchy-clinic"
                          type="text"
                          placeholder={`Klinik di ${adminSelectedDistrict}...`}
                          value={newClinicName}
                          onChange={(e) => setNewClinicName(e.target.value)}
                          className="border border-slate-800 bg-slate-955 p-2 rounded-lg text-sm flex-1 outline-none text-white focus:ring-2 focus:ring-emerald-500"
                        />
                        <button onClick={addClinic} className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-sm font-bold">Tambah</button>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2">
                        {(hierarchy[adminSelectedState]?.[adminSelectedDistrict] || []).map(clinic => (
                          <div
                            key={clinic}
                            className="p-3 border border-slate-800 rounded-xl flex justify-between items-center bg-slate-900"
                          >
                            <span className="font-semibold text-slate-300 text-sm">{clinic}</span>
                            <button
                              onClick={() => removeClinic(clinic)}
                              className="text-slate-500 hover:text-rose-500"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm text-center">
                      <Building2 className="h-8 w-8 mb-2 text-slate-600" />
                      Sila pilih Daerah dahulu untuk menguruskan Klinik.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Settings className="h-6 w-6 text-orange-450 mr-2" />
                  <h2 className="text-lg font-bold">3. Jabatan / Zon (Zoning)</h2>
                </div>
                <div className="flex space-x-2">
                  <input
                    id="input-dept-new"
                    type="text"
                    placeholder="Jabatan Baru..."
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    className="border border-slate-800 bg-slate-955 p-2 rounded-lg text-sm w-40 md:w-56 focus:ring-2 focus:ring-orange-500 outline-none text-white"
                  />
                  <button onClick={addDepartment} className="bg-orange-600 hover:bg-orange-750 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">Tambah</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {departments.map((dept, idx) => (
                  <div key={idx} className="px-4 py-2 border border-slate-800 rounded-full flex items-center bg-slate-955/50 shadow-sm space-x-3">
                    <span className="font-semibold text-slate-300 text-sm">{dept}</span>
                    <button onClick={() => removeDepartment(dept)} className="text-slate-500 hover:text-rose-500 transition-colors">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Monitor className="h-6 w-6 text-emerald-500 mr-2" />
                  <h2 className="text-lg font-bold">4. TV Media Playlist</h2>
                </div>
                <div className="flex space-x-2">
                  <select
                    id="select-media-type"
                    value={newMediaType}
                    onChange={(e) => setNewMediaType(e.target.value)}
                    style={selectActiveStyle}
                    className="border p-2 rounded-lg text-sm bg-slate-950 outline-none"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                  <input
                    id="input-media-url"
                    type="text"
                    placeholder="Direct URL (.jpg, .mp4)"
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    className="border border-slate-800 bg-slate-955 p-2 rounded-lg text-sm w-48 md:w-64 focus:ring-2 focus:ring-emerald-500 outline-none text-white"
                  />
                  <button onClick={addMedia} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">Tambah URL</button>
                </div>
              </div>
              <div className="space-y-3">
                {mediaList.map((media, idx) => (
                  <div key={idx} className="p-4 border border-slate-800 rounded-xl flex justify-between items-center bg-slate-955/50 hover:bg-slate-800 transition-colors">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      {media.type === 'video' ? <Film className="h-5 w-5 text-slate-400 shrink-0" /> : <ImageIcon className="h-5 w-5 text-slate-400 shrink-0" />}
                      <span className="font-medium text-slate-300 truncate text-sm">{media.url}</span>
                    </div>
                    <button onClick={() => removeMedia(idx)} className="text-slate-500 hover:text-rose-500 transition-colors ml-4 shrink-0">
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </main>
        </div>
      )}

      {/* SCREEN ROUTING */}
      {currentView === 'input' && (
        <InputScreen
          hierarchy={hierarchy || {}}
          departments={departments || []}
          selectedState={selectedState} setSelectedState={setSelectedState}
          selectedDistrict={selectedDistrict} setSelectedDistrict={setSelectedDistrict}
          selectedClinic={selectedClinic} setSelectedClinic={setSelectedClinic}
          selectedDept={selectedDept} setSelectedDept={setSelectedDept}
          setCurrentView={setCurrentView}
          showModal={showModal}
          updateQueueNumber={updateQueueNumber}
          dbStatus={dbStatus}
          isSuperadmin={isSuperadmin}
          queues={queues}
        />
      )}

      {currentView === 'output' && (
        <OutputScreen
          hierarchy={hierarchy || {}}
          departments={departments || []}
          mediaList={mediaList || []}
          selectedState={selectedState} setSelectedState={setSelectedState}
          selectedDistrict={selectedDistrict} setSelectedDistrict={setSelectedDistrict}
          selectedClinic={selectedClinic} setSelectedClinic={setSelectedClinic}
          selectedDept={selectedDept} setSelectedDept={setSelectedDept}
          setCurrentView={setCurrentView}
          queues={queues}
          dbStatus={dbStatus}
          isSuperadmin={isSuperadmin}
        />
      )}
      <Modal {...modalConfig} />
    </>
  );
}