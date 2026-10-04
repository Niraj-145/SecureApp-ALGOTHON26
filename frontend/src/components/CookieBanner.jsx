import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleConsent = (choice) => {
    localStorage.setItem('cookie_consent', choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="region" aria-label="Cookie consent banner">
      <p>
        <strong>Privacy Notice:</strong> SecureApp is an educational security testbed. We use essential local storage for session management and no external advertising trackers.
      </p>
      <div className="cookie-actions">
        <button
          onClick={() => handleConsent('essential')}
          className="btn btn-outline btn-sm"
          style={{ color: '#fff', borderColor: '#fff' }}
        >
          Essential Only
        </button>
        <button
          onClick={() => handleConsent('accepted')}
          className="btn btn-primary btn-sm"
          style={{ background: '#27774e', borderColor: '#27774e' }}
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
