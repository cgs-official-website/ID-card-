import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Check, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const ImageCropModal = ({ imageSrc, onCropComplete, onClose }) => {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef(new Image());
  const [imgLoaded, setImgLoaded] = useState(false);

  const CROP_SIZE = 300;

  useEffect(() => {
    const img = imgRef.current;
    img.onload = () => {
      setImgLoaded(true);
      setOffset({ x: 0, y: 0 });
      setScale(1);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgLoaded) return;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;

    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);

    // Draw circular clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    const aspectRatio = img.width / img.height;
    let drawW, drawH;
    if (aspectRatio > 1) {
      drawH = CROP_SIZE * scale;
      drawW = drawH * aspectRatio;
    } else {
      drawW = CROP_SIZE * scale;
      drawH = drawW / aspectRatio;
    }
    const x = (CROP_SIZE - drawW) / 2 + offset.x;
    const y = (CROP_SIZE - drawH) / 2 + offset.y;
    ctx.drawImage(img, x, y, drawW, drawH);
    ctx.restore();

    // Overlay dark outside circle
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Circle border
    ctx.strokeStyle = 'rgba(139,92,246,0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2 - 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }, [imgLoaded, scale, offset]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e) => {
    const t = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: t.clientX - offset.x, y: t.clientY - offset.y });
  };
  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const t = e.touches[0];
    setOffset({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
  };

  const handleConfirm = () => {
    // Render final cropped image without overlay
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = CROP_SIZE;
    finalCanvas.height = CROP_SIZE;
    const ctx = finalCanvas.getContext('2d');
    const img = imgRef.current;
    ctx.save();
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    const aspectRatio = img.width / img.height;
    let drawW, drawH;
    if (aspectRatio > 1) {
      drawH = CROP_SIZE * scale;
      drawW = drawH * aspectRatio;
    } else {
      drawW = CROP_SIZE * scale;
      drawH = drawW / aspectRatio;
    }
    const x = (CROP_SIZE - drawW) / 2 + offset.x;
    const y = (CROP_SIZE - drawH) / 2 + offset.y;
    ctx.drawImage(img, x, y, drawW, drawH);
    ctx.restore();
    finalCanvas.toBlob((blob) => {
      onCropComplete(blob, finalCanvas.toDataURL('image/png'));
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#131726] border border-[#2D334A]/70 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#2D334A]/50">
          <h3 className="text-xl font-black text-white">Crop Photo</h3>
          <button onClick={onClose} className="p-2 hover:bg-[#1E243D] rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          <p className="text-sm text-slate-400">Drag to reposition. Use the zoom controls below.</p>
          <div
            className="rounded-full overflow-hidden cursor-grab active:cursor-grabbing select-none shadow-2xl border-2 border-violet-500/40"
            style={{ width: CROP_SIZE, height: CROP_SIZE, touchAction: 'none' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <canvas ref={canvasRef} width={CROP_SIZE} height={CROP_SIZE} />
          </div>

          <div className="flex items-center gap-3 w-full justify-center">
            <button
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
              className="p-3 rounded-2xl bg-[#1E243D] hover:bg-[#252B48] border border-[#2D334A]/50 text-white transition-all"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <input
              type="range" min={0.5} max={3} step={0.05} value={scale}
              onChange={e => setScale(parseFloat(e.target.value))}
              className="flex-1 accent-violet-500"
            />
            <button
              onClick={() => setScale(s => Math.min(3, s + 0.1))}
              className="p-3 rounded-2xl bg-[#1E243D] hover:bg-[#252B48] border border-[#2D334A]/50 text-white transition-all"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}
              className="p-3 rounded-2xl bg-[#1E243D] hover:bg-[#252B48] border border-[#2D334A]/50 text-slate-400 transition-all"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-3 w-full pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-[#2D334A]/50 text-slate-300 font-bold hover:bg-[#1E243D] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-500/20"
            >
              <Check className="w-5 h-5" />
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
