import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExamProvider, useExam } from './context/ExamContext';
import { LoginView } from './components/auth/LoginView';
import { StudentDashboard } from './components/student/StudentDashboard';
import { ExamEnvironment } from './components/student/ExamEnvironment';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { TestSubmissionReportView } from './components/admin/TestSubmissionReportView';
import { TestDetailsView } from './components/admin/TestDetailsView';
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

  // Support direct standalone test details loading in new tab
  const params = new URLSearchParams(window.location.search);
  const isTestDetailsRoute = currentPath.startsWith('/admin/test-details') || params.get('mode') === 'details' || params.get('view') === 'details';
  if (isTestDetailsRoute) {
    return <TestDetailsView testId={params.get('id')} testTitle={params.get('test')} />;
  }

  // Support direct standalone report loading in new tab
  const reportTestTitle = params.get('test') || params.get('report');
  if (currentPath.startsWith('/admin/report') || reportTestTitle) {
    return <TestSubmissionReportView testTitle={reportTestTitle} />;
  }

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
