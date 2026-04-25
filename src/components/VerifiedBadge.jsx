export default function VerifiedBadge({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 4, flexShrink: 0 }}
      aria-label="Verified"
    >
      {/* Blue circle background like WhatsApp */}
      <circle cx="12" cy="12" r="12" fill="#1d9bf0" />
      {/* Pen/pencil icon inside */}
      <path
        d="M15.5 6.5L17.5 8.5L10.5 15.5L7.5 16.5L8.5 13.5L15.5 6.5Z"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M14 8L16 10"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
