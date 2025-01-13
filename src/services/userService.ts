import { User } from '../types/user';

const USERS_KEY = 'users';

const DEFAULT_USERS = [{
  id: 'admin',
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'admin123',
  role: 'admin',
  status: 'active' as const,
  lastLogin: new Date().toISOString()
}];

export const userService = {
  initialize() {
    const users = localStorage.getItem(USERS_KEY);
    if (!users) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    }
  },

  getUsers(): User[] {
    const users = localStorage.getItem(USERS_KEY);
    if (!users) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(users);
  },

  saveUsers(users: User[]): void {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  addUser(userData: Omit<User, 'id' | 'lastLogin'>): User {
    const users = this.getUsers();
    
    // Validate user data
    const errors = this.validateUser(userData);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      status: userData.status || 'active',
      lastLogin: new Date().toISOString()
    };

    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  },

  updateUser(userId: string, userData: Partial<User>): User {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const updatedUser = {
      ...users[userIndex],
      ...userData,
      id: userId // Ensure ID doesn't change
    };

    users[userIndex] = updatedUser;
    this.saveUsers(users);
    return updatedUser;
  },

  deleteUser(userId: string): void {
    const users = this.getUsers().filter(u => u.id !== userId);
    this.saveUsers(users);
  },

  validateUser(data: Partial<User>): string[] {
    const errors: string[] = [];
    
    if (!data.name?.trim()) {
      errors.push('Name is required');
    }
    
    if (!data.email?.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format');
    }
    
    if (!data.password?.trim()) {
      errors.push('Password is required');
    } else if (data.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }
    
    const users = this.getUsers();
    if (users.some(u => u.email === data.email)) {
      errors.push('Email already exists');
    }
    
    return errors;
  },

  validateUserEdit(data: Partial<User>, userId: string): string[] {
    const errors: string[] = [];
    
    if (!data.name?.trim()) {
      errors.push('Name is required');
    }
    
    if (!data.email?.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format');
    }
    
    const users = this.getUsers();
    const emailExists = users.some(u => u.email === data.email && u.id !== userId);
    if (emailExists) {
      errors.push('Email already exists');
    }
    
    return errors;
  },

  toggleUserStatus(userId: string): User {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const newStatus: User['status'] = users[userIndex].status === 'active' ? 'inactive' : 'active';
    const updatedUser: User = {
      ...users[userIndex],
      status: newStatus
    };

    users[userIndex] = updatedUser;
    this.saveUsers(users);
    return updatedUser;
  },

  authenticateUser(email: string, password: string): User | null {
    const users = this.getUsers();
    console.log('UserService: all users:', users);
    console.log('UserService: attempting login with:', { email, password });
    const user = users.find(u => 
      u.email === email && 
      u.password === password && 
      u.status === 'active'
    ) || null;
    console.log('UserService: found user:', user);
    
    if (user) {
      // Update last login
      this.updateUser(user.id, {
        lastLogin: new Date().toISOString()
      });
    }
    
    return user;
  },

  clearUsers(): void {
    localStorage.removeItem(USERS_KEY);
    this.initialize(); // Reinitialize with default users
  }
}; 

// Initialize the service when the module loads
userService.initialize(); 