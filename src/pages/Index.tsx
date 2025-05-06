
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard
    navigate('/dashboard');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background dark:bg-sidebar">
      <div className="text-center">
        {/* Use logo amarelo em fundo escuro */}
        <img 
          src="/lovable-uploads/264f147d-0233-41b1-b721-d364b51b4bfe.png" 
          alt="Metadesk" 
          className="h-12 mx-auto mb-4" 
        />
        <div className="animate-pulse">Carregando...</div>
      </div>
    </div>
  );
};

export default Index;
