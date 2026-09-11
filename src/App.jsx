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
  const [currentPath, setCurrentPath] = React.useState(window.location.pathname);

  React.useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
    }
  };

  if (!user) {
    const isAdminRoute = currentPath.startsWith('/admin');
    return <LoginView isAdminMode={isAdminRoute} navigateTo={navigateTo} />;
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
