
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Inicia a aplicação Viral Road
console.log("🚀 Viral Road: Iniciando aplicação...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("❌ Viral Road: Elemento #root não encontrado no DOM.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log("✅ Viral Road: Renderização inicial concluída.");
  } catch (error) {
    console.error("💥 Viral Road: Erro crítico durante o render:", error);
  }
}
