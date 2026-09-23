import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, Trash2, SwitchCamera, Zap, ZapOff, Image as ImageIcon, Plus } from 'lucide-react';
import { compressImage } from '../services/imageCompressor';
import { AppraisalPhoto, CompressionSettings } from '../types';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinishAppraisal: (capturedPhotos: AppraisalPhoto[]) => void;
  existingPlate?: string;
  compressionSettings: CompressionSettings;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onFinishAppraisal,
  existingPlate,
  compressionSettings
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<AppraisalPhoto[]>([]);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<AppraisalPhoto | null>(null);
  const [isProcessingShot, setIsProcessingShot] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailsEndRef = useRef<HTMLDivElement>(null);

  // Initialize camera stream
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPhotos([]);
      setPreviewPhoto(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  // Scroll thumbnails to end when new photo is taken
  useEffect(() => {
    if (thumbnailsEndRef.current) {
      thumbnailsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [capturedPhotos.length]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La API de cámara no está disponible en este navegador');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Check torch capability
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as any;
      if (capabilities && capabilities.torch) {
        setHasTorch(true);
      } else {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.warn('Error al iniciar cámara WebRTC:', err);
      setCameraError(
        'No se pudo acceder a la cámara en directo. Puedes utilizar el botón de archivo para capturar fotos con la app nativa de tu teléfono.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const toggleTorch = async () => {
    if (!stream || !hasTorch) return;
    const track = stream.getVideoTracks()[0];
    try {
      const nextState = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }]
      });
      setTorchOn(nextState);
    } catch (err) {
      console.warn('Error al activar linterna/flash:', err);
    }
  };

  const switchCameraFacing = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture photo instantaneously from video stream
  const captureFrame = async () => {
    if (!videoRef.current || isProcessingShot) return;
    setIsProcessingShot(true);

    // Haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(40);
    }

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setIsProcessingShot(false);
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob & compress immediately
      canvas.toBlob(async (rawBlob) => {
        if (!rawBlob) {
          setIsProcessingShot(false);
          return;
        }

        const compressed = await compressImage(rawBlob, compressionSettings);
        const index = capturedPhotos.length + 1;
        const filename = `foto_${String(index).padStart(3, '0')}.jpg`;

        const newPhoto: AppraisalPhoto = {
          id: `photo_${Date.now()}_${index}`,
          filename,
          dataUrl: compressed.dataUrl,
          sizeBytes: compressed.sizeBytes,
          originalSizeBytes: compressed.originalSizeBytes,
          width: compressed.width,
          height: compressed.height,
          createdAt: new Date().toISOString()
        };

        setCapturedPhotos(prev => [...prev, newPhoto]);
        setIsProcessingShot(false);
      }, 'image/jpeg', 0.95);
    } catch (err) {
      console.error('Error al capturar fotograma:', err);
      setIsProcessingShot(false);
    }
  };

  // Fallback file input handler (for devices that block WebRTC stream)
  const handleFallbackFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const compressed = await compressImage(file, compressionSettings);
        const index = capturedPhotos.length + 1;
        const filename = `foto_${String(index).padStart(3, '0')}.jpg`;

        const newPhoto: AppraisalPhoto = {
          id: `photo_${Date.now()}_${index}_${i}`,
          filename,
          dataUrl: compressed.dataUrl,
          sizeBytes: compressed.sizeBytes,
          originalSizeBytes: compressed.originalSizeBytes,
          width: compressed.width,
          height: compressed.height,
          createdAt: new Date().toISOString()
        };

        setCapturedPhotos(prev => [...prev, newPhoto]);
      } catch (err) {
        console.error('Error al comprimir archivo fallback:', err);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove a photo before finishing
  const handleDeletePhoto = (photoId: string) => {
    setCapturedPhotos(prev => prev.filter(p => p.id !== photoId));
    if (previewPhoto && previewPhoto.id === photoId) {
      setPreviewPhoto(null);
    }
  };

  // Finish appraisal and proceed to OCR plate detection
  const handleFinish = () => {
    if (capturedPhotos.length === 0) {
      alert('Debes realizar al menos una fotografía para el peritaje.');
      return;
    }
    stopCamera();
    onFinishAppraisal(capturedPhotos);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col select-none overflow-hidden">
      {/* Top Header Bar */}
      <div className="h-16 px-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-white z-20">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors"
          title="Cancelar y salir de cámara"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Counter Badge */}
        <div className="flex flex-col items-center">
          <div className="px-3.5 py-1 rounded-full bg-menorca-600/90 text-white font-bold text-sm tracking-wide shadow-lg border border-white/20 flex items-center gap-1.5 backdrop-blur-sm">
            <Camera className="w-4 h-4" />
            <span>Fotos: {capturedPhotos.length}</span>
          </div>
          {existingPlate ? (
            <span className="text-[11px] text-amber-300 font-semibold mt-0.5">
              Añadiendo a: {existingPlate}
            </span>
          ) : (
            <span className="text-[10px] text-white/80 mt-0.5">
              1ª foto = Matrícula del vehículo
            </span>
          )}
        </div>

        {/* Camera options (torch & flip) */}
        <div className="flex items-center gap-2">
          {hasTorch && (
            <button
              onClick={toggleTorch}
              className={`p-2 rounded-full text-white backdrop-blur-sm transition-colors ${
                torchOn ? 'bg-amber-400 text-slate-900' : 'bg-white/20 hover:bg-white/30'
              }`}
              title="Linterna / Flash"
            >
              {torchOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={switchCameraFacing}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors"
            title="Cambiar cámara frontal/trasera"
          >
            <SwitchCamera className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Viewfinder */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {cameraError ? (
          <div className="p-6 text-center text-white max-w-md">
            <Camera className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-bold mb-2">Acceso a cámara</h3>
            <p className="text-sm text-slate-300 mb-6">{cameraError}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 bg-menorca-600 hover:bg-menorca-700 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg"
            >
              <ImageIcon className="w-5 h-5" />
              <span>Hacer foto con la cámara del móvil</span>
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Target overlay guide on first photo for plate centering */}
            {capturedPhotos.length === 0 && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                <div className="w-72 h-32 border-2 border-dashed border-white/80 rounded-xl bg-black/10 flex flex-col items-center justify-center p-2 text-center shadow-2xl backdrop-blur-[1px]">
                  <span className="text-xs font-bold text-white bg-black/60 px-2 py-0.5 rounded uppercase tracking-wider mb-1">
                    Encuadre de Matrícula
                  </span>
                  <span className="text-[11px] text-white/90">
                    Sitúa la matrícula aquí en la 1ª fotografía
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Hidden Fallback Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={handleFallbackFiles}
        />
      </div>

      {/* Live Thumbnails Strip */}
      {capturedPhotos.length > 0 && (
        <div className="bg-black/85 backdrop-blur-md px-3 py-2.5 border-t border-white/10 z-20">
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5">
            {capturedPhotos.map((photo, idx) => (
              <div
                key={photo.id}
                onClick={() => setPreviewPhoto(photo)}
                className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-white/40 cursor-pointer group active:scale-95 transition-transform"
              >
                <img
                  src={photo.dataUrl}
                  alt={photo.filename}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[10px] text-center text-white font-mono font-bold leading-tight py-0.5">
                  #{idx + 1}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePhoto(photo.id);
                  }}
                  className="absolute top-0 right-0 p-1 bg-rose-600/90 text-white rounded-bl-lg"
                  title="Eliminar foto"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            <div ref={thumbnailsEndRef} />
          </div>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div className="h-28 px-4 bg-black flex items-center justify-between z-20">
        {/* Left: Gallery Fallback or Info */}
        <div className="w-20 flex justify-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-1 text-white/80 hover:text-white"
            title="Seleccionar archivos o cámara del sistema"
          >
            <div className="p-2.5 rounded-full bg-white/15">
              <ImageIcon className="w-6 h-6" />
            </div>
            <span className="text-[10px]">Galería/Más</span>
          </button>
        </div>

        {/* Center: BIG Ultra-Fast Shutter Button */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={captureFrame}
            disabled={isProcessingShot}
            className="relative w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-90 transition-transform focus:outline-none shadow-2xl"
            title="Disparar fotografía rápida"
          >
            <div className={`w-full h-full rounded-full transition-colors ${
              isProcessingShot ? 'bg-amber-400 animate-pulse' : 'bg-white'
            }`} />
          </button>
        </div>

        {/* Right: BIG Green "✓ TERMINAR PERITAJE" Button */}
        <div className="w-28 flex justify-center">
          <button
            onClick={handleFinish}
            disabled={capturedPhotos.length === 0}
            className={`w-full py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1 font-bold text-xs tracking-tight shadow-xl transition-all ${
              capturedPhotos.length > 0
                ? 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 shadow-emerald-900/50'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
            }`}
            title="Finalizar peritaje y procesar matrícula"
          >
            <Check className="w-6 h-6 stroke-[3]" />
            <span>✓ TERMINAR</span>
          </button>
        </div>
      </div>

      {/* Lightbox / Preview Modal for single photo inside camera */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col p-4">
          <div className="flex items-center justify-between text-white mb-2">
            <span className="font-mono text-sm font-semibold">{previewPhoto.filename}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDeletePhoto(previewPhoto.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 rounded-lg text-xs font-bold"
              >
                <Trash2 className="w-4 h-4" />
                <span>Borrar</span>
              </button>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 rounded-full bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <img
              src={previewPhoto.dataUrl}
              alt={previewPhoto.filename}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
