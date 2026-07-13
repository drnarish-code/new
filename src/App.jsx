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
  Volume2
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

const DEFAULT_CLINICS = [
  "Klinik Kesihatan Padang Rumbia",
  "Klinik Kesihatan Bandar Pekan",
  "Klinik Kesihatan Temai",
  "Klinik Kesihatan Peramu Jaya",
  "Klinik Kesihatan Nenasi",
  "Klinik Kesihatan Runchang",
  "Klinik Kesihatan Chini",
  "Klinik Komuniti Kuala Pahang"
];

const DEFAULT_DEPARTMENTS = ["OPD", "MCH", "Farmasi", "Makmal"];

const generateInitialQueues = (clinicsList = DEFAULT_CLINICS, deptsList = DEFAULT_DEPARTMENTS) => {
  const queues = {};
  clinicsList.forEach(clinic => {
    queues[clinic] = {};
    deptsList.forEach(dept => {
      queues[clinic][dept] = {};
      for (let i = 1; i <= 20; i++) {
        queues[clinic][dept][`Bilik ${i}`] = "0000";
      }
    });
  });
  return queues;
};

const Modal = ({ isOpen, title, message, onConfirm, onCancel, type = 'confirm' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in duration-200">
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600 mb-6">{message}</p>
        <div className="flex space-x-3">
          {type === 'confirm' && (
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
          >
            {type === 'confirm' ? 'Confirm' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};

function ActivityIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

const InputScreen = ({ clinics, departments, selectedClinic, setSelectedClinic, selectedDept, setSelectedDept, setCurrentView, showModal, updateQueueNumber, dbStatus }) => {
  const [step, setStep] = useState(1);
  const [localRoom, setLocalRoom] = useState('Bilik 1');
  const [currentInput, setCurrentInput] = useState('');

  const handleCallNext = () => {
    if (!currentInput) {
      showModal('Error', 'Sila masukkan nombor giliran.', 'info');
      return;
    }
    showModal(
      'Confirm Call',
      `Panggil nombor ${currentInput} ke ${localRoom}?`,
      'confirm',
      () => {
        updateQueueNumber(selectedClinic, selectedDept, localRoom, currentInput);
        setCurrentInput('');
      }
    );
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Staff Setup</h2>
            <button onClick={() => setCurrentView('login')} className="text-slate-400 hover:text-slate-600" title="Back to Portal">
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Klinik</label>
              <select
                className="w-full p-3 border rounded-xl bg-slate-50"
                value={selectedClinic}
                onChange={(e) => setSelectedClinic(e.target.value)}
              >
                <option value="">Pilih Klinik...</option>
                {clinics.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Jabatan / Zon</label>
              <select
                className="w-full p-3 border rounded-xl bg-slate-50"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="">Pilih Jabatan...</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Bilik</label>
              <select
                className="w-full p-3 border rounded-xl bg-slate-50"
                value={localRoom}
                onChange={(e) => setLocalRoom(e.target.value)}
              >
                {Array.from({ length: 20 }, (_, i) => (
                  <option key={i} value={`Bilik ${i + 1}`}>Bilik {i + 1}</option>
                ))}
              </select>
            </div>

            <button
              disabled={!selectedClinic || !selectedDept}
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

        <button
          onClick={handleCallNext}
          className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-900/50"
        >
          <Volume2 className="h-6 w-6" />
          <span>Call Number</span>
        </button>
      </div>
    </div>
  );
};

const OutputScreen = ({ clinics, departments, selectedClinic, setSelectedClinic, selectedDept, setSelectedDept, setCurrentView, queues, dbStatus }) => {
  const [setupDone, setSetupDone] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [previousQueues, setPreviousQueues] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);

  const audioCtxRef = useRef(null);
  const [highlightedRoom, setHighlightedRoom] = useState(null);

  const images = [
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1200"
  ];

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
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    await playChime();

    const digitString = number.toString().split('').join(' ');
    const textToSpeak = `Nombor ${digitString}, sila ke ${room}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'ms-MY';

    const voices = window.speechSynthesis.getVoices();
    const malayVoice = voices.find(v => v.lang.startsWith('ms') || v.lang.startsWith('id'));
    if (malayVoice) {
      utterance.voice = malayVoice;
    }

    utterance.rate = 0.85;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  useEffect(() => {
    if (!setupDone || !selectedClinic || !selectedDept) return;

    const currentData = queues[selectedClinic]?.[selectedDept];
    if (!currentData) return;

    if (!previousQueues) {
      setPreviousQueues(currentData);

      const initial = Object.entries(currentData)
        .filter(([_, num]) => num !== "0000" && num !== "----")
        .map(([room, number]) => ({ room, number }))
        .slice(0, 4);
      setRecentCalls(initial);
      return;
    }

    let roomChanged = null;
    let newNumber = null;

    for (const [room, number] of Object.entries(currentData)) {
      if (previousQueues[room] !== number) {
        roomChanged = room;
        newNumber = number;
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

    setPreviousQueues(currentData);

  }, [queues, setupDone, selectedClinic, selectedDept, previousQueues]);

  useEffect(() => {
    if (!setupDone) return;
    const timer = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % images.length);
    }, 12000);
    return () => clearInterval(timer);
  }, [setupDone, images.length]);

  const handleStartTV = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext && !audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    setSetupDone(true);
  };

  if (!setupDone) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 text-white">
          <h2 className="text-2xl font-bold mb-6 text-center">Configure TV Display</h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">Select Clinic Location</label>
              <select
                className="w-full p-4 border border-slate-600 rounded-xl bg-slate-900 text-white"
                value={selectedClinic}
                onChange={(e) => setSelectedClinic(e.target.value)}
              >
                <option value="">Choose...</option>
                {clinics.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">Select Department (Zone)</label>
              <select
                className="w-full p-4 border border-slate-600 rounded-xl bg-slate-900 text-white"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="">Choose...</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="pt-4 flex space-x-3">
              <button
                onClick={() => setCurrentView('login')}
                className="flex-1 py-4 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600"
              >
                Back
              </button>
              <button
                disabled={!selectedClinic || !selectedDept}
                onClick={handleStartTV}
                className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-emerald-500 flex items-center justify-center"
              >
                <Play className="h-5 w-5 mr-2" /> Start TV
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden font-sans">
      <header className="bg-slate-900 border-b border-slate-800 px-8 py-6 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-blue-400 tracking-wide uppercase">
            Pejabat Kesihatan Daerah Pekan
          </h1>
          <h2 className="text-xl md:text-4xl font-bold text-white mt-2 uppercase">
            {selectedClinic} - {selectedDept}
          </h2>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="flex items-center space-x-2 mb-1">
            <div className={`h-2 w-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500' : dbStatus === 'error' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
            <p className="text-slate-400 text-sm font-semibold tracking-widest uppercase">Queue Management System</p>
          </div>
          <button
            onClick={() => { setSetupDone(false); setCurrentView('login'); }}
            className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-slate-300"
          >
            Exit TV Mode
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row">
        <div className="flex-1 relative bg-slate-950 flex items-center justify-center p-8 overflow-hidden">
          {images.map((img, index) => (
            <img
              key={img}
              src={img}
              alt="Gallery"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
          <div className="absolute bottom-10 left-10 z-10">
            <p className="text-white/80 text-2xl font-semibold bg-black/40 px-4 py-2 rounded-lg backdrop-blur-sm">
              Sila tunggu nombor anda dipanggil
            </p>
          </div>
        </div>

        <div className="w-full md:w-[500px] lg:w-[600px] bg-slate-900 border-l border-slate-800 flex flex-col">
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
  const [clinics, setClinics] = useState(DEFAULT_CLINICS);
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [queues, setQueues] = useState(generateInitialQueues(clinics, departments));

  const [newClinicName, setNewClinicName] = useState('');
  const [newDeptName, setNewDeptName] = useState('');

  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [selectedClinic, setSelectedClinic] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null, onCancel: null });
  const [dbStatus, setDbStatus] = useState('connecting');

  const getDocRef = () => doc(db, 'qms', 'state');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const qmsDocRef = getDocRef();
    const configRef = doc(db, 'qms', 'config');

    const unsubConfig = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.clinics) setClinics(data.clinics);
        if (data.departments) setDepartments(data.departments);
      } else {
        setDoc(configRef, { clinics: DEFAULT_CLINICS, departments: DEFAULT_DEPARTMENTS }, { merge: true });
      }
    });

    const unsubQueues = onSnapshot(
      qmsDocRef,
      (docSnap) => {
        setDbStatus('connected');
        if (docSnap.exists()) {
          setQueues(prev => ({ ...generateInitialQueues(clinics, departments), ...docSnap.data() }));
        } else {
          setDoc(qmsDocRef, generateInitialQueues(clinics, departments)).catch(err => {
            console.error("Init error:", err);
            setDbStatus('error');
          });
        }
      },
      (error) => {
        console.error("Sync error:", error);
        setDbStatus('error');
      }
    );

    return () => {
      unsubConfig();
      unsubQueues();
    };
  }, [user, clinics, departments]);

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
      showModal("Login Failed", "Unable to sign in with Google. " + error.message, "info");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentView('login');
      setSelectedClinic('');
      setSelectedDept('');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const updateQueueNumber = async (clinic, dept, room, newNumber) => {
    if (!user) {
      showModal("Error", "Sila log masuk dahulu.", "info");
      return;
    }

    setQueues(prev => ({
      ...prev,
      [clinic]: {
        ...prev[clinic],
        [dept]: {
          ...prev[clinic][dept],
          [room]: newNumber
        }
      }
    }));

    try {
      await setDoc(
        getDocRef(),
        { [clinic]: { [dept]: { [room]: newNumber } } },
        { merge: true }
      );
    } catch (err) {
      console.error("Failed to update database:", err);
      showModal("Database Error", "Check Firebase Rules! Error: " + err.message, "info");
    }
  };

  const addFacility = async () => {
    if (!newClinicName.trim()) return;
    const updatedClinics = [...clinics, newClinicName.trim()];
    setClinics(updatedClinics);
    setNewClinicName('');
    await setDoc(doc(db, 'qms', 'config'), { clinics: updatedClinics }, { merge: true });
  };

  const removeFacility = async (clinicToRemove) => {
    showModal('Padam Klinik', `Adakah anda pasti mahu memadam ${clinicToRemove}?`, 'confirm', async () => {
      const updatedClinics = clinics.filter(c => c !== clinicToRemove);
      setClinics(updatedClinics);
      await setDoc(doc(db, 'qms', 'config'), { clinics: updatedClinics }, { merge: true });
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
    showModal('Padam Jabatan', `Adakah anda pasti mahu memadam ${deptToRemove}?`, 'confirm', async () => {
      const updatedDepts = departments.filter(d => d !== deptToRemove);
      setDepartments(updatedDepts);
      await setDoc(doc(db, 'qms', 'config'), { departments: updatedDepts }, { merge: true });
    });
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center">
          <div className="mx-auto h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-200 mb-6">
            <ActivityIcon className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">PKD Pekan QMS</h2>
          <p className="mt-2 text-sm text-slate-500 mb-8">Sistem Pengurusan Giliran Pejabat Kesihatan Daerah Pekan</p>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center space-x-3 py-4 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-400 transition-all shadow-sm"
          >
            <svg className="w-6 h-6" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            <span className="text-slate-700 font-semibold text-lg">Sign in with Google</span>
          </button>
        </div>
        <Modal {...modalConfig} />
      </div>
    );
  }

  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="mx-auto h-16 w-16 mb-4">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="h-full w-full rounded-full shadow-md" />
              ) : (
                <div className="h-full w-full bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                  <Users className="h-8 w-8 text-white" />
                </div>
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Hi, {user.displayName || 'Staff'}</h2>
            <p className="text-sm text-slate-500 mb-6">{user.email}</p>
            <button
              onClick={handleLogout}
              className="text-sm px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors font-medium"
            >
              Log Out
            </button>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => {
                if (user?.email === 'dr.narish@gmail.com') {
                  setCurrentView('admin');
                } else {
                  showModal('Akses Ditolak', 'Hanya Superadmin (dr.narish@gmail.com) dibenarkan untuk mengakses portal ini.', 'info');
                }
              }}
              className="w-full flex items-center justify-between p-5 bg-white border-2 border-slate-100 rounded-2xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center">
                <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Settings className="h-6 w-6" />
                </div>
                <div className="ml-4 text-left">
                  <p className="text-lg font-bold text-slate-900">Superadmin</p>
                  <p className="text-sm text-slate-500">System management</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500" />
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
                  <p className="text-lg font-bold text-slate-900">Staff Input</p>
                  <p className="text-sm text-slate-500">Call queue numbers</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500" />
            </button>

            <button
              onClick={() => setCurrentView('output')}
              className="w-full flex items-center justify-between p-5 bg-white border-2 border-slate-100 rounded-2xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center">
                <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Monitor className="h-6 w-6" />
                </div>
                <div className="ml-4 text-left">
                  <p className="text-lg font-bold text-slate-900">TV Display</p>
                  <p className="text-sm text-slate-500">Public waiting screen</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentView === 'admin' && (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Superadmin Dashboard</h1>
              <p className="text-sm text-slate-500">System Configuration</p>
            </div>
            <button onClick={() => setCurrentView('login')} className="px-4 py-2 text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg">
              Back to Portal
            </button>
          </header>

          <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-8">
            <section className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Building2 className="h-6 w-6 text-purple-600 mr-2" />
                  <h2 className="text-lg font-bold">Senarai Klinik (Facilities)</h2>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Klinik Baru..."
                    value={newClinicName}
                    onChange={(e) => setNewClinicName(e.target.value)}
                    className="border p-2 rounded-lg text-sm w-40 md:w-56 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  <button onClick={addFacility} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">Add</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clinics.map((clinic, idx) => (
                  <div key={idx} className="p-4 border rounded-xl flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors">
                    <span className="font-medium text-slate-700">{clinic}</span>
                    <button onClick={() => removeFacility(clinic)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Settings className="h-6 w-6 text-orange-600 mr-2" />
                  <h2 className="text-lg font-bold">Jabatan / Zon (Departments)</h2>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Jabatan Baru..."
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    className="border p-2 rounded-lg text-sm w-40 md:w-56 focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                  <button onClick={addDepartment} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">Add</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {departments.map((dept, idx) => (
                  <div key={idx} className="px-4 py-2 border rounded-full flex items-center bg-slate-50 shadow-sm space-x-3">
                    <span className="font-medium text-slate-700">{dept}</span>
                    <button onClick={() => removeDepartment(dept)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </main>
        </div>
      )}

      {currentView === 'input' && (
        <InputScreen
          clinics={clinics || []}
          departments={departments || []}
          selectedClinic={selectedClinic} setSelectedClinic={setSelectedClinic}
          selectedDept={selectedDept} setSelectedDept={setSelectedDept}
          setCurrentView={setCurrentView}
          showModal={showModal}
          updateQueueNumber={updateQueueNumber}
          dbStatus={dbStatus}
        />
      )}

      {currentView === 'output' && (
        <OutputScreen
          clinics={clinics || []}
          departments={departments || []}
          selectedClinic={selectedClinic} setSelectedClinic={setSelectedClinic}
          selectedDept={selectedDept} setSelectedDept={setSelectedDept}
          setCurrentView={setCurrentView}
          queues={queues}
          dbStatus={dbStatus}
        />
      )}

      <Modal {...modalConfig} />
    </>
  );
}