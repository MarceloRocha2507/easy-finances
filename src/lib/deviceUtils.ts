export interface DeviceInfo {
  device_name: string;
  device_type: 'desktop' | 'mobile';
}

export function detectDevice(): DeviceInfo {
  const ua = navigator.userAgent;

  // Detect device type
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
  const device_type: 'desktop' | 'mobile' = isMobile ? 'mobile' : 'desktop';

  // Detect browser
  let browser = 'Navegador';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('OPR') || ua.includes('Opera')) browser = 'Opera';
  else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';

  // Detect OS
  let os = '';
  if (ua.includes('iPhone')) os = 'iPhone';
  else if (ua.includes('iPad')) os = 'iPad';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Linux')) os = 'Linux';

  const device_name = os ? `${browser} - ${os}` : browser;

  return { device_name, device_type };
}

export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

const SESSION_TOKEN_KEY = 'device_session_token';

export function getStoredSessionToken(): string | null {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

export function storeSessionToken(token: string): void {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
}

export function clearSessionToken(): void {
  localStorage.removeItem(SESSION_TOKEN_KEY);
}
