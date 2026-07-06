import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, doc, getDoc } from '../lib/firebase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, activeTab, setActiveTab }) => {
  const { user, loading } = useAuth();
  const [verifying, setVerifying] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;

    // Non-protected tabs are always authorized
    if (activeTab !== 'admin-dashboard' && activeTab !== 'colaborador-dashboard') {
      setIsAuthorized(true);
      return;
    }

    const checkAccess = async () => {
      if (!user) {
        setIsAuthorized(false);
        alert('Acesso negado');
        setActiveTab('home');
        return;
      }

      setVerifying(true);
      try {
        const userDocRef = doc(db, "usuarios", user.id);
        const userSnap = await getDoc(userDocRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          const tipoUsuario = data.tipo_usuario || data.role;
          const hasPermission = tipoUsuario === 'administrador' || tipoUsuario === 'admin' || tipoUsuario === 'colaborador';
          
          if (hasPermission) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
            alert('Acesso negado');
            setActiveTab('home');
          }
        } else {
          setIsAuthorized(false);
          alert('Acesso negado');
          setActiveTab('home');
        }
      } catch (err) {
        console.error("Erro ao verificar permissões no Firestore:", err);
        // Fallback to local state if Firestore read fails
        const hasPermission = user.role === 'admin' || user.role === 'administrador' || user.role === 'colaborador';
        if (hasPermission) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          alert('Acesso negado');
          setActiveTab('home');
        }
      } finally {
        setVerifying(false);
      }
    };

    checkAccess();
  }, [activeTab, user, loading, setActiveTab]);

  if (loading || verifying || isAuthorized === null) {
    if (activeTab === 'admin-dashboard' || activeTab === 'colaborador-dashboard') {
      return (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
        </div>
      );
    }
  }

  if (!isAuthorized && (activeTab === 'admin-dashboard' || activeTab === 'colaborador-dashboard')) {
    return null;
  }

  return <>{children}</>;
};
