import React, { useState, useEffect, useCallback } from 'react';
import {
  Monitor,
  Smartphone,
  Settings,
  Users,
  Building2,
  LogOut,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Play,
  Volume2
} from 'lucide-react';

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

const DEPARTMENTS = ["OPD", "MCH", "Farmasi", "Makmal"];

// Generate some mock rooms and initial queue state
const generateInitialQueues = () => {
  const queues = {};
  DEFAULT_CLINICS.forEach(clinic => {
    queues[clinic] = {};
    DEPARTMENTS.forEach(dept => {
      queues[clinic][dept] = {
        "Bilik 1": "0000",
        "Bilik 2": "0000",
        "Bilik 3": "0000"
      };
    });
  });
  return queues;
};

// Mock Users for Admin Dashboard
const MOCK_USERS = [
  { id: 1, name: "Dr. Ahmad", role: "Input", status: "Approved", clinic: "Klinik Kesihatan Chini" },
  { id: 2, name: "Nurse Siti", role: "Input", status: "Pending", clinic: "Klinik Kesihatan Bandar Pekan" },
  { id: 3, name: "Admin TV", role: "Output", status: "Approved", clinic: "All" }
];

// Custom Modal to replace standard alert()/confirm()
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

export default function App() {
  const [currentView, setCurrentView] = useState('login'); // login, admin, input, output
  const [queues, setQueues] = useState(generateInitialQueues());
  const [clinics, setClinics] = useState(DEFAULT_CLINICS);
  const [users, setUsers] = useState(MOCK_USERS);

  // Selection state for Input/Output screens
  const [selectedClinic, setSelectedClinic] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Global modal state
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null, onCancel: null });

  const showModal = (title, message, type, onConfirm) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: () => {
        if (onConfirm) onConfirm();
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const updateQueueNumber = (clinic, dept, room, newNumber) => {
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
  };

  const renderLogin = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-200 mb-4">
            <ActivityIcon className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">PKD Pekan QMS</h2>
          <p className="mt-2 text-sm text-slate-600">Select your portal to continue</p>
        </div>

        <div className="mt-8 space-y-4">
          <button
            onClick={() => setCurrentView('admin')}
            className="w-full flex items-center justify-between p-5 bg-white border-2 border-slate-100 rounded-2xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center">
              <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Settings className="h-6 w-6" />
              </div>
              <div className="ml-4 text-left">
                <p className="text-lg font-bold text-slate-900">Superadmin</p>
                <p className="text-sm text-slate-500">System management & users</p>
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
                <p className="text-sm text-slate-500">Public queue display screen</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderAdmin = () => (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Superadmin Dashboard</h1>
          <p className="text-sm text-slate-500">System Configuration</p>
        </div>
        <button onClick={() => setCurrentView('login')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-8">
        {/* User Management */}
        <section className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center mb-6">
            <Users className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-bold">User Management (Mock)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-sm text-slate-500">
                  <th className="pb-3 font-semibold">Name</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Location</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-4 font-medium">{u.name}</td>
                    <td className="py-4 text-sm">{u.role}</td>
                    <td className="py-4 text-sm">{u.clinic}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${u.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-4 text-right space-x-2">
                      {u.status === 'Pending' && (
                        <button className="text-blue-600 hover:text-blue-800 p-1">Approve</button>
                      )}
                      <button className="text-red-600 hover:text-red-800 p-1">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Facilities Management */}
        <section className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center mb-6">
            <Building2 className="h-6 w-6 text-purple-600 mr-2" />
            <h2 className="text-lg font-bold">Facilities Database</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clinics.map((clinic, idx) => (
              <div key={idx} className="p-4 border rounded-xl flex justify-between items-center">
                <span className="font-medium text-slate-700">{clinic}</span>
                <button className="text-slate-400 hover:text-red-500">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-semibold hover:border-blue-500 hover:text-blue-600 transition-colors">
            + Add New Facility
          </button>
        </section>
      </main>
    </div>
  );

  const InputScreen = () => {
    const [step, setStep] = useState(1); // 1: Setup, 2: Numpad
    const [localRoom, setLocalRoom] = useState('Bilik 1');
    const [currentInput, setCurrentInput] = useState('');

    const handleCallNext = () => {
      if (!currentInput) {
        showModal('Error', 'Please enter a queue number.', 'info');
        return;
      }
      showModal(
        'Confirm Call',
        `Call number ${currentInput} to ${localRoom}?`,
        'confirm',
        () => {
          updateQueueNumber(selectedClinic, selectedDept, localRoom, currentInput);
          setCurrentInput(''); // reset after call
        }
      );
    };

    if (step === 1) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-sm border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Staff Setup</h2>
              <button onClick={() => setCurrentView('login')} className="text-slate-400 hover:text-slate-600">
                <LogOut className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Clinic</label>
                <select
                  className="w-full p-3 border rounded-xl bg-slate-50"
                  value={selectedClinic}
                  onChange={(e) => setSelectedClinic(e.target.value)}
                >
                  <option value="">Select Clinic...</option>
                  {clinics.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
                <select
                  className="w-full p-3 border rounded-xl bg-slate-50"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                >
                  <option value="">Select Department...</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Room</label>
                <select
                  className="w-full p-3 border rounded-xl bg-slate-50"
                  value={localRoom}
                  onChange={(e) => setLocalRoom(e.target.value)}
                >
                  <option value="Bilik 1">Bilik 1</option>
                  <option value="Bilik 2">Bilik 2</option>
                  <option value="Bilik 3">Bilik 3</option>
                </select>
              </div>

              <button
                disabled={!selectedClinic || !selectedDept}
                onClick={() => setStep(2)}
                className="w-full py-4 mt-6 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-blue-700 transition-colors"
              >
                Start Calling Session
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Numpad Screen
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col sm:justify-center p-4">
        <div className="w-full max-w-sm mx-auto flex flex-col h-full sm:h-auto sm:border sm:border-slate-700 sm:rounded-3xl sm:p-6 sm:bg-slate-800">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{selectedDept} • {localRoom}</p>
              <h1 className="text-lg font-bold leading-tight truncate w-48">{selectedClinic}</h1>
            </div>
            <button onClick={() => setStep(1)} className="p-2 bg-slate-700 rounded-full text-slate-300">
              <Settings className="h-5 w-5" />
            </button>
          </div>

          {/* Display */}
          <div className="bg-slate-950 rounded-2xl p-6 mb-8 flex justify-center items-center shadow-inner border border-slate-700 min-h-[120px]">
            <span className="text-6xl font-bold tracking-widest text-emerald-400">
              {currentInput || '----'}
            </span>
          </div>

          {/* Numpad */}
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

          {/* Action */}
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

  const OutputScreen = () => {
    const [setupDone, setSetupDone] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Gallery images rotating every 12 seconds
    const images = [
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200", // Hospital/Clinic abstract
      "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=1200", // Medical cross
      "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1200"  // Waiting area abstract
    ];

    useEffect(() => {
      if (!setupDone) return;
      const timer = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % images.length);
      }, 12000);
      return () => clearInterval(timer);
    }, [setupDone, images.length]);

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
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
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
                  onClick={() => setSetupDone(true)}
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

    const currentRoomsData = queues[selectedClinic]?.[selectedDept] || {};

    return (
      <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden font-sans">
        {/* Header */}
        <header className="bg-slate-900 border-b border-slate-800 px-8 py-6 flex justify-between items-center shadow-lg">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-blue-400 tracking-wide uppercase">
              Pejabat Kesihatan Daerah Pekan
            </h1>
            <h2 className="text-xl md:text-4xl font-bold text-white mt-2 uppercase">
              {selectedClinic} - {selectedDept}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-sm font-semibold tracking-widest uppercase mb-1">Queue Management System</p>
            <button
              onClick={() => { setSetupDone(false); setCurrentView('login'); }}
              className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-slate-300"
            >
              Exit TV Mode
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col md:flex-row">
          {/* Left: Media/Gallery */}
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
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* Optional text over image */}
            <div className="absolute bottom-10 left-10 z-10">
              <p className="text-white/80 text-2xl font-semibold bg-black/40 px-4 py-2 rounded-lg backdrop-blur-sm">
                Sila tunggu nombor anda dipanggil
              </p>
            </div>
          </div>

          {/* Right: Queue Table */}
          <div className="w-full md:w-[500px] lg:w-[600px] bg-slate-900 border-l border-slate-800 flex flex-col">
            <div className="grid grid-cols-2 bg-slate-800 py-6 px-8 border-b border-slate-700 shadow-md">
              <h3 className="text-3xl font-bold text-slate-300 uppercase">Bilik</h3>
              <h3 className="text-3xl font-bold text-slate-300 uppercase text-right">Nombor</h3>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {Object.entries(currentRoomsData).map(([room, number], index) => (
                <div
                  key={room}
                  className={`grid grid-cols-2 py-8 px-8 border-b border-slate-800 items-center ${index % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-800/20'
                    }`}
                >
                  <div className="text-4xl font-bold text-emerald-400">
                    {room}
                  </div>
                  <div className="text-6xl font-extrabold text-white text-right tracking-wider tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    {number}
                  </div>
                </div>
              ))}

              {/* Fill remaining space gracefully if few rooms */}
              <div className="flex-1 bg-slate-900/50"></div>
            </div>
          </div>
        </main>
      </div>
    );
  };

  return (
    <>
      {currentView === 'login' && renderLogin()}
      {currentView === 'admin' && renderAdmin()}
      {currentView === 'input' && <InputScreen />}
      {currentView === 'output' && <OutputScreen />}

      <Modal {...modalConfig} />
    </>
  );
}

function ActivityIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}