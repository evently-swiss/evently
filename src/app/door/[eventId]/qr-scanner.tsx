'use client';

import { useEffect, useRef, useState } from 'react';
import { checkInByToken } from './actions';

type QrScannerProps = {
  eventId: string;
};

export default function QrScanner({ eventId }: QrScannerProps) {
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: 'Point the camera at a guest QR code.',
  });
  const [isStarting, setIsStarting] = useState(true);
  const scannerRef = useRef<any>(null);
  const isHandlingScanRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');

        if (cancelled) return;

        const scanner = new Html5Qrcode('door-qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 280, height: 280 },
          },
          async (decodedText: string) => {
            if (isHandlingScanRef.current) {
              return;
            }

            isHandlingScanRef.current = true;
            const result = await checkInByToken(decodedText, eventId);

            if (result?.success) {
              setStatus({
                type: 'success',
                message: result.message || 'Guest checked in successfully.',
              });
            } else {
              setStatus({
                type: 'error',
                message: result?.message || 'Failed to check in guest.',
              });
            }

            window.setTimeout(() => {
              isHandlingScanRef.current = false;
            }, 1200);
          },
          () => {
            // Ignore per-frame decode errors while camera is active.
          }
        );

        if (!cancelled) {
          setIsStarting(false);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setStatus({
            type: 'error',
            message: 'Unable to access camera. Check browser camera permissions.',
          });
          setIsStarting(false);
        }
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {
            // Best effort camera cleanup.
          });
      }
    };
  }, [eventId]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-3">
        <div id="door-qr-reader" className="min-h-[320px] w-full overflow-hidden rounded-xl bg-black" />
      </div>

      <p
        className={`rounded-xl px-4 py-3 text-sm ${
          status.type === 'success'
            ? 'bg-green-900/30 text-green-300 border border-green-900/50'
            : status.type === 'error'
              ? 'bg-red-900/30 text-red-300 border border-red-900/50'
              : 'bg-gray-900 text-gray-300 border border-gray-800'
        }`}
      >
        {isStarting ? 'Starting camera...' : status.message}
      </p>
    </div>
  );
}
