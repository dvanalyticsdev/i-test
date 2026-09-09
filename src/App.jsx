import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExamProvider, useExam } from './context/ExamContext';
import { LoginView } from './components/auth/LoginView';
import { StudentDashboard } from './components/student/StudentDashboard';
import { ExamEnvironment } from './components/student/ExamEnvironment';
import { AdminDashboard } from './components/admin/AdminDashboard';

import { ErrorBoundary } from './components/common/ErrorBoundary';

const MainContent = () => {
  const { user } = useAuth();
  const { activeSession } = useExam();

  if (!user) {
    return <LoginView />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  // Student view
  if (activeSession) {
    return <ExamEnvironment />;
  }

  return <StudentDashboard />;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ExamProvider>
          <MainContent />
        </ExamProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
