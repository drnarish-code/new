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
  RotateCcw,
  Link as LinkIcon,
  Copy,
  CheckCircle2
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = typeof __firebase_config !== 'undefined'
  ? JSON.parse(__firebase_config)
  : {
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

// Safe Sraf Error Guard: intercepts and suppresses internal TV wrapper message-channel exceptions
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', function (event) {
    if (event.reason && event.reason.message && (
      event.reason.message.indexOf('message channel closed') !== -1 ||
      event.reason.message.indexOf('A listener indicated an asynchronous') !== -1
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

// Safe Deep Object Tree Crawler (Avoids optional chaining ?. on older TVs)
function getNested(obj, pathArray) {
  var current = obj;
  if (!current) return undefined;
  for (var i = 0; i < pathArray.length; i++) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[pathArray[i]];
  }
  return current;
}

// Safe ES5 Object values collector (Replaces Object.values() which crashes Sraf)
function getObjectValues(obj) {
  if (!obj) return [];
  var keys = Object.keys(obj);
  var values = [];
  for (var i = 0; i < keys.length; i++) {
    values.push(obj[keys[i]]);
  }
  return values;
}

// Safe ES5 Object Assigner (Replaces Object spread {...obj} syntax)
function assignObjects() {
  var to = {};
  for (var i = 0; i < arguments.length; i++) {
    var nextSource = arguments[i];
    if (nextSource !== undefined && nextSource !== null) {
      var keys = Object.keys(nextSource);
      for (var j = 0; j < keys.length; j++) {
        var nextKey = keys[j];
        to[nextKey] = nextSource[nextKey];
      }
    }
  }
  return to;
}

// Get URL parameters on older TV engines
function getQueryParam(name) {
  if (typeof window === 'undefined') return '';
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in duration-200 text-slate-800">
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600 mb-6">{message}</p>
        <div className="flex space-x-3">
          {type === 'confirm' && (
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
          )}
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
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
  const clinicsList = (selectedState && selectedDistrict && hierarchy[selectedState] && hierarchy[selectedState][selectedDistrict])
    ? (hierarchy[selectedState][selectedDistrict] || [])
    : [];

  const path = [selectedState, selectedDistrict, selectedClinic, selectedDept, localRoom];
  const roomData = getNested(queues, path);
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-slate-800">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Sesi Panggilan</h2>
              <p className="text-xs text-slate-500 font-semibold uppercase mt-0.5">
                {isSuperadmin ? "Mod Superadmin" : "Mod Kakitangan Terselia"}
              </p>
            </div>
            <button onClick={() => setCurrentView('login')} className="text-slate-400 hover:text-slate-600" title="Kembali">
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="input-state" className="block text-sm font-semibold text-slate-700 mb-1">Negeri</label>
              <select
                id="input-state"
                name="inputState"
                disabled={!isSuperadmin}
                className="w-full p-3 border border-slate-300 rounded-xl bg-white text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 font-medium"
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
              <label htmlFor="input-district" className="block text-sm font-semibold text-slate-700 mb-1">Daerah</label>
              <select
                id="input-district"
                name="inputDistrict"
                disabled={!isSuperadmin || !selectedState}
                className="w-full p-3 border border-slate-300 rounded-xl bg-white text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 font-medium"
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
              <label htmlFor="input-clinic" className="block text-sm font-semibold text-slate-700 mb-1">Klinik Kesihatan</label>
              <select
                id="input-clinic"
                name="inputClinic"
                disabled={!isSuperadmin || !selectedDistrict}
                className="w-full p-3 border border-slate-300 rounded-xl bg-white text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 font-medium"
                value={selectedClinic}
                onChange={(e) => setSelectedClinic(e.target.value)}
              >
                <option value="">Pilih Klinik...</option>
                {clinicsList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="input-dept" className="block text-sm font-semibold text-slate-700 mb-1">Jabatan / Zon</label>
              <select
                id="input-dept"
                name="inputDept"
                className="w-full p-3 border border-slate-300 rounded-xl bg-white text-slate-800 font-medium"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="">Pilih Jabatan...</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="input-room" className="block text-sm font-semibold text-slate-700 mb-1">Bilik</label>
              <select
                id="input-room"
                name="inputRoom"
                className="w-full p-3 border border-slate-300 rounded-xl bg-white text-slate-800 font-medium"
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
              className="w-full py-4 mt-6 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-blue-700 transition-colors"
            >
              Mula Memanggil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col sm:justify-center p-4">
      <div className="w-full max-w-sm mx-auto flex flex-col h-full sm:h-auto sm:border sm:border-slate-700 sm:rounded-3xl sm:p-6 sm:bg-slate-800">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{selectedDept} • {localRoom}</p>
              <div className={`h-2 w-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500' : dbStatus === 'error' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} title={`DB: ${dbStatus}`} />
            </div>
            <h1 className="text-lg font-bold leading-tight truncate w-48">{selectedClinic}</h1>
            <p className="text-xs text-slate-400 font-medium truncate w-48">{selectedDistrict}, {selectedState}</p>
          </div>
          <button onClick={() => setStep(1)} className="p-2 bg-slate-700 rounded-full text-slate-300">
            <Settings className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-slate-950 rounded-2xl p-6 mb-8 flex justify-center items-center shadow-inner border border-slate-700 min-h-[120px]">
          <span className="text-6xl font-bold tracking-widest text-emerald-400">
            {currentInput || '----'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6 flex-1 content-end">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => setCurrentInput(prev => (prev.length < 4 ? prev + num : prev))}
              className="bg-slate-700 hover:bg-slate-600 active:bg-slate-500 rounded-2xl py-5 text-2xl font-semibold transition-colors"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setCurrentInput('')}
            className="bg-slate-800 hover:bg-slate-700 text-red-400 rounded-2xl py-5 text-lg font-bold transition-colors"
          >
            CLR
          </button>
          <button
            onClick={() => setCurrentInput(prev => (prev.length < 4 ? prev + '0' : prev))}
            className="bg-slate-700 hover:bg-slate-600 active:bg-slate-500 rounded-2xl py-5 text-2xl font-semibold transition-colors"
          >
            0
          </button>
          <button
            onClick={() => setCurrentInput(prev => prev.slice(0, -1))}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl py-5 text-lg font-bold transition-colors"
          >
            DEL
          </button>
        </div>

        <div className="flex flex-col space-y-3">
          {hasActiveNumber && (
            <button
              onClick={handleRedial}
              className="w-full bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 shadow-md shadow-amber-900/40 border border-amber-500/30 transition-all transform active:scale-95"
            >
              <RotateCcw className="h-5 w-5" />
              <span>Panggil Semula ({activeNumber})</span>
            </button>
          )}

          <button
            onClick={handleCallNext}
            className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-900/50 transform active:scale-95 transition-transform"
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
  const [copiedLocalLink, setCopiedLocalLink] = useState(false);

  const audioCtxRef = useRef(null);
  const [highlightedRoom, setHighlightedRoom] = useState(null);
  const videoRefs = useRef({});

  const activeMedia = mediaList[currentMediaIndex] || DEFAULT_MEDIA[0];

  const statesList = Object.keys(hierarchy || {});
  const districtsList = selectedState ? Object.keys(hierarchy[selectedState] || {}) : [];
  const clinicsList = (selectedState && selectedDistrict && hierarchy[selectedState] && hierarchy[selectedState][selectedDistrict])
    ? (hierarchy[selectedState][selectedDistrict] || [])
    : [];

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
    const textPrompt = "Sebutkan dengan nada yang lembut, tenang dan jelas dalam Bahasa Melayu: Nombor " + malayDigits + ", sila ke " + room + ".";

    try {
      const apiKey = "";
      const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=" + apiKey;

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

      if (!response.ok) throw new Error("Gemini TTS API returned failure code.");

      const result = await response.json();
      const audioPart = getNested(result, ['candidates', 0, 'content', 'parts', 0]);
      const audioData = getNested(audioPart, ['inlineData', 'data']);
      const mimeType = getNested(audioPart, ['inlineData', 'mimeType']) || "audio/L16;rate=24000";

      if (audioData) {
        const rateMatch = mimeType.match(/rate=(\d+)/);
        const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

        const rawBuffer = base64ToArrayBuffer(audioData);
        const pcm16 = new Int16Array(rawBuffer);
        const wavBlob = pcmToWav(pcm16, sampleRate);
        const audioUrl = URL.createObjectURL(wavBlob);

        const audio = new Audio(audioUrl);
        audio.play().catch(e => console.warn("Failed playing generated Gemini wave binary", e));
        return;
      }
    } catch (apiError) {
      console.warn("Gemini TTS failing. Falling back seamlessly to browser WebSpeech API...", apiError);
    }

    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const textToSpeak = "Nombor " + malayDigits + ", sila ke " + room;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'ms-MY';

      const voices = window.speechSynthesis.getVoices();
      var malayVoice = null;
      for (var vIdx = 0; vIdx < voices.length; vIdx++) {
        var v = voices[vIdx];
        if (v.lang.indexOf('ms') === 0 || v.lang.indexOf('id') === 0) {
          malayVoice = v;
          break;
        }
      }
      if (malayVoice) utterance.voice = malayVoice;

      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    } catch (fallbackError) {
      console.warn("Both Gemini TTS and WebSpeech failed.", fallbackError);
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

    const pathArray = [selectedState, selectedDistrict, selectedClinic, selectedDept];
    const currentData = getNested(queues, pathArray);
    if (!currentData) return;

    const getNum = (val) => {
      if (!val) return '';
      if (typeof val === 'object') return val.number || '';
      return val;
    };
    const getTs = (val) => {
      if (!val) return 0;
      if (typeof val === 'object') return val.timestamp || 0;
      return 0;
    };

    if (!previousQueues) {
      setPreviousQueues(JSON.parse(JSON.stringify(currentData)));
      const roomsList = Object.keys(currentData);
      const initial = [];
      for (let i = 0; i < roomsList.length; i++) {
        const roomKey = roomsList[i];
        const valObj = currentData[roomKey];
        const num = getNum(valObj);
        if (num !== "0000" && num !== "----") {
          initial.push({ room: roomKey, number: num, timestamp: getTs(valObj) });
        }
      }
      setRecentCalls(initial.slice(0, 4));
      return;
    }

    let roomChanged = null;
    let newNumber = null;

    var rooms = Object.keys(currentData);
    for (var i = 0; i < rooms.length; i++) {
      var room = rooms[i];
      var val = currentData[room];
      var prevVal = previousQueues[room];
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
        const filteredList = [];
        for (var idx = 0; idx < prev.length; idx++) {
          if (prev[idx].room !== roomChanged) {
            filteredList.push(prev[idx]);
          }
        }
        return [{ room: roomChanged, number: newNumber }].concat(filteredList).slice(0, 4);
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

    var videoUrls = Object.keys(videoRefs.current);
    for (var i = 0; i < videoUrls.length; i++) {
      var vid = videoRefs.current[videoUrls[i]];
      if (vid) {
        try {
          vid.pause();
          vid.currentTime = 0;
        } catch (e) { }
      }
    }

    if (activeMedia && activeMedia.type === 'video') {
      const activeVideo = videoRefs.current[activeMedia.url + "-" + currentMediaIndex];
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

    setSetupDone(true);
  };

  const generateLocalBypassLink = () => {
    if (!selectedState || !selectedDistrict || !selectedClinic || !selectedDept) return '';
    const base = window.location.origin + window.location.pathname;
    return base + "?mode=tv&state=" + encodeURIComponent(selectedState) + "&district=" + encodeURIComponent(selectedDistrict) + "&clinic=" + encodeURIComponent(selectedClinic) + "&dept=" + encodeURIComponent(selectedDept);
  };

  const copyLocalBypassLink = () => {
    const link = generateLocalBypassLink();
    if (!link) return;
    var dummy = document.createElement('textarea');
    document.body.appendChild(dummy);
    dummy.value = link;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);
    setCopiedLocalLink(true);
    setTimeout(() => setCopiedLocalLink(false), 2000);
  };

  if (!setupDone) {
    const isTvBypassMode = getQueryParam('mode') === 'tv';

    if (isTvBypassMode) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center cursor-pointer" onClick={handleStartTV}>
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
            <div className="mx-auto h-20 w-20 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center border border-blue-500/30">
              <Volume2 className="h-10 w-10 animate-pulse" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-wide uppercase">Aktifkan Audio TV</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Sila klik di mana-mana atau tekan butang 'OK' pada remote control anda untuk memulakan paparan audio TV.
            </p>
            <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/50 uppercase tracking-wider">
              Mula Skrin TV
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-800">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
          <h2 className="text-2xl font-bold mb-2 text-center text-slate-900 font-sans">Konfigurasi TV Display</h2>
          <p className="text-xs text-slate-500 text-center uppercase tracking-wider mb-6">
            {isSuperadmin ? "Mod Superadmin" : "Mod Kakitangan Terselia"}
          </p>

          <div className="space-y-5">
            <div>
              <label htmlFor="output-state" className="block text-sm font-semibold text-slate-700 mb-2">Negeri</label>
              <select
                id="output-state"
                name="outputState"
                disabled={!isSuperadmin}
                className="w-full p-4 border border-slate-300 rounded-xl bg-white text-slate-800 disabled:opacity-50 font-semibold"
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
              <label htmlFor="output-district" className="block text-sm font-semibold text-slate-700 mb-2">Daerah</label>
              <select
                id="output-district"
                name="outputDistrict"
                disabled={!isSuperadmin || !selectedState}
                className="w-full p-4 border border-slate-300 rounded-xl bg-white text-slate-800 disabled:opacity-50 font-semibold"
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
              <label htmlFor="output-clinic" className="block text-sm font-semibold text-slate-700 mb-2">Klinik Kesihatan</label>
              <select
                id="output-clinic"
                name="outputClinic"
                disabled={!isSuperadmin || !selectedDistrict}
                className="w-full p-4 border border-slate-300 rounded-xl bg-white text-slate-800 disabled:opacity-50 font-semibold"
                value={selectedClinic}
                onChange={(e) => setSelectedClinic(e.target.value)}
              >
                <option value="">Pilih...</option>
                {clinicsList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="output-dept" className="block text-sm font-semibold text-slate-700 mb-2">Jabatan (Zon)</label>
              <select
                id="output-dept"
                name="outputDept"
                className="w-full p-4 border border-slate-300 rounded-xl bg-white text-slate-800 font-semibold"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="">Pilih...</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {selectedState && selectedDistrict && selectedClinic && selectedDept && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col items-center gap-2 text-center">
                <p className="text-xs text-blue-700 font-semibold">Salin pautan pintas ini untuk TV (Tanpa Log Masuk):</p>
                <button
                  onClick={copyLocalBypassLink}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                >
                  {copiedLocalLink ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedLocalLink ? "Disalin!" : "Salin Pautan Pintas TV"}</span>
                </button>
              </div>
            )}

            <div className="pt-4 flex space-x-3">
              <button
                onClick={() => { setSetupDone(false); setCurrentView('login'); }}
                className="flex-1 py-4 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300"
              >
                Kembali
              </button>
              <button
                disabled={!selectedState || !selectedDistrict || !selectedClinic || !selectedDept}
                onClick={handleStartTV}
                className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-emerald-700 flex items-center justify-center"
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
          <h1 className="text-2xl md:text-3xl font-extrabold text-blue-400 tracking-wide uppercase">
            Pejabat Kesihatan Daerah
          </h1>
          <h2 className="text-xl md:text-4xl font-bold text-white mt-2 uppercase">
            {selectedClinic} - {selectedDept}
          </h2>
          <p className="text-sm text-slate-400 mt-1 uppercase font-semibold">{selectedDistrict}, {selectedState}</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="flex items-center space-x-2 mb-1">
            <div className={`h-2 w-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500' : dbStatus === 'error' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
            <p className="text-slate-400 text-sm font-semibold tracking-widest uppercase">Sistem QMS</p>
          </div>
          <button
            onClick={() => { setSetupDone(false); setCurrentView('login'); }}
            className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-slate-300 animate-pulse"
          >
            Tutup TV Mode
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row relative z-10">
        <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
          {mediaList.map((media, index) => (
            media.type === 'video' ? (
              <video
                key={media.url + "-" + index}
                src={media.url}
                muted
                playsInline
                onEnded={() => setCurrentMediaIndex(prev => (prev + 1) % mediaList.length)}
                ref={el => { videoRefs.current[media.url + "-" + index] = el; }}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${index === currentMediaIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
              />
            ) : (
              <img
                key={media.url + "-" + index}
                src={media.url}
                alt="Gallery"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${index === currentMediaIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
              />
            )
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none z-10" />
          <div className="absolute bottom-10 left-10 z-10">
            <p className="text-white/80 text-2xl font-semibold bg-black/40 px-4 py-2 rounded-lg backdrop-blur-sm shadow-xl">
              Sila tunggu nombor anda dipanggil
            </p>
          </div>
        </div>

        <div className="w-full md:w-[500px] lg:w-[600px] bg-slate-900 border-l border-slate-800 flex flex-col relative z-20 shadow-2xl">
          <div className="grid grid-cols-2 bg-slate-800 py-6 px-8 border-b border-slate-700 shadow-md">
            <h3 className="text-3xl font-bold text-slate-300 uppercase">Bilik</h3>
            <h3 className="text-3xl font-bold text-slate-300 uppercase text-right">Nombor</h3>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col bg-slate-950">
            {recentCalls.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-600 text-2xl font-semibold">
                Tiada panggilan
              </div>
            ) : (
              recentCalls.map((call, index) => (
                <div
                  key={call.room}
                  className={`grid grid-cols-2 py-10 px-8 border-b border-slate-800 items-center transition-all duration-700 ${index === 0
                      ? (highlightedRoom === call.room ? 'bg-blue-600 border-l-8 border-l-white scale-[1.02] shadow-2xl z-10' : 'bg-blue-900/30 border-l-8 border-l-blue-500 shadow-inner')
                      : 'bg-slate-900/40'
                    }`}
                >
                  <div className={`text-4xl font-bold transition-colors duration-700 ${index === 0 ? (highlightedRoom === call.room ? 'text-white' : 'text-blue-400 drop-shadow-md') : 'text-emerald-500/80'}`}>
                    {call.room}
                  </div>
                  <div className={`text-7xl font-extrabold text-right tracking-wider tabular-nums transition-colors duration-700 ${index === 0
                      ? (highlightedRoom === call.room ? 'text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.8)]' : 'text-white drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]')
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

  // Bypass Generator States
  const [genState, setGenState] = useState('');
  const [genDistrict, setGenDistrict] = useState('');
  const [genClinic, setGenClinic] = useState('');
  const [genDept, setGenDept] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null, onCancel: null });
  const [dbStatus, setDbStatus] = useState('connecting');

  const getDocRef = () => doc(db, 'qms', 'state');

  useEffect(function () {
    var mode = getQueryParam('mode');
    var bState = getQueryParam('state');
    var bDistrict = getQueryParam('district');
    var bClinic = getQueryParam('clinic');
    var bDept = getQueryParam('dept');

    if (mode === 'tv' && bState && bDistrict && bClinic && bDept) {
      setSelectedState(bState);
      setSelectedDistrict(bDistrict);
      setSelectedClinic(bClinic);
      setSelectedDept(bDept);
      setCurrentView('output');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
    var bState = getQueryParam('state');
    var isTvBypass = getQueryParam('mode') === 'tv' && bState;

    // Allow configuration sync if logged in OR running TV bypass link
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

    var unsubUsers = () => { };
    if (user) {
      unsubUsers = onSnapshot(usersRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserPermissions(docSnap.data());
        } else {
          setUserPermissions({});
        }
      }, (error) => {
        console.error("Users sync error:", error);
        setUserPermissions({});
      });
    }

    const unsubQueues = onSnapshot(
      qmsDocRef,
      (docSnap) => {
        setDbStatus('connected');
        if (docSnap.exists()) {
          setQueues(prev => {
            var updated = {};
            var prevKeys = Object.keys(prev);
            for (let i = 0; i < prevKeys.length; i++) {
              updated[prevKeys[i]] = prev[prevKeys[i]];
            }
            var fresh = docSnap.data();
            var freshKeys = Object.keys(fresh);
            for (let i = 0; i < freshKeys.length; i++) {
              updated[freshKeys[i]] = fresh[freshKeys[i]];
            }
            return updated;
          });
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
        setModalConfig(prev => {
          var updated = {};
          var keys = Object.keys(prev);
          for (let i = 0; i < keys.length; i++) {
            updated[keys[i]] = prev[keys[i]];
          }
          updated.isOpen = false;
          return updated;
        });
      },
      onCancel: () => setModalConfig(prev => {
        var updated = {};
        var keys = Object.keys(prev);
        for (let i = 0; i < keys.length; i++) {
          updated[keys[i]] = prev[keys[i]];
        }
        updated.isOpen = false;
        return updated;
      })
    });
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
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
    const updatedQueues = JSON.parse(JSON.stringify(queues));
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
    const updatedHierarchy = JSON.parse(JSON.stringify(hierarchy));
    updatedHierarchy[cleanStateName] = {};
    setHierarchy(updatedHierarchy);
    setNewHierarchyState('');
    await setDoc(doc(db, 'qms', 'config'), { hierarchy: updatedHierarchy }, { merge: true });
  };

  const removeState = async (stateToRemove) => {
    showModal('Padam Negeri', `Padam negeri ${stateToRemove} dan semua daerah & klinik di bawahnya?`, 'confirm', async () => {
      const updatedHierarchy = JSON.parse(JSON.stringify(hierarchy));
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
    const updatedHierarchy = JSON.parse(JSON.stringify(hierarchy));
    if (!updatedHierarchy[adminSelectedState]) updatedHierarchy[adminSelectedState] = {};
    updatedHierarchy[adminSelectedState][cleanDistrictName] = [];

    setHierarchy(updatedHierarchy);
    setNewHierarchyDistrict('');
    await setDoc(doc(db, 'qms', 'config'), { hierarchy: updatedHierarchy }, { merge: true });
  };

  const removeDistrict = async (districtToRemove) => {
    showModal('Padam Daerah', `Padam daerah ${districtToRemove} dan semua klinik di bawahnya?`, 'confirm', async () => {
      const updatedHierarchy = JSON.parse(JSON.stringify(hierarchy));
      if (updatedHierarchy[adminSelectedState]) {
        delete updatedHierarchy[adminSelectedState][districtToRemove];
      }
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
    const currentClinics = getNested(hierarchy, [adminSelectedState, adminSelectedDistrict]) || [];
    if (currentClinics.indexOf(cleanClinicName) !== -1) {
      showModal("Info", "Klinik ini sudah wujud dalam daerah ini.", "info");
      return;
    }
    const updatedHierarchy = JSON.parse(JSON.stringify(hierarchy));
    if (!updatedHierarchy[adminSelectedState]) updatedHierarchy[adminSelectedState] = {};
    if (!updatedHierarchy[adminSelectedState][adminSelectedDistrict]) updatedHierarchy[adminSelectedState][adminSelectedDistrict] = [];
    updatedHierarchy[adminSelectedState][adminSelectedDistrict].push(cleanClinicName);

    setHierarchy(updatedHierarchy);
    setNewClinicName('');
    await setDoc(doc(db, 'qms', 'config'), { hierarchy: updatedHierarchy }, { merge: true });
  };

  const removeClinic = async (clinicToRemove) => {
    showModal('Padam Klinik', `Padam klinik ${clinicToRemove}?`, 'confirm', async () => {
      const clinics = getNested(hierarchy, [adminSelectedState, adminSelectedDistrict]) || [];
      const updatedClinics = [];
      for (var i = 0; i < clinics.length; i++) {
        if (clinics[i] !== clinicToRemove) {
          updatedClinics.push(clinics[i]);
        }
      }
      const updatedHierarchy = JSON.parse(JSON.stringify(hierarchy));
      if (updatedHierarchy[adminSelectedState] && updatedHierarchy[adminSelectedState][adminSelectedDistrict]) {
        updatedHierarchy[adminSelectedState][adminSelectedDistrict] = updatedClinics;
      }
      setHierarchy(updatedHierarchy);
      await setDoc(doc(db, 'qms', 'config'), { hierarchy: updatedHierarchy }, { merge: true });
    });
  };

  const addDepartment = async () => {
    if (!newDeptName.trim()) return;
    const updatedDepts = [];
    for (var i = 0; i < departments.length; i++) updatedDepts.push(departments[i]);
    updatedDepts.push(newDeptName.trim());
    setDepartments(updatedDepts);
    setNewDeptName('');
    await setDoc(doc(db, 'qms', 'config'), { departments: updatedDepts }, { merge: true });
  };

  const removeDepartment = async (deptToRemove) => {
    showModal('Padam', `Pasti mahu memadam ${deptToRemove}?`, 'confirm', async () => {
      const updatedDepts = [];
      for (var i = 0; i < departments.length; i++) {
        if (departments[i] !== deptToRemove) updatedDepts.push(departments[i]);
      }
      setDepartments(updatedDepts);
      await setDoc(doc(db, 'qms', 'config'), { departments: updatedDepts }, { merge: true });
    });
  };

  const addMedia = async () => {
    if (!newMediaUrl.trim()) return;
    const updatedMedia = [];
    for (var i = 0; i < mediaList.length; i++) updatedMedia.push(mediaList[i]);
    updatedMedia.push({ url: newMediaUrl.trim(), type: newMediaType });
    setMediaList(updatedMedia);
    setNewMediaUrl('');
    await setDoc(doc(db, 'qms', 'config'), { media: updatedMedia }, { merge: true });
  };

  const removeMedia = async (idxToRemove) => {
    showModal('Padam Media', `Pasti mahu memadam media ini dari playlist?`, 'confirm', async () => {
      const updatedMedia = [];
      for (var i = 0; i < mediaList.length; i++) {
        if (i !== idxToRemove) updatedMedia.push(mediaList[i]);
      }
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
      const updatedPermissions = JSON.parse(JSON.stringify(userPermissions));
      delete updatedPermissions[uid];
      await setDoc(doc(db, 'qms', 'users'), updatedPermissions);
    });
  };

  const generateBypassLink = () => {
    if (!genState || !genDistrict || !genClinic || !genDept) return '';
    const base = window.location.origin + window.location.pathname;
    return base + "?mode=tv&state=" + encodeURIComponent(genState) + "&district=" + encodeURIComponent(genDistrict) + "&clinic=" + encodeURIComponent(genClinic) + "&dept=" + encodeURIComponent(genDept);
  };

  const copyBypassLinkToClipboard = () => {
    const link = generateBypassLink();
    if (!link) return;

    var dummy = document.createElement('textarea');
    document.body.appendChild(dummy);
    dummy.value = link;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);

    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user && getQueryParam('mode') !== 'tv') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center animate-in fade-in zoom-in duration-300">
          <div className="mx-auto h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-200 mb-6">
            <svg className="h-10 w-10 text-white animate-pulse" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 font-sans tracking-tight">PKD QMS Gateway</h2>
          <p className="mt-2 text-sm text-slate-500 mb-8 font-medium">Sistem Pengurusan Giliran Bersepadu & Kawalan Akses</p>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center space-x-3 py-4 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-400 transition-all shadow-sm group"
          >
            <svg className="w-6 h-6 group-hover:scale-105 transition-transform" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            <span className="text-slate-700 font-bold text-lg">Log Masuk dengan Google</span>
          </button>
        </div>
        <Modal {...modalConfig} />
      </div>
    );
  }

  const isSuperadmin = user ? user.email === 'dr.narish@gmail.com' : false;
  const myPermission = userPermissions ? userPermissions[user.uid] : null;

  if (user && !isSuperadmin && (!myPermission || myPermission.status !== 'approved')) {
    const isRejected = myPermission && myPermission.status === 'rejected';
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center space-y-6">
          <div className="mx-auto h-20 w-20 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            {isRejected ? (
              <div className="h-full w-full bg-red-100 rounded-full flex items-center justify-center text-red-600">
                <ShieldAlert className="h-10 w-10" />
              </div>
            ) : (
              <div className="h-full w-full bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                <Clock className="h-10 w-10" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">
              {isRejected ? "Akses Ditolak" : "Akses Menunggu Kelulusan"}
            </h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              {isRejected
                ? "Maaf, akses akaun anda ke sistem QMS telah ditolak. Sila hubungi pentadbir sistem untuk maklumat lanjut."
                : "Akaun anda berjaya didaftarkan! Namun, akses anda perlu diluluskan dan diberikan penetapan klinik terlebih dahulu."
              }
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center space-x-3 text-left text-slate-800">
            <img src={user.photoURL} alt="Profile" className="h-12 w-12 rounded-full border shadow-sm" />
            <div className="overflow-hidden">
              <p className="font-bold text-slate-800 truncate">{user.displayName}</p>
              <p className="text-xs text-slate-400 truncate font-semibold">{user.email}</p>
            </div>
          </div>

          {!isRejected && (
            <div className="bg-blue-50 border border-blue-100 text-blue-800 text-xs py-3 px-4 rounded-xl font-bold font-sans">
              Tip: Maklumkan kepada Dr. Narish untuk mengesahkan akaun anda sekarang!
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full py-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
          >
            Log Keluar dari Akaun
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'login' && user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-200 text-slate-800">
          <div className="text-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="mx-auto h-16 w-16 mb-4 relative">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profil" className="h-full w-full rounded-full shadow-md" />
              ) : (
                <div className="h-full w-full bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                  <Users className="h-8 w-8 text-white" />
                </div>
              )}
              <span className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${isSuperadmin ? 'bg-purple-500' : 'bg-emerald-500'}`} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">Hai, {user.displayName || 'Kakitangan'}</h2>
            <p className="text-sm font-semibold text-slate-400 mt-1">{user.email}</p>
            {!isSuperadmin && myPermission && (
              <div className="mt-3 inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
                <UserCheck className="h-3.5 w-3.5" />
                <span>KK: {myPermission.assignedClinic || 'Belum ditetapkan'}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="block mx-auto mt-5 text-xs font-bold px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
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
              className="w-full flex items-center justify-between p-5 bg-white border-2 border-slate-100 rounded-2xl shadow-sm hover:border-purple-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center">
                <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Settings className="h-6 w-6" />
                </div>
                <div className="ml-4 text-left">
                  <p className="text-lg font-bold text-slate-900">Superadmin Portal</p>
                  <p className="text-sm text-slate-500">Konfigurasi & Kelulusan Kakitangan</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-purple-500" />
            </button>

            <button
              onClick={() => setCurrentView('input')}
              className="w-full flex items-center justify-between p-5 bg-white border-2 border-slate-100 rounded-2xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center">
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div className="ml-4 text-left">
                  <p className="text-lg font-bold text-slate-900">Portal Staf (Input)</p>
                  <p className="text-sm text-slate-500">Panggil nombor giliran pesakit</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500" />
            </button>

            <button
              onClick={() => setCurrentView('output')}
              className="w-full flex items-center justify-between p-5 bg-white border-2 border-slate-100 rounded-2xl shadow-sm hover:border-emerald-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center">
                <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Monitor className="h-6 w-6" />
                </div>
                <div className="ml-4 text-left">
                  <p className="text-lg font-bold text-slate-900">Skrin TV (Output)</p>
                  <p className="text-sm text-slate-500">Paparan ruang menunggu pesakit</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-500" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentView === 'admin' && (
        <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
          <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Dashboard Superadmin</h1>
              <p className="text-sm text-slate-500">Konfigurasi Wilayah, Playlist & Kawalan Kakitangan</p>
            </div>
            <button onClick={() => setCurrentView('login')} className="px-4 py-2 text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg">
              Kembali
            </button>
          </header>

          <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-8">

            <section className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
              <div className="flex items-center mb-2">
                <Users className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-bold text-slate-800 font-sans">1. Pengurusan Hak Akses Kakitangan</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wider text-slate-400 bg-slate-50/50">
                      <th className="p-3 font-bold">Kakitangan</th>
                      <th className="p-3 font-bold">Status Akses</th>
                      <th className="p-3 font-bold">Penetapan Klinik (Lokasi Bertugas)</th>
                      <th className="p-3 font-bold text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!userPermissions || getObjectValues(userPermissions).length === 0) ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-slate-400 font-medium">Tiada pendaftaran kakitangan dikesan.</td>
                      </tr>
                    ) : (
                      getObjectValues(userPermissions).map((u) => {
                        const userState = u.assignedState || '';
                        const userDistrict = u.assignedDistrict || '';
                        const stateDistricts = userState ? Object.keys(hierarchy[userState] || {}) : [];
                        const districtClinics = (userState && userDistrict && hierarchy[userState]) ? (hierarchy[userState][userDistrict] || []) : [];

                        return (
                          <tr key={u.uid} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                            <td className="p-3 flex items-center space-x-3">
                              <img src={u.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} alt="Profile" className="h-10 w-10 rounded-full border shadow-sm" />
                              <div className="overflow-hidden w-40 md:w-56">
                                <p className="font-bold text-slate-800 truncate text-sm">{u.displayName}</p>
                                <p className="text-xs text-slate-400 truncate font-semibold">{u.email}</p>
                              </div>
                            </td>
                            <td className="p-3">
                              <select
                                id={`status-select-${u.uid}`}
                                name={`statusSelect-${u.uid}`}
                                className={`text-xs font-bold py-1.5 px-3 rounded-full border outline-none bg-white text-slate-800 ${u.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    u.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                      'bg-amber-50 text-amber-700 border-amber-200'
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
                                  id={`assigned-state-${u.uid}`}
                                  name={`assignedState-${u.uid}`}
                                  className="text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-800 outline-none w-32 font-medium"
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
                                  id={`assigned-district-${u.uid}`}
                                  name={`assignedDistrict-${u.uid}`}
                                  disabled={!userState}
                                  className="text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-800 outline-none disabled:opacity-50 w-32 font-medium"
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
                                  id={`assigned-clinic-${u.uid}`}
                                  name={`assignedClinic-${u.uid}`}
                                  disabled={!userDistrict}
                                  className="text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-800 outline-none disabled:opacity-50 w-44 font-medium"
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
                                className="text-slate-400 hover:text-red-500 transition-colors"
                                title="Buang rekod"
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

            <section className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
              <div className="flex items-center mb-2">
                <Map className="h-6 w-6 text-purple-600 mr-2" />
                <h2 className="text-xl font-bold text-slate-800 font-sans">2. Pengurusan Struktur Regional (Klinik)</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div className="border rounded-2xl p-4 bg-slate-50 flex flex-col h-[400px]">
                  <h3 className="font-bold text-slate-800 mb-3 flex justify-between items-center text-sm uppercase tracking-wider text-slate-400 font-sans">
                    <span>Negeri</span>
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-bold">{Object.keys(hierarchy).length}</span>
                  </h3>

                  <div className="flex space-x-2 mb-3">
                    <input
                      id="admin-new-state"
                      name="adminNewState"
                      type="text"
                      placeholder="Negeri Baru..."
                      value={newHierarchyState}
                      onChange={(e) => setNewHierarchyState(e.target.value)}
                      className="border border-slate-300 p-2 rounded-lg text-sm bg-white text-slate-800 flex-1 outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
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
                        className={`p-3 border rounded-xl flex justify-between items-center cursor-pointer transition-all ${adminSelectedState === stateName ? 'bg-purple-100 border-purple-500 shadow-sm' : 'bg-white hover:bg-slate-100'
                          }`}
                      >
                        <span className="font-semibold text-slate-800">{stateName}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeState(stateName);
                          }}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border rounded-2xl p-4 bg-slate-50 flex flex-col h-[400px]">
                  <h3 className="font-bold text-slate-800 mb-3 flex justify-between items-center text-sm uppercase tracking-wider text-slate-400 font-sans">
                    <span>Daerah</span>
                    {adminSelectedState && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold font-semibold">
                        {Object.keys(hierarchy[adminSelectedState] || {}).length}
                      </span>
                    )}
                  </h3>

                  {adminSelectedState ? (
                    <>
                      <div className="flex space-x-2 mb-3">
                        <input
                          id="admin-new-district"
                          name="adminNewDistrict"
                          type="text"
                          placeholder={`Daerah Baru di ${adminSelectedState}...`}
                          value={newHierarchyDistrict}
                          onChange={(e) => setNewHierarchyDistrict(e.target.value)}
                          className="border border-slate-300 p-2 rounded-lg text-sm bg-white text-slate-800 flex-1 outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                        />
                        <button onClick={addDistrict} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-bold">Tambah</button>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2">
                        {Object.keys(hierarchy[adminSelectedState] || {}).map(distName => (
                          <div
                            key={distName}
                            onClick={() => setAdminSelectedDistrict(distName)}
                            className={`p-3 border rounded-xl flex justify-between items-center cursor-pointer transition-all ${adminSelectedDistrict === distName ? 'bg-blue-100 border-blue-500 shadow-sm' : 'bg-white hover:bg-slate-100'
                              }`}
                          >
                            <span className="font-semibold text-slate-800">{distName}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeDistrict(distName);
                              }}
                              className="text-slate-400 hover:text-red-500"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm text-center">
                      <MapPin className="h-8 w-8 mb-2 text-slate-300" />
                      Sila pilih Negeri dahulu untuk menguruskan Daerah.
                    </div>
                  )}
                </div>

                <div className="border rounded-2xl p-4 bg-slate-50 flex flex-col h-[400px]">
                  <h3 className="font-bold text-slate-800 mb-3 flex justify-between items-center text-sm uppercase tracking-wider text-slate-400 font-sans">
                    <span>Klinik Kesihatan</span>
                    {adminSelectedState && adminSelectedDistrict && (
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold font-semibold">
                        {getNested(hierarchy, [adminSelectedState, adminSelectedDistrict]).length}
                      </span>
                    )}
                  </h3>

                  {adminSelectedState && adminSelectedDistrict ? (
                    <>
                      <div className="flex space-x-2 mb-3">
                        <input
                          id="admin-new-clinic"
                          name="adminNewClinic"
                          type="text"
                          placeholder={`Klinik di ${adminSelectedDistrict}...`}
                          value={newClinicName}
                          onChange={(e) => setNewClinicName(e.target.value)}
                          className="border border-slate-300 p-2 rounded-lg text-sm bg-white text-slate-800 flex-1 outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                        />
                        <button onClick={addClinic} className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-sm font-bold">Tambah</button>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2">
                        {(getNested(hierarchy, [adminSelectedState, adminSelectedDistrict]) || []).map(clinic => (
                          <div
                            key={clinic}
                            className="p-3 border rounded-xl flex justify-between items-center bg-white hover:bg-slate-100 transition-all text-slate-800"
                          >
                            <span className="font-semibold text-slate-850 text-sm font-sans">{clinic}</span>
                            <button
                              onClick={() => removeClinic(clinic)}
                              className="text-slate-400 hover:text-red-500"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm text-center">
                      <Building2 className="h-8 w-8 mb-2 text-slate-300" />
                      Sila pilih Daerah dahulu untuk menguruskan Klinik.
                    </div>
                  )}
                </div>

              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Settings className="h-6 w-6 text-orange-600 mr-2" />
                  <h2 className="text-lg font-bold text-slate-800 font-sans">3. Jabatan / Zon (Zoning)</h2>
                </div>
                <div className="flex space-x-2">
                  <input
                    id="admin-new-dept"
                    name="adminNewDept"
                    type="text"
                    placeholder="Jabatan Baru..."
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    className="border border-slate-300 p-2 rounded-lg text-sm bg-white text-slate-800 w-40 md:w-56 focus:ring-2 focus:ring-orange-500 outline-none font-semibold"
                  />
                  <button onClick={addDepartment} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">Tambah</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {departments.map((dept, idx) => (
                  <div key={idx} className="px-4 py-2 border rounded-full flex items-center bg-slate-50 shadow-sm space-x-3 text-slate-800">
                    <span className="font-semibold text-slate-700 text-sm">{dept}</span>
                    <button onClick={() => removeDepartment(dept)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Monitor className="h-6 w-6 text-emerald-600 mr-2" />
                  <h2 className="text-lg font-bold text-slate-800 font-sans">4. TV Media Playlist</h2>
                </div>
                <div className="flex space-x-2">
                  <select
                    id="admin-media-type"
                    name="adminMediaType"
                    value={newMediaType}
                    onChange={(e) => setNewMediaType(e.target.value)}
                    className="border border-slate-300 p-2 rounded-lg text-sm bg-white text-slate-800 outline-none font-semibold"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                  <input
                    id="admin-media-url"
                    name="adminMediaUrl"
                    type="text"
                    placeholder="Direct URL (.jpg, .mp4)"
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    className="border border-slate-300 p-2 rounded-lg text-sm bg-white text-slate-800 w-48 md:w-64 focus:ring-2 focus:ring-emerald-500 outline-none font-semibold"
                  />
                  <button onClick={addMedia} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">Tambah URL</button>
                </div>
              </div>
              <div className="space-y-3">
                {mediaList.map((media, idx) => (
                  <div key={idx} className="p-4 border rounded-xl flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors text-slate-800">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      {media.type === 'video' ? <Film className="h-5 w-5 text-slate-500 shrink-0" /> : <ImageIcon className="h-5 w-5 text-slate-500 shrink-0" />}
                      <span className="font-medium text-slate-700 truncate text-sm">{media.url}</span>
                    </div>
                    <button onClick={() => removeMedia(idx)} className="text-slate-400 hover:text-red-500 transition-colors ml-4 shrink-0">
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
              <div className="flex items-center">
                <LinkIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-bold text-slate-800 font-sans">5. Jana Pautan Pintas TV (Bypass Google Auth)</h2>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Gunakan pembina pautan ini untuk menjana URL khas bagi TV anda. Pautan ini membolehkan TV anda memaparkan skrin panggilan secara langsung **tanpa perlu log masuk dengan Google**.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="gen-state" className="block text-xs font-bold text-slate-500 uppercase mb-1">Negeri</label>
                  <select
                    id="gen-state"
                    name="genState"
                    className="w-full p-3 border rounded-xl bg-white text-slate-800 font-semibold border-slate-300"
                    value={genState}
                    onChange={(e) => {
                      setGenState(e.target.value);
                      setGenDistrict('');
                      setGenClinic('');
                    }}
                  >
                    <option value="">Pilih...</option>
                    {Object.keys(hierarchy).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="gen-district" className="block text-xs font-bold text-slate-500 uppercase mb-1">Daerah</label>
                  <select
                    id="gen-district"
                    name="genDistrict"
                    disabled={!genState}
                    className="w-full p-3 border rounded-xl bg-white text-slate-800 font-semibold border-slate-300 disabled:bg-slate-100"
                    value={genDistrict}
                    onChange={(e) => {
                      setGenDistrict(e.target.value);
                      setGenClinic('');
                    }}
                  >
                    <option value="">Pilih...</option>
                    {(genState ? Object.keys(hierarchy[genState] || {}) : []).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="gen-clinic" className="block text-xs font-bold text-slate-500 uppercase mb-1">Klinik Kesihatan</label>
                  <select
                    id="gen-clinic"
                    name="genClinic"
                    disabled={!genDistrict}
                    className="w-full p-3 border rounded-xl bg-white text-slate-800 font-semibold border-slate-300 disabled:bg-slate-100"
                    value={genClinic}
                    onChange={(e) => setGenClinic(e.target.value)}
                  >
                    <option value="">Pilih...</option>
                    {(genState && genDistrict ? (hierarchy[genState][genDistrict] || []) : []).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="gen-dept" className="block text-xs font-bold text-slate-500 uppercase mb-1">Jabatan / Zon</label>
                  <select
                    id="gen-dept"
                    name="genDept"
                    disabled={!genClinic}
                    className="w-full p-3 border rounded-xl bg-white text-slate-800 font-semibold border-slate-300 disabled:bg-slate-100"
                    value={genDept}
                    onChange={(e) => setGenDept(e.target.value)}
                  >
                    <option value="">Pilih...</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {genState && genDistrict && genClinic && genDept && (
                <div className="p-4 bg-slate-50 border rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="overflow-hidden w-full">
                    <p className="text-xs font-bold text-slate-400 uppercase">Pautan Dijana:</p>
                    <p className="text-xs text-blue-600 font-mono truncate select-all mt-1 bg-white p-2 border rounded-lg">{generateBypassLink()}</p>
                  </div>
                  <button
                    onClick={copyBypassLinkToClipboard}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shrink-0 flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95"
                  >
                    {copiedLink ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span>Berjaya Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Salin Pautan TV</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </section>
          </main>
        </div>
      )}

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