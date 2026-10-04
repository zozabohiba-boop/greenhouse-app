import { useRef, useState } from 'react';
import type { PhotoView } from '../lib/photos';
import { Icon } from './Icon';
import { Sheet } from './Sheet';

interface Item {
  id: string;
  url: string | null;
  pending?: boolean;
}

/** شريط صور مع زر الكاميرا. الصور الجديدة قبل الحفظ تُمرر كـ local (روابط blob) */
export function PhotoStrip({
  photos,
  onAdd,
  onRemove,
  canRemove,
}: {
  photos: (PhotoView | Item)[];
  onAdd?: (files: File[]) => void;
  onRemove?: (id: string) => void;
  canRemove?: (p: PhotoView | Item) => boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<PhotoView | Item | null>(null);
  return (
    <div className="photos">
      {photos.map((p) => (
        <button type="button" key={p.id} className="thumb" onClick={() => setView(p)} aria-label="عرض الصورة">
          {p.url ? <img src={p.url} alt="" loading="lazy" /> : <span className="faint"><Icon name="cloudoff" size={20} /></span>}
          {p.pending && <span className="badge" title="لم تُرفع بعد"><Icon name="clock" size={12} /></span>}
        </button>
      ))}
      {onAdd && (
        <>
          <button type="button" className="thumb add" onClick={() => input.current?.click()}>
            <Icon name="camera" size={22} />
            <span>صورة</span>
          </button>
          <input
            ref={input}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            hidden
            onChange={(e) => {
              const files = [...(e.target.files ?? [])];
              e.target.value = '';
              if (files.length) onAdd(files);
            }}
          />
        </>
      )}
      {view && (
        <Sheet title="صورة" onClose={() => setView(null)}>
          {view.url ? <img src={view.url} alt="" className="photo-full" /> : <p className="muted">الصورة غير متاحة بدون إنترنت.</p>}
          {'caption' in view && view.caption && <p style={{ marginTop: 8 }}>{view.caption}</p>}
          <div className="form-actions" style={{ marginTop: 14 }}>
            {onRemove && (!canRemove || canRemove(view)) && (
              <button className="btn danger" onClick={() => { onRemove(view.id); setView(null); }}>
                <Icon name="trash" /> حذف الصورة
              </button>
            )}
            <button className="btn" onClick={() => setView(null)}>إغلاق</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
