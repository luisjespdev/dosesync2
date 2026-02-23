import { useState, useEffect } from 'react';
import { auth, db } from './firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, push, set } from 'firebase/database'; // Importaciones de Realtime Database

import Login from './components/login'; 
import PacienteDashboard from './components/PacienteDashboard';
import MedicoDashboard from './components/MedicoDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  // Estados para el Modal Global de Alarma
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ nombre: '', hora: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // En Realtime Database usamos ref() y onValue() para escuchar cambios
        const userRef = ref(db, 'usuarios/' + currentUser.uid);
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setUserData(data);
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const dispararAlarma = (nombre, hora) => {
    setModalData({ nombre, hora });
    setShowModal(true);
  };

  // FUNCIÓN ARREGLADA PARA REALTIME DATABASE
  const registrarToma = async (estado) => {
    setShowModal(false);

    if (!user) return;

    try {
      const timestamp = new Date().toISOString();
      const dataToma = {
        pacienteEmail: user.email,
        medicamento: modalData.nombre,
        hora: modalData.hora,
        estado: estado,
        fecha: timestamp
      };

      // 1. Guardar en el historial privado del Paciente (Realtime Database)
      const historialRef = ref(db, `historial/${user.uid}`);
      const nuevaTomaRef = push(historialRef);
      await set(nuevaTomaRef, dataToma);

      // 2. Si hay un médico vinculado, guardar copia en su carpeta de reportes
      if (userData?.codigoVinculado) {
        const reporteMedicoRef = ref(db, `reportesMedicos/${userData.codigoVinculado}`);
        const nuevoReporteRef = push(reporteMedicoRef);
        await set(nuevoReporteRef, dataToma);
      }
      
      console.log(`Toma registrada en RTDB: ${modalData.nombre} - ${estado}`);
    } catch (error) {
      console.error("Error al registrar toma:", error);
      alert("Error al conectar con Realtime Database.");
    }
  };

  if (loading) return <div className="loading-screen"><h2>Cargando DoseSync...</h2></div>;
  if (!user) return <Login />;

  return (
    <div className="app-main">
      <header className="app-header">
        <div className="logo-container header">
          <img src="/img/logo.png" alt="DoseSync" className="logo-img header" width="40" height="27" />
          <div className="logo header">{userData?.rol === 'enfermero' ? 'Portal Médico' : 'DoseSync'}</div>
        </div>
        <button onClick={() => auth.signOut()} className="btn btn-sm btn-danger header-btn-right">Salir</button>
      </header>

      <main className="screens">
        <section className="screen active">
          <div className="screen-inner">
            {userData?.rol === 'enfermero' ? (
              <MedicoDashboard userData={userData} />
            ) : (
              <PacienteDashboard 
                userData={userData} 
                activeTab={activeTab} 
                dispararAlarma={dispararAlarma}
                setActiveTab={setActiveTab}
              />
            )}
          </div>
        </section>
      </main>

      {showModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowModal(false)}></div>
          <div className="modal-content">
            <p className="modal-titulo">Hora de tomar: <br/><strong>{modalData.nombre}</strong></p>
            <div className="modal-actions">
              <button className="btn btn-success" onClick={() => registrarToma('tomado')}>✅ Tomado</button>
              <button className="btn btn-danger" onClick={() => registrarToma('omitido')}>❌ Omitido</button>
            </div>
          </div>
        </div>
      )}

      {userData?.rol === 'paciente' && (
        <nav className="bottom-nav">
          <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <span className="nav-icon">🏠</span><span className="nav-label">Inicio</span>
          </button>
          <button className={`nav-item ${activeTab === 'recordatorios' ? 'active' : ''}`} onClick={() => setActiveTab('recordatorios')}>
            <span className="nav-icon">💊</span><span className="nav-label">Recordatorios</span>
          </button>
          <button className={`nav-item ${activeTab === 'historial' ? 'active' : ''}`} onClick={() => setActiveTab('historial')}>
            <span className="nav-icon">📊</span><span className="nav-label">Historial</span>
          </button>
        </nav>
      )}
    </div>
  );
}

export default App;