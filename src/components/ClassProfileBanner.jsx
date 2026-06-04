import { useRef } from 'react';
import { uploadFile, UPLOADS_BASE } from '../api';
import './ClassProfileBanner.css';

const DEFAULT_COVER =
  "linear-gradient(135deg, #075e54 0%, #128c7e 45%, #25d366 100%)";
const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23128c7e'/%3E%3Ctext y='.62em' font-size='48' x='50%25' text-anchor='middle' fill='white'%3E%F0%9F%93%9A%3C/text%3E%3C/svg%3E";

function imageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${UPLOADS_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export default function ClassProfileBanner({ cls, classId, token, editable = false, onUpdated }) {
  const coverRef = useRef(null);
  const avatarRef = useRef(null);

  const upload = async (field, file) => {
    if (!file || !token) return;
    const fd = new FormData();
    fd.append('image', file);
    const endpoint = field === 'cover' ? `/classes/${classId}/cover` : `/classes/${classId}/avatar`;
    const updated = await uploadFile(endpoint, fd, token);
    onUpdated?.(updated);
  };

  const coverStyle = cls?.cover_path
    ? { backgroundImage: `url(${imageUrl(cls.cover_path)})` }
    : { background: DEFAULT_COVER };

  return (
    <div className="class-profile-banner">
      <div className="class-profile-cover" style={coverStyle}>
        {editable && (
          <>
            <button
              type="button"
              className="class-profile-edit-cover"
              onClick={() => coverRef.current?.click()}
            >
              📷 Change cover
            </button>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload('cover', f).catch(() => {});
                e.target.value = '';
              }}
            />
          </>
        )}
      </div>
      <div className="class-profile-body">
        <div className="class-profile-avatar-wrap">
          <img
            src={imageUrl(cls?.avatar_path) || DEFAULT_AVATAR}
            alt=""
            className="class-profile-avatar"
            onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_AVATAR; }}
          />
          {editable && (
            <>
              <button
                type="button"
                className="class-profile-edit-avatar"
                onClick={() => avatarRef.current?.click()}
                title="Change class profile photo"
              >
                ✏️
              </button>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload('avatar', f).catch(() => {});
                  e.target.value = '';
                }}
              />
            </>
          )}
        </div>
        <div className="class-profile-text">
          <h1>{cls?.name}</h1>
          {cls?.subject && <div className="class-profile-subject">📖 {cls.subject}</div>}
        </div>
      </div>
    </div>
  );
}
