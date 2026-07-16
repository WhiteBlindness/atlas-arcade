// Lightweight client-side auth validation (no dependencies).

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3;      // 0 empty, 1 weak, 2 medium, 3 strong
  label: string;
  color: string;
  /** meets the minimum policy: 8+ chars, one uppercase, one number */
  valid: boolean;
}

export function passwordStrength(pw: string): PasswordStrength {
  if (!pw) return { score: 0, label: "", color: "#4b5563", valid: false };
  const hasLen = pw.length >= 8;
  const hasUpper = /[A-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);
  const valid = hasLen && hasUpper && hasNumber;

  const hits = [hasLen, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
  if (!valid || hits <= 2) return { score: 1, label: "WEAK", color: "#ff3333", valid };
  if (hits === 3) return { score: 2, label: "MEDIUM", color: "#ffe600", valid };
  return { score: 3, label: "STRONG", color: "#00ff41", valid };
}

export function isValidUsername(name: string): boolean {
  return name.trim().length >= 3;
}

/** First failing rule as a user-facing message, or null when the form is valid. */
export function firstAuthError(
  tab: "signin" | "signup",
  email: string,
  password: string,
  username: string,
): string | null {
  if (!isValidEmail(email)) return "Enter a valid email address.";
  if (tab === "signup") {
    if (!isValidUsername(username)) return "Username must be at least 3 characters.";
    if (!passwordStrength(password).valid) return "Password needs 8+ characters, an uppercase letter and a number.";
  } else if (!password) {
    return "Enter your password.";
  }
  return null;
}
