import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Smartphone, Copy, Check, ExternalLink } from 'lucide-react';

interface QRCodeCardProps {
  roomId: string;
  remoteUrl: string;
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({ roomId, remoteUrl }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!remoteUrl) return;

    QRCode.toDataURL(remoteUrl, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#030712', // deep slate black
        light: '#ffffff', // crisp white background for fast camera auto-focus
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed generating QR code:', err));
  }, [remoteUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(remoteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0e142a] border border-[#1b2548] rounded-2xl p-2.5 shadow-xl flex flex-col items-center text-center relative overflow-hidden shrink-0">
      {/* Header Badge */}
      <div className="flex items-center gap-1.5 mb-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="text-[9px] uppercase font-arcade tracking-widest text-slate-400 font-bold">
          GUEST REMOTE ACCESS
        </span>
      </div>

      <h4 className="text-xs font-black font-heading text-white tracking-wide mb-0.5">
        SCAN TO QUEUE SONGS
      </h4>
      <p className="text-[10px] text-slate-400 max-w-[210px] leading-tight mb-1">
        Open phone camera to add any YouTube karaoke track!
      </p>

      {/* Works on all phone browsers placed at the top */}
      <div className="flex items-center justify-center gap-1 text-[10px] text-sky-400 font-medium mb-2.5">
        <Smartphone className="w-3 h-3 text-sky-400 shrink-0" />
        <span>Works on all phone browsers</span>
      </div>

      {/* High-Contrast QR Code Container */}
      <div className="p-2 bg-white rounded-xl shadow-md border-2 border-slate-700 mb-2 group hover:scale-[1.02] transition-transform">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`QR Code to join room ${roomId}`}
            className="w-28 h-28 sm:w-32 sm:h-32 object-contain rounded"
          />
        ) : (
          <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center bg-slate-100 text-slate-500 text-xs">
            Generating QR...
          </div>
        )}
      </div>

      {/* Room Pin Badge */}
      <div className="w-full bg-[#131b38] border border-[#202d58] rounded-xl p-1.5 flex items-center justify-between">
        <div className="text-left pl-1">
          <div className="text-[8px] uppercase font-mono text-slate-400">Room Code</div>
          <div className="text-xs font-mono font-bold text-amber-400 tracking-wider">
            {roomId}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1 px-2 rounded-lg bg-[#182247] hover:bg-[#202d5c] text-slate-200 transition-colors text-[10px] flex items-center gap-1 border border-[#28386b]"
            title="Copy Remote Link"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <a
            href={remoteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-lg bg-[#182247] hover:bg-[#202d5c] text-slate-200 transition-colors border border-[#28386b]"
            title="Open Remote in new tab"
          >
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
};
