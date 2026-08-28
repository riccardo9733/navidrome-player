import CryptoJS from "crypto-js";

export function generateSalt(length = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateToken(password: string, salt: string): string {
  return CryptoJS.MD5(password + salt).toString(CryptoJS.enc.Hex);
}

export function createAuthParams(username: string, password?: string, legacyAuth = false) {
  if (legacyAuth && password) {
    return {
      u: username,
      p: password,
      v: "1.16.1",
      c: "NavidromePWA",
      f: "json",
    };
  }

  const salt = generateSalt();
  const token = generateToken(password || "", salt);

  return {
    u: username,
    t: token,
    s: salt,
    v: "1.16.1",
    c: "NavidromePWA",
    f: "json",
  };
}
