"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, X, QrCode } from "lucide-react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: string;
  qrToken: string;
  baseUrl?: string;
}

export function QRCodeModal({ isOpen, onClose, tableNumber, qrToken }: QRCodeModalProps) {
  const [qrSrc, setQrSrc] = useState<string>("");

  useEffect(() => {
    if (isOpen && qrToken) {
      const url = `${window.location.origin}/menu/${encodeURIComponent(tableNumber)}?qr=${encodeURIComponent(qrToken)}`;
      QRCode.toDataURL(url, { width: 300, margin: 2 })
        .then(setQrSrc)
        .catch(console.error);
    }
  }, [isOpen, tableNumber, qrToken]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!qrSrc) return;
    const a = document.createElement("a");
    a.href = qrSrc;
    a.download = `QRCode-Table-${tableNumber}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-5 text-center relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="w-12 h-12 rounded-2xl bg-electric-50 text-electric-600 flex items-center justify-center mx-auto mb-2">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-navy-900">QR Code ประจำโต๊ะ {tableNumber}</h3>
          <p className="text-xs text-slate-500">สแกนเพื่อเปิดเมนูสั่งอาหารออนไลน์ (Customer QR Ordering)</p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 inline-block shadow-inner">
          {qrSrc ? (
            <img src={qrSrc} alt={`QR Code โต๊ะ ${tableNumber}`} className="w-48 h-48 mx-auto rounded-lg" />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">กำลังสร้าง QR...</div>
          )}
        </div>

        <div className="flex space-x-3 pt-2">
          <button
            onClick={handleDownload}
            className="flex-1 py-3 bg-electric-600 hover:bg-electric-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-electric-600/20 transition"
          >
            <Download className="w-4 h-4" />
            <span>ดาวน์โหลด QR Code</span>
          </button>
        </div>
      </div>
    </div>
  );
}
