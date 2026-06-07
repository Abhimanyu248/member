import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.138.122.148:3000/api';
// const API_BASE_URL = 'https://backend-txff.onrender.com/api';
const LAST_PHONE_KEY = 'member_last_phone';
const AUTH_TOKEN_KEY = 'member_auth_token';

class MemberApiService {
  async request(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      signal: controller.signal,
    }).catch((err) => {
      clearTimeout(timeoutId);
      throw new Error(err.name === 'AbortError' ? 'Connection timed out' : 'Unable to reach backend');
    });

    clearTimeout(timeoutId);

    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data;
  }

  async lookupMember(phone) {
    const cleanedPhone = String(phone || '').replace(/\D/g, '');
    const data = await this.request(`/member-portal/lookup?phone=${encodeURIComponent(cleanedPhone)}`);
    await AsyncStorage.setItem(LAST_PHONE_KEY, cleanedPhone);
    return data;
  }

  async loginMember(phone, password) {
    const cleanedPhone = String(phone || '').replace(/\D/g, '');
    const data = await this.request('/member-portal/login', {
      method: 'POST',
      body: JSON.stringify({ phone: cleanedPhone, password }),
    });
    // Persist the phone and the JWT token returned from login
    await AsyncStorage.setItem(LAST_PHONE_KEY, cleanedPhone);
    if (data.token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
    }
    return data;
  }

  // Called on app startup to restore the session from a saved JWT token
  async getMe() {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return null;

    return this.request('/member-portal/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async changePassword(phone, currentPassword, newPassword) {
    const cleanedPhone = String(phone || '').replace(/\D/g, '');
    return this.request('/member-portal/change-password', {
      method: 'POST',
      body: JSON.stringify({ phone: cleanedPhone, currentPassword, newPassword }),
    });
  }

  async getLastPhone() {
    return AsyncStorage.getItem(LAST_PHONE_KEY);
  }

  async clearLastPhone() {
    await AsyncStorage.removeItem(LAST_PHONE_KEY);
  }

  // Call this on logout to fully clear the session
  async clearSession() {
    await AsyncStorage.multiRemove([LAST_PHONE_KEY, AUTH_TOKEN_KEY]);
  }
}

export const memberApi = new MemberApiService();
