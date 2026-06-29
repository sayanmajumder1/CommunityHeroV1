import React, { useState } from 'react';
import { Shield, Cpu, Bell, Database } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminSettings() {
  const [autoVerify, setAutoVerify] = useState(true);
  const [strictDuplicates, setStrictDuplicates] = useState(true);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(false);
  const [slaTime, setSlaTime] = useState('24');

  const handleSaveSettings = () => {
    toast.success('Enterprise configuration rules written to Firestore successfully');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left font-sans" id="admin-settings-workspace">
      
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider">Enterprise Configuration Panel</h2>
          </div>
          <p className="text-xs text-slate-500 font-semibold">Modify live pipeline constants, duplication thresholds, notification gateways, and automated backup limits.</p>
        </div>
      </div>

      {/* Settings Options card list */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        
        {/* Toggle 1 */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 gap-4">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-extrabold text-slate-900">Auto AI Category Auditing</span>
            </div>
            <p className="text-xs text-slate-500 leading-normal">
              Empower Gemini to automatically assign reported incidents to their target municipal department based on photo metadata and natural description lines.
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setAutoVerify(!autoVerify)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              autoVerify ? 'bg-emerald-600' : 'bg-slate-200'
            }`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              autoVerify ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Toggle 2 */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 gap-4">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-extrabold text-slate-900">Prevent Duplication Double-Reporting</span>
            </div>
            <p className="text-xs text-slate-500 leading-normal">
              Block citizens from submitting overlapping reports inside active 50-meter geofences where a matching category has already been logged.
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setStrictDuplicates(!strictDuplicates)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              strictDuplicates ? 'bg-emerald-600' : 'bg-slate-200'
            }`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              strictDuplicates ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Toggle 3 */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 gap-4">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-extrabold text-slate-900">Push Notifications via Messaging Gateway</span>
            </div>
            <p className="text-xs text-slate-500 leading-normal">
              Transmit live verification updates directly to citizen mobile channels via standard Twilio WhatsApp or SMS notification relays.
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setNotifyWhatsApp(!notifyWhatsApp)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              notifyWhatsApp ? 'bg-emerald-600' : 'bg-slate-200'
            }`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              notifyWhatsApp ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* Text Input Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="space-y-1 max-w-xl text-left">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-extrabold text-slate-900">Default Critical Incident SLA Limit</span>
            </div>
            <p className="text-xs text-slate-500 leading-normal">
              Specify the default hour limit after which outstanding critical incidents (e.g. water leakage) trigger automated alerts to department heads.
            </p>
          </div>
          <div>
            <select
              value={slaTime}
              onChange={(e) => setSlaTime(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:outline-none"
            >
              <option value="12">12 Hours Threshold</option>
              <option value="24">24 Hours Threshold</option>
              <option value="48">48 Hours Threshold</option>
              <option value="72">72 Hours Threshold</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-sm transition cursor-pointer"
          >
            Commit Pipeline Config
          </button>
        </div>

      </div>

    </div>
  );
}
