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
  CheckCircle2,
  Trash2,
  Plus,
  Tv,
  Check,
  Unlock,
  Sliders,
  Shield
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';

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
  },
  "Selangor": {
    "Petaling": [
      "Klinik Kesihatan Kelana Jaya",
      "Klinik Kesihatan Shah Alam Seksyen 7",
      "Klinik Kesihatan Puchong"
    ]
  }
};

const DEFAULT_DEPARTMENTS = ["OPD", "MCH", "Farmasi", "Makmal"];

const DEFAULT_MEDIA = [
  { type: 'image', url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=1200' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1200' }
];

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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-xl ${type === 'confirm' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
            <Shield className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        </div>
        <p className="text-slate-600 mb-6 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3">
          {type === 'confirm' && (
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-2xl transition-colors border border-slate-200/60"
            >
              Batal
            </button>
          )}
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            {type === 'confirm' ? 'Sahkan' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};

const UserSetupScreen = ({ hierarchy, user, handleLogout }) => {
  const [stateSel, setStateSel] = useState('');
  const [districtSel, setDistrictSel] = useState('');
  const [clinicSel, setClinicSel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const states = Object.keys(hierarchy || {});
  const districts = stateSel ? Object.keys(hierarchy[stateSel] || {}) : [];
  const clinics = (stateSel && districtSel) ? (hierarchy[stateSel]?.[districtSel] || []) : [];

  const handleApply = async (e) => {
    e.preventDefault();
    if (!stateSel || !districtSel || !clinicSel) {
      setErrorMsg('Sila lengkapkan semua pilihan lokasi.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      await setDoc(doc(db, 'qms', 'users'), {
        [user.uid]: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Kakitangan',
          photoURL: user.photoURL || '',
          status: 'pending',
          role: 'staff',
          assignedState: stateSel,
          assignedDistrict: districtSel,
          assignedClinic: clinicSel
        }
      }, { merge: true });
    } catch (err) {
      setErrorMsg('Gagal menghantar permohonan: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800">
        <div className="text-center mb-6">
          <div className="mx-auto h-16 w-16 bg-indigo-950 text-indigo-400 rounded-full flex items-center justify-center mb-4 border border-indigo-500/20">
            <Building2 className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Mohon Akses QMS</h2>
          <p className="text-slate-400 text-sm mt-1">Sila tentukan lokasi bertugas anda untuk pengesahan pentadbir.</p>
        </div>

        <form onSubmit={handleApply} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Negeri</label>
            <select
              value={stateSel}
              onChange={(e) => { setStateSel(e.target.value); setDistrictSel(''); setClinicSel(''); }}
              className="w-full p-3.5 border border-slate-800 rounded-2xl bg-slate-950 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Pilih Negeri...</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Daerah</label>
            <select
              value={districtSel}
              disabled={!stateSel}
              onChange={(e) => { setDistrictSel(e.target.value); setClinicSel(''); }}
              className="w-full p-3.5 border border-slate-800 rounded-2xl bg-slate-950 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
            >
              <option value="">Pilih Daerah...</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Klinik Kesihatan</label>
            <select
              value={clinicSel}
              disabled={!districtSel}
              onChange={(e) => setClinicSel(e.target.value)}
              className="w-full p-3.5 border border-slate-800 rounded-2xl bg-slate-950 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
            >
              <option value="">Pilih Klinik...</option>
              {clinics.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/40 text-rose-400 rounded-2xl text-xs font-bold border border-rose-900/30">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !clinicSel}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {submitting ? 'Menghantar...' : 'Hantar Permohonan'}
          </button>
        </form>

        <button
          onClick={handleLogout}
          className="w-full mt-3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl transition-all"
        >
          Keluar Akaun
        </button>
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Sesi Panggilan</h2>
              <p className="text-xs text-indigo-400 font-bold uppercase mt-0.5 tracking-wider">
                {isSuperadmin ? "Mod Superadmin" : "Mod Kakitangan Terselia"}
              </p>
            </div>
            <button onClick={() => setCurrentView('login')} className="p-2 text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 rounded-xl transition-all">
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Negeri</label>
              <select
                disabled={!isSuperadmin}
                className="w-full p-3.5 border border-slate-800 rounded-2xl bg-slate-950 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
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
                className="w-full p-3.5 border border-slate-800 rounded-2xl bg-slate-950 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
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
                className="w-full p-3.5 border border-slate-800 rounded-2xl bg-slate-950 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
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
                className="w-full p-3.5 border border-slate-800 rounded-2xl bg-slate-955 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full p-3.5 border border-slate-800 rounded-2xl bg-slate-955 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="w-full py-4 mt-4 bg-indigo-600 text-white font-bold rounded-2xl disabled:opacity-50 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
            >
              Mula Memanggil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-955 text-white flex flex-col justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm mx-auto flex flex-col h-full bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">{selectedDept} • {localRoom}</p>
              <div className={`h-2.5 w-2.5 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
            </div>
            <h1 className="text-xl font-black tracking-tight mt-1 truncate w-48">{selectedClinic}</h1>
            <p className="text-xs text-slate-400 mt-0.5 truncate w-48">{selectedDistrict}, {selectedState}</p>
          </div>
          <button onClick={() => setStep(1)} className="p-3 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all rounded-2xl text-slate-300">
            <Settings className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-slate-955 rounded-2xl p-6 mb-6 flex justify-center items-center shadow-inner border border-slate-800 min-h-[120px]">
          <span className="text-6xl font-black tracking-wider text-indigo-400 font-mono">
            {currentInput || '----'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => setCurrentInput(prev => (prev.length < 4 ? prev + num : prev))}
              className="bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-2xl py-5 text-2xl font-bold transition-all font-mono text-slate-100 border border-slate-700/30"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setCurrentInput('')}
            className="bg-rose-955/80 hover:bg-rose-900 active:scale-95 text-rose-300 rounded-2xl py-5 text-lg font-bold transition-all border border-rose-900/40"
          >
            CLR
          </button>
          <button
            onClick={() => setCurrentInput(prev => (prev.length < 4 ? prev + '0' : prev))}
            className="bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-2xl py-5 text-2xl font-bold transition-all font-mono"
          >
            0
          </button>
          <button
            onClick={() => setCurrentInput(prev => prev.slice(0, -1))}
            className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-2xl py-5 text-lg font-bold transition-all border border-slate-700/30"
          >
            DEL
          </button>
        </div>

        <div className="flex flex-col space-y-3">
          {hasActiveNumber && (
            <button
              onClick={handleRedial}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 shadow-lg shadow-amber-900/40 border border-amber-500/20 transition-all active:scale-98"
            >
              <RotateCcw className="h-5 w-5 animate-spin-reverse" />
              <span>Panggil Semula ({activeNumber})</span>
            </button>
          )}

          <button
            onClick={handleCallNext}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center space-x-2 shadow-xl shadow-indigo-955/50 transition-all active:scale-98"
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
  setCurrentView, queues, mediaList, stateMedia, dbStatus,
  isSuperadmin
}) => {
  const [setupDone, setSetupDone] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [previousQueues, setPreviousQueues] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);

  const audioCtxRef = useRef(null);
  const [highlightedRoom, setHighlightedRoom] = useState(null);
  const videoRefs = useRef({});

  // Fetch pictures/videos specific to this Negeri. Fall back to Global media if empty
  const activeMediaPlaylist = (stateMedia && stateMedia[selectedState] && stateMedia[selectedState].length > 0)
    ? stateMedia[selectedState]
    : mediaList;

  const activeMedia = activeMediaPlaylist[currentMediaIndex] || DEFAULT_MEDIA[0];

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

      if (!response.ok) throw new Error("Gemini TTS API returned failure code.");

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
        audio.play().catch(e => console.warn("Failed playing generated Gemini wave binary", e));
        return;
      }
    } catch (apiError) {
      console.warn("Gemini TTS failing. Falling back seamlessly to browser WebSpeech API...", apiError);
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
    if (currentMediaIndex >= activeMediaPlaylist.length) setCurrentMediaIndex(0);
  }, [activeMediaPlaylist.length, currentMediaIndex]);

  useEffect(() => {
    if (!setupDone || activeMediaPlaylist.length === 0) return;
    if (activeMedia && activeMedia.type === 'video') return;

    const timer = setTimeout(() => {
      setCurrentMediaIndex(prev => (prev + 1) % activeMediaPlaylist.length);
    }, 12000);

    return () => clearTimeout(timer);
  }, [setupDone, currentMediaIndex, activeMediaPlaylist, activeMedia]);

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

    setSetupDone(true);
  };

  if (!setupDone) {
    return (
      <div className="min-h-screen bg-slate-955 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 p-8 rounded-[32px] shadow-2xl border border-slate-800 text-white">
          <h2 className="text-2xl font-bold mb-2 text-center text-white">Konfigurasi TV Display</h2>
          <p className="text-xs text-indigo-400 text-center uppercase tracking-wider mb-6">
            {isSuperadmin ? "Mod Superadmin" : "Mod Kakitangan Terselia"}
          </p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">Negeri</label>
              <select
                disabled={!isSuperadmin}
                className="w-full p-4 border border-slate-800 rounded-2xl bg-slate-955 text-white disabled:opacity-40"
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
                disabled={!isSuperadmin || !selectedState}
                className="w-full p-4 border border-slate-800 rounded-2xl bg-slate-955 text-white disabled:opacity-40"
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
                disabled={!isSuperadmin || !selectedDistrict}
                className="w-full p-4 border border-slate-800 rounded-2xl bg-slate-955 text-white disabled:opacity-40"
                value={selectedClinic}
                onChange={(e) => setSelectedClinic(e.target.value)}
              >
                <option value="">Pilih...</option>
                {clinicsList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">Jabatan (Zon)</label>
              <select
                className="w-full p-4 border border-slate-800 rounded-2xl bg-slate-955 text-white"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="">Pilih...</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="pt-4 flex space-x-3">
              <button
                onClick={() => setCurrentView('login')}
                className="flex-1 py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-colors"
              >
                Kembali
              </button>
              <button
                disabled={!selectedState || !selectedDistrict || !selectedClinic || !selectedDept}
                onClick={handleStartTV}
                className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl disabled:opacity-50 hover:bg-emerald-500 flex items-center justify-center transition-colors"
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
            onClick={() => { setSetupDone(false); setCurrentView('login'); }}
            className="text-xs bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-slate-300 transition-all font-semibold"
          >
            Tutup TV Mode
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row relative z-10">
        <div className="flex-1 relative bg-slate-955 flex items-center justify-center overflow-hidden">
          {activeMediaPlaylist.map((media, index) => (
            media.type === 'video' ? (
              <video
                key={`${media.url}-${index}`}
                src={media.url}
                muted
                playsInline
                onEnded={() => setCurrentMediaIndex(prev => (prev + 1) % activeMediaPlaylist.length)}
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
              <div className="flex-1 flex items-center justify-center text-slate-600 text-2xl font-semibold">
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

const AdminPanel = ({
  hierarchy,
  userPermissions,
  user,
  updateUserStatus,
  updateUserAssignment,
  deleteUserRecord,
  setCurrentView
}) => {
  const adminClinics = userPermissions?.[user.uid]?.managedClinics || [];

  // Filter requests that are pending AND belong to the clinics this Admin is authorized to manage
  const pendingRequests = Object.values(userPermissions || {}).filter(u => {
    return u.status === 'pending' && adminClinics.includes(u.assignedClinic);
  });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-white">
      <header className="bg-slate-900 border-b border-slate-800 px-8 py-5 flex justify-between items-center sticky top-0 z-10 shadow-lg">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Portal Pentadbir (Admin)</h1>
          <p className="text-sm text-slate-400">Kelulusan Akses untuk Klinik di bawah Pengurusan Anda</p>
        </div>
        <button onClick={() => setCurrentView('login')} className="px-5 py-2.5 text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all">
          Kembali
        </button>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-8">
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-2">Klinik di bawah Kawalan Anda:</h2>
          <div className="flex flex-wrap gap-2">
            {adminClinics.map((clinic, i) => (
              <span key={i} className="px-3.5 py-1.5 bg-indigo-950/60 text-indigo-400 text-xs font-bold rounded-full border border-indigo-900/30">
                {clinic}
              </span>
            ))}
            {adminClinics.length === 0 && (
              <span className="text-sm text-amber-500 font-medium">Tiada klinik yang diberikan oleh Superadmin lagi.</span>
            )}
          </div>
        </div>

        <section className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="h-6 w-6 text-indigo-400" />
              <span>Permohonan Akses Kakitangan</span>
            </h2>
            <span className="bg-rose-955 text-rose-400 px-3 py-1 rounded-full text-xs font-bold font-mono border border-rose-900/20">
              {pendingRequests.length} permohonan
            </span>
          </div>

          <div className="divide-y divide-slate-800">
            {pendingRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-medium">
                Tiada permohonan akses baru untuk klinik anda buat masa ini.
              </div>
            ) : (
              pendingRequests.map(req => (
                <div key={req.uid} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-850/30 transition-all">
                  <div className="flex items-center gap-4">
                    <img src={req.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'} alt="Profile" className="h-12 w-12 rounded-full border border-slate-800 shadow-sm" />
                    <div>
                      <p className="font-bold text-white text-base">{req.displayName}</p>
                      <p className="text-xs text-slate-500 font-semibold">{req.email}</p>
                      <p className="text-xs text-indigo-400 font-bold mt-1">
                        KK: {req.assignedClinic} ({req.assignedDistrict}, {req.assignedState})
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button
                      onClick={() => updateUserStatus(req.uid, 'rejected')}
                      className="flex-1 md:flex-none px-4 py-2 bg-rose-955/40 text-rose-400 hover:bg-rose-900/60 text-sm font-bold rounded-xl border border-rose-900/30 transition-all"
                    >
                      Tolak
                    </button>
                    <button
                      onClick={() => updateUserStatus(req.uid, 'approved')}
                      className="flex-1 md:flex-none px-5 py-2 bg-indigo-600 text-white hover:bg-indigo-500 text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20"
                    >
                      Sahkan Permohonan
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState('login');
  const [hierarchy, setHierarchy] = useState(DEFAULT_HIERARCHY);
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [mediaList, setMediaList] = useState(DEFAULT_MEDIA);
  const [stateMedia, setStateMedia] = useState({});
  const [queues, setQueues] = useState({});
  const [userPermissions, setUserPermissions] = useState(null);

  const [newClinicName, setNewClinicName] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState('image');

  const [activeMediaState, setActiveMediaState] = useState('');

  const [newHierarchyState, setNewHierarchyState] = useState('');
  const [newHierarchyDistrict, setNewHierarchyDistrict] = useState('');
  const [adminSelectedState, setAdminSelectedState] = useState('');
  const [adminSelectedDistrict, setAdminSelectedDistrict] = useState('');

  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedClinic, setSelectedClinic] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

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

  useEffect(() => {
    const mode = getQueryParam('mode');
    const bState = getQueryParam('state');
    const bDistrict = getQueryParam('district');
    const bClinic = getQueryParam('clinic');
    const bDept = getQueryParam('dept');

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

    const myPerm = userPermissions[user.uid];
    if (myPerm && myPerm.status === 'approved') {
      setSelectedState(myPerm.assignedState || '');
      setSelectedDistrict(myPerm.assignedDistrict || '');
      setSelectedClinic(myPerm.assignedClinic || '');
    }
  }, [user, userPermissions]);

  useEffect(() => {
    const bState = getQueryParam('state');
    const isTvBypass = getQueryParam('mode') === 'tv' && bState;

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
        if (data.stateMedia) setStateMedia(data.stateMedia);
      } else {
        setDoc(configRef, {
          hierarchy: DEFAULT_HIERARCHY,
          departments: DEFAULT_DEPARTMENTS,
          media: DEFAULT_MEDIA,
          stateMedia: {}
        }, { merge: true })
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
    const cleanUrl = newMediaUrl.trim();

    if (activeMediaState) {
      const updatedStateMedia = { ...stateMedia };
      if (!updatedStateMedia[activeMediaState]) {
        updatedStateMedia[activeMediaState] = [];
      }
      updatedStateMedia[activeMediaState].push({ url: cleanUrl, type: newMediaType });
      setStateMedia(updatedStateMedia);
      setNewMediaUrl('');
      await setDoc(doc(db, 'qms', 'config'), { stateMedia: updatedStateMedia }, { merge: true });
    } else {
      const updatedMedia = [...mediaList, { url: cleanUrl, type: newMediaType }];
      setMediaList(updatedMedia);
      setNewMediaUrl('');
      await setDoc(doc(db, 'qms', 'config'), { media: updatedMedia }, { merge: true });
    }
  };

  const removeMedia = async (idxToRemove) => {
    showModal('Padam Media', `Pasti mahu memadam media ini dari playlist?`, 'confirm', async () => {
      if (activeMediaState) {
        const updatedStateMedia = { ...stateMedia };
        if (updatedStateMedia[activeMediaState]) {
          updatedStateMedia[activeMediaState] = updatedStateMedia[activeMediaState].filter((_, idx) => idx !== idxToRemove);
          setStateMedia(updatedStateMedia);
          await setDoc(doc(db, 'qms', 'config'), { stateMedia: updatedStateMedia }, { merge: true });
        }
      } else {
        const updatedMedia = mediaList.filter((_, idx) => idx !== idxToRemove);
        setMediaList(updatedMedia);
        await setDoc(doc(db, 'qms', 'config'), { media: updatedMedia }, { merge: true });
      }
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

  const updateUserRole = async (uid, role) => {
    await setDoc(doc(db, 'qms', 'users'), {
      [uid]: { role }
    }, { merge: true });
  };

  const updateUserManagedClinics = async (uid, clinic, isChecked) => {
    const currentUserObj = userPermissions?.[uid] || {};
    let managed = currentUserObj.managedClinics || [];
    if (isChecked) {
      if (!managed.includes(clinic)) {
        managed = [...managed, clinic];
      }
    } else {
      managed = managed.filter(c => c !== clinic);
    }
    await setDoc(doc(db, 'qms', 'users'), {
      [uid]: { managedClinics: managed }
    }, { merge: true });
  };

  const deleteUserRecord = async (uid) => {
    showModal('Padam Kakitangan', 'Padam rekod pendaftaran kakitangan ini?', 'confirm', async () => {
      const updatedPermissions = { ...userPermissions };
      delete updatedPermissions[uid];
      await setDoc(doc(db, 'qms', 'users'), updatedPermissions);
    });
  };

  const generateBypassLink = () => {
    if (!genState || !genDistrict || !genClinic || !genDept) return '';
    const base = window.location.origin + window.location.pathname;
    return `${base}?mode=tv&state=${encodeURIComponent(genState)}&district=${encodeURIComponent(genDistrict)}&clinic=${encodeURIComponent(genClinic)}&dept=${encodeURIComponent(genDept)}`;
  };

  const copyBypassLinkToClipboard = () => {
    const link = generateBypassLink();
    if (!link) return;

    const dummy = document.createElement('textarea');
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
      <div className="min-h-screen bg-slate-955 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user && getQueryParam('mode') !== 'tv') {
    return (
      <div className="min-h-screen bg-slate-955 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 bg-slate-900 p-8 rounded-[32px] shadow-2xl border border-slate-800 text-center animate-in fade-in zoom-in duration-300">
          <div className="mx-auto h-20 w-20 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6">
            <svg className="h-10 w-10 text-white animate-pulse" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight leading-none">PKD QMS Gateway</h2>
          <p className="mt-2 text-sm text-slate-400 mb-8 font-semibold">Sistem Pengurusan Giliran Bersepadu & Kawalan Akses</p>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center space-x-3 py-4 bg-slate-955 border-2 border-slate-800 rounded-2xl hover:bg-slate-850 hover:border-indigo-500 transition-all shadow-sm group"
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

  const isSuperadmin = user?.email === 'dr.narish@gmail.com';
  const myPermission = userPermissions ? userPermissions[user.uid] : null;

  if (user && !isSuperadmin && !myPermission) {
    return (
      <UserSetupScreen
        hierarchy={hierarchy}
        user={user}
        handleLogout={handleLogout}
      />
    );
  }

  if (user && !isSuperadmin && myPermission && myPermission.status !== 'approved') {
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
                ? "Maaf, permohonan akses anda ke sistem QMS telah ditolak. Sila hubungi pentadbir sistem untuk maklumat lanjut."
                : "Akaun anda sedia didaftarkan! Sila hubungi Admin klinik anda atau Superadmin untuk kelulusan kemasukan."
              }
            </p>
          </div>

          <div className="bg-slate-955 p-4 rounded-2xl border border-slate-800 flex items-center space-x-3 text-left">
            <img src={user.photoURL} alt="Profile" className="h-12 w-12 rounded-full border border-slate-800 shadow-sm" />
            <div className="overflow-hidden">
              <p className="font-bold text-white truncate">{user.displayName}</p>
              <p className="text-xs text-slate-500 truncate font-semibold">{user.email}</p>
              <p className="text-xs text-indigo-400 font-bold mt-0.5">KK: {myPermission.assignedClinic}</p>
            </div>
          </div>

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

  if (currentView === 'login' && user) {
    const isAdmin = myPermission?.role === 'admin';
    return (
      <div className="min-h-screen bg-slate-955 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6 animate-in fade-in duration-200">
          <div className="text-center bg-slate-900 p-8 rounded-[32px] shadow-xl border border-slate-800">
            <div className="mx-auto h-16 w-16 mb-4 relative">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profil" className="h-full w-full rounded-full shadow-md border border-slate-700" />
              ) : (
                <div className="h-full w-full bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
                  <Users className="h-8 w-8 text-white" />
                </div>
              )}
              <span className={`absolute bottom-0 right-0 h-4.5 w-4.5 rounded-full border-2 border-slate-900 ${isSuperadmin ? 'bg-purple-500' : isAdmin ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
            </div>
            <h2 className="text-2xl font-black text-white leading-tight">Hai, {user.displayName || 'Kakitangan'}</h2>
            <p className="text-sm font-bold text-slate-400 mt-1">{user.email}</p>

            <div className="flex justify-center gap-2 mt-3">
              {isSuperadmin ? (
                <span className="inline-flex items-center space-x-1.5 bg-purple-950/60 text-purple-400 px-3 py-1 rounded-full text-xs font-black border border-purple-900/30">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Superadmin</span>
                </span>
              ) : isAdmin ? (
                <span className="inline-flex items-center space-x-1.5 bg-indigo-950/60 text-indigo-400 px-3 py-1 rounded-full text-xs font-black border border-indigo-900/30">
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Admin Klinik</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 bg-emerald-950/60 text-emerald-400 px-3 py-1 rounded-full text-xs font-black border border-emerald-900/30">
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>KK: {myPermission?.assignedClinic}</span>
                </span>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="mt-5 text-xs font-black px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-rose-955 hover:text-rose-400 border border-slate-700/50 transition-all"
            >
              Log Keluar
            </button>
          </div>

          <div className="space-y-4">
            {isSuperadmin && (
              <button
                onClick={() => setCurrentView('admin')}
                className="w-full flex items-center justify-between p-5 bg-slate-900 border-2 border-slate-800 rounded-2xl shadow-sm hover:border-purple-500 hover:shadow-md transition-all group"
              >
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-purple-950 text-purple-400 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all border border-purple-900/20">
                    <Settings className="h-6 w-6" />
                  </div>
                  <div className="ml-4 text-left">
                    <p className="text-lg font-bold text-white">Portal Superadmin</p>
                    <p className="text-sm text-slate-400">Konfigurasi & Kelulusan Global</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-purple-500" />
              </button>
            )}

            {(isAdmin || isSuperadmin) && (
              <button
                onClick={() => setCurrentView('adminPanel')}
                className="w-full flex items-center justify-between p-5 bg-slate-900 border-2 border-slate-800 rounded-2xl shadow-sm hover:border-indigo-500 hover:shadow-md transition-all group"
              >
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-indigo-955 text-indigo-400 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all border border-indigo-900/20">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div className="ml-4 text-left">
                    <p className="text-lg font-bold text-white">Portal Pentadbir (Admin)</p>
                    <p className="text-sm text-slate-400">Urus permohonan klinik bertugas</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-indigo-500" />
              </button>
            )}

            <button
              onClick={() => setCurrentView('input')}
              className="w-full flex items-center justify-between p-5 bg-slate-900 border-2 border-slate-800 rounded-2xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center">
                <div className="h-12 w-12 bg-blue-950 text-blue-400 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all border border-blue-900/20">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div className="ml-4 text-left">
                  <p className="text-lg font-bold text-white">Portal Staf (Input)</p>
                  <p className="text-sm text-slate-400">Panggil nombor giliran pesakit</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-blue-500" />
            </button>

            <button
              onClick={() => setCurrentView('output')}
              className="w-full flex items-center justify-between p-5 bg-slate-900 border-2 border-slate-800 rounded-2xl shadow-sm hover:border-emerald-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center">
                <div className="h-12 w-12 bg-emerald-950 text-emerald-400 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all border border-emerald-900/20">
                  <Monitor className="h-6 w-6" />
                </div>
                <div className="ml-4 text-left">
                  <p className="text-lg font-bold text-white">Skrin TV (Output)</p>
                  <p className="text-sm text-slate-400">Paparan ruang menunggu pesakit</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-emerald-500" />
            </button>
          </div>
        </div>
        <Modal {...modalConfig} />
      </div>
    );
  }

  return (
    <>
      {currentView === 'adminPanel' && (
        <AdminPanel
          hierarchy={hierarchy}
          userPermissions={userPermissions}
          user={user}
          updateUserStatus={updateUserStatus}
          updateUserAssignment={updateUserAssignment}
          deleteUserRecord={deleteUserRecord}
          setCurrentView={setCurrentView}
        />
      )}

      {currentView === 'admin' && (
        <div className="min-h-screen bg-slate-955 flex flex-col text-white">
          <header className="bg-slate-900 border-b border-slate-800 px-8 py-5 flex justify-between items-center sticky top-0 z-10 shadow-lg">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Dashboard Superadmin</h1>
              <p className="text-sm text-slate-400">Konfigurasi Wilayah, Playlist & Kawalan Kakitangan</p>
            </div>
            <button onClick={() => setCurrentView('login')} className="px-5 py-2.5 text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all border border-slate-700/50">
              Kembali
            </button>
          </header>

          <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-8">

            {/* 1. Pengurusan Hak Akses Kakitangan */}
            <section className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-8 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Users className="h-7 w-7 text-indigo-400 mr-2" />
                  <h2 className="text-2xl font-bold tracking-tight">1. Pengurusan Hak Akses Kakitangan</h2>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400 bg-slate-955/50">
                      <th className="p-4 font-bold">Kakitangan</th>
                      <th className="p-4 font-bold">Status Akses</th>
                      <th className="p-4 font-bold">Peranan</th>
                      <th className="p-4 font-bold">Tugasan Lokasi / Kawalan Admin</th>
                      <th className="p-4 font-bold text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(userPermissions || {}).length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-500 font-medium">Tiada pendaftaran kakitangan dikesan.</td>
                      </tr>
                    ) : (
                      Object.values(userPermissions || {}).map((u) => {
                        const userState = u.assignedState || '';
                        const userDistrict = u.assignedDistrict || '';
                        const stateDistricts = userState ? Object.keys(hierarchy[userState] || {}) : [];
                        const districtClinics = (userState && userDistrict) ? (hierarchy[userState]?.[userDistrict] || []) : [];
                        const userRole = u.role || 'staff';

                        const allClinicsInDistrict = (userState && userDistrict) ? (hierarchy[userState]?.[userDistrict] || []) : [];

                        return (
                          <tr key={u.uid} className="border-b border-slate-850 last:border-0 hover:bg-slate-850/20 transition-all">
                            <td className="p-4 flex items-center space-x-3">
                              <img src={u.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'} alt="Profile" className="h-10 w-10 rounded-full border border-slate-800 shadow-sm" />
                              <div className="overflow-hidden w-40 md:w-56">
                                <p className="font-bold text-white truncate text-sm">{u.displayName}</p>
                                <p className="text-xs text-slate-500 truncate font-semibold">{u.email}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <select
                                className={`text-xs font-bold py-1.5 px-3 rounded-full border outline-none bg-slate-950 ${u.status === 'approved' ? 'bg-emerald-955/40 text-emerald-400 border-emerald-900/30' :
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
                            <td className="p-4">
                              <select
                                className="text-xs font-bold py-1.5 px-3 rounded-xl border border-slate-800 outline-none bg-slate-950 text-slate-200"
                                value={userRole}
                                onChange={(e) => updateUserRole(u.uid, e.target.value)}
                              >
                                <option value="staff">Staff</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="p-4 space-y-2">
                              <div className="flex flex-col sm:flex-row gap-2">
                                <select
                                  className="text-xs p-2 border border-slate-800 rounded-xl bg-slate-955 text-white outline-none w-32 font-semibold"
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
                                  disabled={!userState}
                                  className="text-xs p-2 border border-slate-800 rounded-xl bg-slate-955 text-white outline-none disabled:opacity-40 w-32 font-semibold"
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
                                  disabled={!userDistrict}
                                  className="text-xs p-2 border border-slate-800 rounded-xl bg-slate-955 text-white outline-none disabled:opacity-40 w-44 font-semibold"
                                  value={u.assignedClinic || ''}
                                  onChange={(e) => updateUserAssignment(u.uid, 'assignedClinic', e.target.value)}
                                >
                                  <option value="">Klinik...</option>
                                  {districtClinics.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </div>

                              {/* Multi-Clinic Authorization selection panel for users designated as Admin */}
                              {userRole === 'admin' && userDistrict && (
                                <div className="mt-2 p-3 bg-indigo-955/40 border border-indigo-900/30 rounded-xl space-y-2">
                                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Klinik Kawalan Admin ({userDistrict}):</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    {allClinicsInDistrict.map(clinic => {
                                      const isChecked = (u.managedClinics || []).includes(clinic);
                                      return (
                                        <label key={clinic} className="flex items-center space-x-2 text-xs text-slate-300 font-semibold cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950"
                                            onChange={(e) => updateUserManagedClinics(u.uid, clinic, e.target.checked)}
                                          />
                                          <span>{clinic}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => deleteUserRecord(u.uid)}
                                className="text-slate-500 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 className="h-5 w-5" />
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

            {/* 2. Pengurusan Struktur Regional (Klinik) */}
            <section className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-8 space-y-6">
              <div className="flex items-center mb-2">
                <Map className="h-7 w-7 text-purple-400 mr-2" />
                <h2 className="text-2xl font-bold tracking-tight">2. Pengurusan Struktur Regional (Klinik)</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* STATE BOX */}
                <div className="border border-slate-800 rounded-2xl p-5 bg-slate-955/40 flex flex-col h-[400px]">
                  <h3 className="font-bold text-slate-300 mb-3 flex justify-between items-center text-xs uppercase tracking-wider text-slate-500">
                    <span>Negeri</span>
                    <span className="bg-purple-950 text-purple-400 px-2.5 py-0.5 rounded-full text-xs font-black border border-purple-900/30">{Object.keys(hierarchy).length}</span>
                  </h3>

                  <div className="flex space-x-2 mb-3">
                    <input
                      type="text"
                      placeholder="Negeri Baru..."
                      value={newHierarchyState}
                      onChange={(e) => setNewHierarchyState(e.target.value)}
                      className="border border-slate-800 p-2.5 rounded-xl text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold text-white bg-slate-955"
                    />
                    <button onClick={addState} className="bg-purple-600 hover:bg-purple-500 text-white p-2.5 rounded-xl text-sm font-bold transition-colors">
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {Object.keys(hierarchy).map(stateName => (
                      <div
                        key={stateName}
                        onClick={() => {
                          setAdminSelectedState(stateName);
                          setAdminSelectedDistrict('');
                        }}
                        className={`p-3 border rounded-xl flex justify-between items-center cursor-pointer transition-all ${adminSelectedState === stateName ? 'bg-purple-955/40 border-purple-500 shadow-sm' : 'bg-slate-955 border-slate-850 hover:bg-slate-800'
                          }`}
                      >
                        <span className="font-bold text-white text-sm">{stateName}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeState(stateName);
                          }}
                          className="text-slate-500 hover:text-rose-500 transition-colors"
                        >
                          <XCircle className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DISTRICT BOX */}
                <div className="border border-slate-800 rounded-2xl p-5 bg-slate-955/40 flex flex-col h-[400px]">
                  <h3 className="font-bold text-slate-300 mb-3 flex justify-between items-center text-xs uppercase tracking-wider text-slate-500">
                    <span>Daerah</span>
                    {adminSelectedState && (
                      <span className="bg-blue-950 text-blue-400 px-2.5 py-0.5 rounded-full text-xs font-black border border-blue-900/30">
                        {Object.keys(hierarchy[adminSelectedState] || {}).length}
                      </span>
                    )}
                  </h3>

                  {adminSelectedState ? (
                    <>
                      <div className="flex space-x-2 mb-3">
                        <input
                          type="text"
                          placeholder={`Daerah Baru...`}
                          value={newHierarchyDistrict}
                          onChange={(e) => setNewHierarchyDistrict(e.target.value)}
                          className="border border-slate-800 p-2.5 rounded-xl text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-white bg-slate-955"
                        />
                        <button onClick={addDistrict} className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-xl text-sm font-bold transition-colors">
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {Object.keys(hierarchy[adminSelectedState] || {}).map(distName => (
                          <div
                            key={distName}
                            onClick={() => setAdminSelectedDistrict(distName)}
                            className={`p-3 border rounded-xl flex justify-between items-center cursor-pointer transition-all ${adminSelectedDistrict === distName ? 'bg-blue-955/40 border-blue-500 shadow-sm' : 'bg-slate-955 border-slate-850 hover:bg-slate-800'
                              }`}
                          >
                            <span className="font-bold text-white text-sm">{distName}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeDistrict(distName);
                              }}
                              className="text-slate-500 hover:text-rose-500 transition-colors"
                            >
                              <XCircle className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs text-center font-semibold">
                      <MapPin className="h-8 w-8 mb-2 text-slate-600" />
                      Sila pilih Negeri dahulu untuk menguruskan Daerah.
                    </div>
                  )}
                </div>

                {/* CLINIC BOX */}
                <div className="border border-slate-800 rounded-2xl p-5 bg-slate-955/40 flex flex-col h-[400px]">
                  <h3 className="font-bold text-slate-300 mb-3 flex justify-between items-center text-xs uppercase tracking-wider text-slate-500">
                    <span>Klinik Kesihatan</span>
                    {adminSelectedState && adminSelectedDistrict && (
                      <span className="bg-emerald-950 text-emerald-400 px-2.5 py-0.5 rounded-full text-xs font-black border border-emerald-900/30">
                        {(hierarchy[adminSelectedState]?.[adminSelectedDistrict] || []).length}
                      </span>
                    )}
                  </h3>

                  {adminSelectedState && adminSelectedDistrict ? (
                    <>
                      <div className="flex space-x-2 mb-3">
                        <input
                          type="text"
                          placeholder={`Klinik baru...`}
                          value={newClinicName}
                          onChange={(e) => setNewClinicName(e.target.value)}
                          className="border border-slate-800 p-2.5 rounded-xl text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-white bg-slate-955"
                        />
                        <button onClick={addClinic} className="bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-xl text-sm font-bold transition-colors">
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {(hierarchy[adminSelectedState]?.[adminSelectedDistrict] || []).map(clinic => (
                          <div
                            key={clinic}
                            className="p-3 border border-slate-800 rounded-xl flex justify-between items-center bg-slate-955"
                          >
                            <span className="font-bold text-white text-xs">{clinic}</span>
                            <button
                              onClick={() => removeClinic(clinic)}
                              className="text-slate-500 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs text-center font-semibold">
                      <Building2 className="h-8 w-8 mb-2 text-slate-600" />
                      Sila pilih Daerah dahulu untuk menguruskan Klinik.
                    </div>
                  )}
                </div>

              </div>
            </section>

            {/* 3. Jabatan / Zon (Zoning) */}
            <section className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center">
                  <Settings className="h-7 w-7 text-orange-400 mr-2" />
                  <h2 className="text-2xl font-bold tracking-tight">3. Jabatan / Zon (Zoning)</h2>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Jabatan Baru..."
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    className="border border-slate-800 p-2.5 rounded-xl text-sm w-48 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-white bg-slate-955"
                  />
                  <button onClick={addDepartment} className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors">Tambah</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {departments.map((dept, idx) => (
                  <div key={idx} className="px-4 py-2 border border-slate-800 rounded-2xl flex items-center bg-slate-955/50 shadow-sm space-x-3 text-white">
                    <span className="font-bold text-slate-300 text-sm">{dept}</span>
                    <button onClick={() => removeDepartment(dept)} className="text-slate-500 hover:text-rose-500 transition-colors">
                      <XCircle className="h-4.5 w-4.5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. TV Media Playlist */}
            <section className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-8">
              <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Monitor className="h-7 w-7 text-emerald-400 shrink-0" />
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">4. TV Media Playlist</h2>
                    <p className="text-xs text-slate-400 font-semibold">Tentukan fail media mengikut Negeri yang terpilih</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <select
                    className="border border-slate-800 p-2.5 rounded-xl text-sm bg-slate-955 font-bold text-indigo-400 focus:outline-none"
                    value={activeMediaState}
                    onChange={(e) => setActiveMediaState(e.target.value)}
                  >
                    <option value="">Global (Default)</option>
                    {Object.keys(hierarchy).map(s => <option key={s} value={s}>Negeri: {s}</option>)}
                  </select>

                  <select
                    value={newMediaType}
                    onChange={(e) => setNewMediaType(e.target.value)}
                    className="border border-slate-800 p-2.5 rounded-xl text-sm bg-slate-955 font-bold text-white"
                  >
                    <option value="image">Gambar</option>
                    <option value="video">Video</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Direct URL (.jpg, .mp4)"
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    className="border border-slate-800 p-2.5 rounded-xl text-sm w-48 sm:w-64 focus:ring-2 focus:ring-emerald-500 outline-none text-white bg-slate-955"
                  />
                  <button onClick={addMedia} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors">Tambah</button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-slate-955 border border-slate-850 rounded-xl mb-4">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Sedang Memaparkan: {activeMediaState ? `Playlist Negeri ${activeMediaState}` : 'Playlist Global (Default)'}
                  </span>
                </div>

                {((activeMediaState ? (stateMedia[activeMediaState] || []) : mediaList)).map((media, idx) => (
                  <div key={idx} className="p-4 border border-slate-800 rounded-2xl flex justify-between items-center bg-slate-955 hover:bg-slate-850 transition-colors">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      {media.type === 'video' ? <Film className="h-5 w-5 text-indigo-400 shrink-0" /> : <ImageIcon className="h-5 w-5 text-emerald-400 shrink-0" />}
                      <span className="font-semibold text-slate-300 truncate text-sm">{media.url}</span>
                    </div>
                    <button onClick={() => removeMedia(idx)} className="text-slate-500 hover:text-rose-500 transition-colors ml-4 shrink-0">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                {((activeMediaState ? (stateMedia[activeMediaState] || []) : mediaList)).length === 0 && (
                  <div className="p-8 text-center text-slate-500 font-medium border border-dashed border-slate-800 rounded-2xl">
                    Tiada media dikonfigurasikan untuk playlist ini.
                  </div>
                )}
              </div>
            </section>

            {/* 5. TV Bypass Link Generator */}
            <section className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-8 space-y-6">
              <div className="flex items-center">
                <LinkIcon className="h-7 w-7 text-blue-400 mr-2" />
                <h2 className="text-2xl font-bold tracking-tight">5. Jana Pautan Pintas TV (Bypass Google Auth)</h2>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Gunakan pembina pautan ini untuk menjana URL khas bagi TV anda. Pautan ini membolehkan TV anda memaparkan skrin panggilan secara langsung **tanpa perlu log masuk dengan Google**.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Negeri</label>
                  <select
                    className="w-full p-3.5 border border-slate-800 rounded-xl bg-slate-955 font-bold text-white"
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
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Daerah</label>
                  <select
                    disabled={!genState}
                    className="w-full p-3.5 border border-slate-800 rounded-xl bg-slate-955 font-bold text-white disabled:opacity-40"
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
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Klinik Kesihatan</label>
                  <select
                    disabled={!genDistrict}
                    className="w-full p-3.5 border border-slate-800 rounded-xl bg-slate-955 font-bold text-white disabled:opacity-40"
                    value={genClinic}
                    onChange={(e) => setGenClinic(e.target.value)}
                  >
                    <option value="">Pilih...</option>
                    {(genState && genDistrict ? (hierarchy[genState][genDistrict] || []) : []).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Jabatan / Zon</label>
                  <select
                    disabled={!genClinic}
                    className="w-full p-3.5 border border-slate-800 rounded-xl bg-slate-955 font-bold text-white disabled:opacity-40"
                    value={genDept}
                    onChange={(e) => setGenDept(e.target.value)}
                  >
                    <option value="">Pilih...</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {genState && genDistrict && genClinic && genDept && (
                <div className="p-4 bg-slate-955 border border-slate-850 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="overflow-hidden w-full">
                    <p className="text-xs font-bold text-slate-500 uppercase">Pautan Dijana:</p>
                    <p className="text-xs text-indigo-400 font-mono truncate select-all mt-1 bg-slate-900 p-3 border border-slate-800 rounded-xl shadow-inner">{generateBypassLink()}</p>
                  </div>
                  <button
                    onClick={copyBypassLinkToClipboard}
                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-6 rounded-2xl shrink-0 flex items-center justify-center space-x-2 transition-all shadow-lg active:scale-95"
                  >
                    {copiedLink ? (
                      <>
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
                        <span>Berjaya Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4.5 w-4.5" />
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
          stateMedia={stateMedia || {}}
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