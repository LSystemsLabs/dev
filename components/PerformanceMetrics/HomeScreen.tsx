import React from 'react';
import './HomeScreen.css';

interface HomeScreenProps {
  goToSetup: () => void;
  // loadSession?: () => void; // Para el futuro
}

const HomeScreen: React.FC<HomeScreenProps> = ({ goToSetup /*, loadSession */ }) => {
  return (
    <div className="pdt-home-screen pdt-view"> {/* Clase común para vistas */}
      <div className="pdt-logo-area">
           {/* Puedes poner un SVG o icono aquí */}
           <span className="pdt-logo-placeholder">📊</span>
           <h1>API Performance DevTool</h1>
      </div>
      <p>Intercepta, configura y analiza el rendimiento de las llamadas a tus APIs durante el desarrollo.</p>
      <div className="pdt-home-actions">
          <button className="pdt-button pdt-button-primary" onClick={goToSetup}>
            🚀 Iniciar Nueva Sesión
          </button>
          {/* <button className="pdt-button" onClick={loadSession} disabled>
             📁 Cargar Sesión (Próximamente)
          </button> */}
      </div>
    </div>
  );
};

export default HomeScreen;