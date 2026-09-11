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

  const loginStudent = async (lmsId) => {
    try {
      const res = await fetch(`/api/students/${encodeURIComponent(lmsId)}`);
      const data = await res.json();
      if (!res.ok || !data.success || !data.student) {
        return { success: false, message: 'Student record not found. Please contact the administrator.' };
      }

      const student = data.student;
      const studentUser = {
        id: student.lmsId,
        name: student.name,
        role: 'student',
        lmsId: student.lmsId,
        email: student.email || '',
        course: student.course || '',
        courses: student.courses || listFromValue(student.course),
        batch: student.batch || '',
        batches: student.batches || listFromValue(student.batch),
        loginTime: new Date().toISOString()
      };
      setUser(studentUser);
      localStorage.setItem('i_test_auth_user', JSON.stringify(studentUser));
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Unable to verify student record right now.' };
    }
  };

  const createAdminSession = (admin, syncToken) => {
    const email = admin.email;
    const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return {
      id: admin.id || email,
      name: admin.name || name,
      email,
      syncToken: syncToken || '',
      role: 'admin',
      loginTime: new Date().toISOString()
    };
  };

  const loginAdmin = async (email, password) => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.error || 'Invalid admin credentials.' };
      }
      const adminUser = createAdminSession(data.admin, data.syncToken);
      setUser(adminUser);
      localStorage.setItem('i_test_auth_user', JSON.stringify(adminUser));
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Unable to verify admin credentials right now.' };
    }
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

function listFromValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value).split(',').map(item => item.trim()).filter(Boolean);
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
