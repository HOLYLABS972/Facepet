interface AuthCredentials {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

type UserRole = 'user' | 'admin' | 'super_admin';
