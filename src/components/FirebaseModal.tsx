import React, { useState, useEffect } from 'react';
import {
  getStoredFirebaseConfig,
  saveStoredFirebaseConfig,
  initializeFirebaseRealtime,
  FIREBASE_RTDB_RULES,
} from '../services/firebaseRealtime';
import { FirebaseConnectionConfig } from '../types/karaoke';
import { X, Database, Check, Copy, Flame, ExternalLink, ShieldCheck, Zap } from 'lucide-react';

interface FirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const FirebaseModal: React.FC<FirebaseModalProps> = ({ isOpen, onClose, onConfigSaved }) => {
  const [config, setConfig] = useState<FirebaseConnectionConfig>({
    databaseURL: '',
    apiKey: '',
    projectId: '',
    authDomain: '',
    appId: '',
    enabled: false,
  });
  const [copiedRules, setCopiedRules] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setConfig(getStoredFirebaseConfig());
      setTestStatus('idle');
      setTestMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveStoredFirebaseConfig(config);
    onConfigSaved();
    onClose();
  };

  const handleTestConnection = async () => {
    if (!config.databaseURL) {
      setTestStatus('error');
      setTestMessage('Please enter your Firebase Realtime Database URL first.');
      return;
    }

    setTestStatus('testing');
    try {
      const db = initializeFirebaseRealtime({ ...config, enabled: true });
      if (db) {
        setTestStatus('success');
        setTestMessage('Firebase Realtime Database initialized successfully!');
      } else {
        setTestStatus('error');
        setTestMessage('Could not initialize Firebase. Check your database URL format.');
      }
    } catch (err) {
      setTestStatus('error');
      setTestMessage(`Connection error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const copyRules = () => {
    navigator.clipboard.writeText(FIREBASE_RTDB_RULES);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5 fill-amber-400/20" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-white">
                Firebase Realtime Database Setup
              </h3>
              <p className="text-xs text-slate-400">
                Connect your cloud database for cross-device queue synchronization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Quick Notice about Built-in Live Sync */}
          <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-3">
            <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-cyan-200">
              <strong className="text-white font-semibold">Zero-Config Mode is Active:</strong>{' '}
              The app currently syncs multi-device queues in real-time via the integrated SSE party server.
              Connecting Firebase Realtime Database is optional and gives you full cloud persistence & admin control in your own Google Cloud console!
            </div>
          </div>

          {/* Setup Guide Steps */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
              Step-by-Step Firebase Instructions:
            </h4>
            <ol className="space-y-2 list-decimal list-inside text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800">
              <li>
                Open the{' '}
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 underline inline-flex items-center gap-1 font-semibold"
                >
                  Firebase Console <ExternalLink className="w-3 h-3 inline" />
                </a>{' '}
                and create a project.
              </li>
              <li>
                Click on <strong className="text-white">Build &gt; Realtime Database</strong> in the left sidebar.
              </li>
              <li>
                Click <strong className="text-white">Create Database</strong>, select a region, and choose <strong className="text-white">Test mode</strong> (or paste the rules below).
              </li>
              <li>
                Copy your <strong className="text-white">Database URL</strong> (typically ends in <code className="text-amber-300">.firebasedatabase.app</code> or <code className="text-amber-300">.firebaseio.com</code>).
              </li>
              <li>Paste the URL below and toggle <strong className="text-white">&quot;Enable Firebase RTDB&quot;</strong>.</li>
            </ol>
          </div>

          {/* Database URL Form */}
          <div className="space-y-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                <span>Firebase Database URL (Required)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <span className={config.enabled ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                  Enable Firebase RTDB
                </span>
              </label>
            </div>

            <input
              type="text"
              placeholder="https://your-karaoke-app-default-rtdb.firebaseio.com"
              value={config.databaseURL}
              onChange={(e) => setConfig({ ...config, databaseURL: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-amber-400"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">API Key (Optional)</label>
                <input
                  type="text"
                  placeholder="AIzaSy..."
                  value={config.apiKey || ''}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Project ID (Optional)</label>
                <input
                  type="text"
                  placeholder="karaoke-party-123"
                  value={config.projectId || ''}
                  onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {testStatus !== 'idle' && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  testStatus === 'success'
                    ? 'bg-emerald-950/60 border border-emerald-500 text-emerald-200'
                    : testStatus === 'error'
                    ? 'bg-rose-950/60 border border-rose-500 text-rose-200'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {testStatus === 'success' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                <span>{testMessage}</span>
              </div>
            )}

            <button
              onClick={handleTestConnection}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Test Connection
            </button>
          </div>

          {/* Recommended Realtime Database Rules */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Firebase Realtime Database Security Rules
              </span>
              <button
                onClick={copyRules}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRules ? 'Copied Rules' : 'Copy Rules'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-amber-200/90 overflow-x-auto">
              {FIREBASE_RTDB_RULES}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white shadow-lg transition-transform active:scale-95 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Save &amp; Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
};
