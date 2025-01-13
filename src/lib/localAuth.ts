interface User {
  email: string;
  password: string;
}

const DEFAULT_USER: User = {
  email: 'admin@example.com',
  password: 'admin123'
};

export const localAuth = {
  signIn(email: string, password: string) {
    if (email === DEFAULT_USER.email && password === DEFAULT_USER.password) {
      const session = { user: { email }, expires_at: Date.now() + 24 * 60 * 60 * 1000 };
      localStorage.setItem('session', JSON.stringify(session));
      return { data: { session }, error: null };
    }
    return { data: null, error: new Error('Invalid credentials') };
  },

  signOut() {
    localStorage.removeItem('session');
    return { error: null };
  },

  getSession() {
    const session = localStorage.getItem('session');
    return { data: { session: session ? JSON.parse(session) : null }, error: null };
  }
}; 