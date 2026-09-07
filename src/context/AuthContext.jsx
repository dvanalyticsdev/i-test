import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('i_test_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const loginStudent = (lmsId, studentName = 'Alex Mercer', course = 'AIML', batch = '202601') => {
    const studentUser = {
      id: lmsId,
      name: studentName,
      role: 'student',
      lmsId: lmsId,
      course: course,
      batch: batch,
      loginTime: new Date().toISOString()
    };
    setUser(studentUser);
    localStorage.setItem('i_test_auth_user', JSON.stringify(studentUser));
    return true;
  };

  const loginAdmin = (email, password) => {
    if (email === 'admin@platform.com' && password === 'admin123') {
      const adminUser = {
        id: 'ADM-001',
        name: 'Chief Evaluation Officer',
        email: email,
        role: 'admin',
        loginTime: new Date().toISOString()
      };
      setUser(adminUser);
      localStorage.setItem('i_test_auth_user', JSON.stringify(adminUser));
      return { success: true };
    }
    return { success: false, message: 'Invalid Admin credentials (Use admin@platform.com / admin123)' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('i_test_auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, loginStudent, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
