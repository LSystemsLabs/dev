import React from 'react';

interface HomeScreenProps {
  onStartNewSession: () => void;
  onLoadSession: (file: File) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartNewSession, onLoadSession }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onLoadSession(e.target.files[0]);
    }
  };

  return (
    <div>
      <h3>Iniciar o Cargar Sesión</h3>
      <button onClick={onStartNewSession}>Iniciar Nueva Sesión</button>
      <div style={{ marginTop: '1rem' }}>
        <label>Cargar Sesión (JSON): </label>
        <input type="file" accept=".json" onChange={handleFileChange} />
      </div>
    </div>
  );
};

export default HomeScreen;
