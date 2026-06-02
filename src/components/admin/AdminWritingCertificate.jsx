import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import umunsiLogo from '../../assets/umunsi-logo.jpg';
import umunsimediaLogo from '../../assets/umunsimedia-logo.jpg';
import './WritingCertificate.css';

const DEFAULT_TITLE = 'UMUNSI MEDIA WRITING COMPETITION CERTIFICATE';
const DEFAULT_BODY =
  'For outstanding achievement in the Umunsimedia writing competition organized by Umunsi.com through student.umunsi.com, empowering learners through education and creative writing.';
const DEFAULT_SIGNER = 'KWIZERA Jean de Dieu';
const DEFAULT_SIGNER_ROLE = 'Founder & CEO, Umunsi.com';

function formatCertificateDate(value) {
  if (!value) return '';
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function WritingCertificateDocument({
  studentName,
  schoolName,
  certificateDate,
  title,
  bodyText,
  signerName,
  signerRole,
  awardLabel,
}) {
  const displayName = (studentName || '').trim() || 'Student Name';
  const school = (schoolName || '').trim();
  const dateStr = formatCertificateDate(certificateDate);

  return (
    <article className="wcert-certificate" id="writing-competition-certificate">
      <div className="wcert-inner">
        <div className="wcert-top-logos">
          <a
            href="https://umunsi.com"
            target="_blank"
            rel="noreferrer"
            className="wcert-top-brand wcert-top-brand--side"
          >
            <img src={umunsiLogo} alt="Umunsi.com" />
            <span>umunsi.com</span>
          </a>
          <a
            href="https://umunsimedia.com"
            target="_blank"
            rel="noreferrer"
            className="wcert-top-brand wcert-top-brand--hero"
          >
            <img
              src={umunsimediaLogo}
              alt="umunsimedia.com"
              className="wcert-umunsimedia-logo"
            />
            <span>umunsimedia.com</span>
          </a>
          <div className="wcert-student-badge wcert-top-brand--side">
            <span aria-hidden>🎓</span>
            <span>student.umunsi.com</span>
          </div>
        </div>

        <h1 className="wcert-title">{(title || DEFAULT_TITLE).trim()}</h1>
        <p className="wcert-subtitle">
          Presented by <strong>umunsimedia.com</strong> — Umunsi.com education platform · student.umunsi.com
          <br />
          Education through writing — empowering the next generation
        </p>

        <p className="wcert-presented">This certificate is proudly presented to</p>
        <h2 className="wcert-student-name">{displayName}</h2>

        {school ? <p className="wcert-school">{school}</p> : null}

        <p className="wcert-body">
          {(awardLabel || 'Winner').trim()} — {(bodyText || DEFAULT_BODY).trim()}
        </p>

        {dateStr && <p className="wcert-date">Date: {dateStr}</p>}

        <div className="wcert-signature-block">
          <p className="wcert-signature-line" aria-label="Signature">
            {(signerName || DEFAULT_SIGNER).trim()}
          </p>
          <p className="wcert-signer-title">{(signerName || DEFAULT_SIGNER).trim()}</p>
          <p className="wcert-signer-role">{(signerRole || DEFAULT_SIGNER_ROLE).trim()}</p>
        </div>

        <footer className="wcert-footer-brands">
          <a href="https://umunsi.com" target="_blank" rel="noreferrer">
            <img src={umunsiLogo} alt="" />
            <span>Umunsi.com</span>
          </a>
          <a href="https://umunsimedia.com" target="_blank" rel="noreferrer" className="wcert-footer-umunsimedia">
            <img src={umunsimediaLogo} alt="" className="wcert-umunsimedia-logo" />
            <span>umunsimedia.com</span>
          </a>
          <div className="wcert-brand-student">
            <span className="wcert-brand-icon" aria-hidden>
              🎓
            </span>
            <span>student.umunsi.com</span>
          </div>
        </footer>
      </div>
    </article>
  );
}

export default function AdminWritingCertificate() {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return (
      <div className="admin-card">
        <p style={{ margin: 0, color: '#64748b' }}>
          Only UClass administrators can create and print writing competition certificates.
        </p>
      </div>
    );
  }

  const [studentName, setStudentName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [certificateDate, setCertificateDate] = useState(todayInputValue);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [bodyText, setBodyText] = useState(DEFAULT_BODY);
  const [awardLabel, setAwardLabel] = useState('Winner');
  const [signerName, setSignerName] = useState(DEFAULT_SIGNER);
  const [signerRole, setSignerRole] = useState(DEFAULT_SIGNER_ROLE);

  const canPrint = useMemo(() => studentName.trim().length > 0, [studentName]);

  const handlePrint = () => {
    if (!canPrint) return;
    window.print();
  };

  return (
    <div className="wcert-layout">
      <div className="wcert-form-card">
        <h3>Writing competition certificate</h3>
        <p className="wcert-form-hint">
          Fill in the winner&apos;s details, preview the certificate, then print or save as PDF (Print →
          Save as PDF).
        </p>

        <div className="wcert-field">
          <label htmlFor="wcert-student">Student name *</label>
          <input
            id="wcert-student"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="e.g. Marie Uwase"
          />
        </div>

        <div className="wcert-field">
          <label htmlFor="wcert-school">School name (optional)</label>
          <input
            id="wcert-school"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            placeholder="Leave blank if not needed"
          />
        </div>

        <div className="wcert-field">
          <label htmlFor="wcert-date">Date</label>
          <input
            id="wcert-date"
            type="date"
            value={certificateDate}
            onChange={(e) => setCertificateDate(e.target.value)}
          />
        </div>

        <div className="wcert-field">
          <label htmlFor="wcert-award">Award</label>
          <input
            id="wcert-award"
            value={awardLabel}
            onChange={(e) => setAwardLabel(e.target.value)}
            placeholder="Winner"
          />
        </div>

        <div className="wcert-field">
          <label htmlFor="wcert-title">Certificate heading</label>
          <input
            id="wcert-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="wcert-field">
          <label htmlFor="wcert-body">Certificate text</label>
          <textarea
            id="wcert-body"
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
          />
        </div>

        <div className="wcert-field">
          <label htmlFor="wcert-signer">Signature / CEO name</label>
          <input
            id="wcert-signer"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
          />
        </div>

        <div className="wcert-field">
          <label htmlFor="wcert-signer-role">Title under signature</label>
          <input
            id="wcert-signer-role"
            value={signerRole}
            onChange={(e) => setSignerRole(e.target.value)}
          />
        </div>

        <div className="wcert-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canPrint}
            onClick={handlePrint}
          >
            Print certificate
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setStudentName('');
              setSchoolName('');
              setCertificateDate(todayInputValue());
              setTitle(DEFAULT_TITLE);
              setBodyText(DEFAULT_BODY);
              setAwardLabel('Winner');
              setSignerName(DEFAULT_SIGNER);
              setSignerRole(DEFAULT_SIGNER_ROLE);
            }}
          >
            Reset form
          </button>
        </div>
      </div>

      <div className="wcert-preview-wrap">
        <p className="wcert-preview-label">Print preview (A4)</p>
        <WritingCertificateDocument
          studentName={studentName}
          schoolName={schoolName}
          certificateDate={certificateDate}
          title={title}
          bodyText={bodyText}
          signerName={signerName}
          signerRole={signerRole}
          awardLabel={awardLabel}
        />
      </div>
    </div>
  );
}
