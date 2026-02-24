import { useState, useEffect } from 'react';
import { auth, db } from './firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, push, set } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';

// 1. IMPORTACIÓN DE ICONOS PROFESIONALES
import { Home, Pill, ClipboardList, LogOut, Bell } from 'lucide-react';

import Login from './components/Login'; 
import PacienteDashboard from './components/PacienteDashboard';
import MedicoDashboard from './components/MedicoDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ nombre: '', hora: '', dosis: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
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

  const dispararAlarma = (nombre, hora, dosis) => {
    setModalData({ nombre, hora, dosis });
    setShowModal(true);
  };

  const registrarToma = async (estado) => {
    setShowModal(false);
    if (!user) return;

    try {
      const timestamp = new Date().toISOString();
      const dataToma = {
        pacienteEmail: user.email,
        medicamento: modalData.nombre,
        dosis: modalData.dosis || 'N/A', 
        hora: modalData.hora,
        estado: estado,
        fecha: timestamp
      };

      const historialRef = ref(db, `historial/${user.uid}`);
      await set(push(historialRef), dataToma);

      if (userData?.codigoVinculado) {
        const reporteMedicoRef = ref(db, `reportesMedicos/${userData.codigoVinculado}`);
        await set(push(reporteMedicoRef), dataToma);
      }
      
      console.log(`DoseSync: Toma registrada - ${modalData.nombre} (${modalData.dosis})`);
    } catch (error) {
      console.error("Error al registrar toma:", error);
      alert("Error al conectar con la base de datos.");
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
        {/* BOTÓN SALIR CON ICONO */}
        <button onClick={() => auth.signOut()} className="btn btn-sm btn-danger header-btn-right">
          <LogOut size={16} style={{ marginRight: '5px' }} /> Salir
        </button>
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

      <AnimatePresence>
        {showModal && (
          <div className="modal">
            <motion.div 
              className="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            ></motion.div>

            <motion.div 
              className="modal-content"
              initial={{ scale: 0.5, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 100 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              {/* ICONO DE ALERTA EN EL MODAL */}
              <Bell size={40} color="#e74c3c" style={{ marginBottom: '10px' }} />
              <p className="modal-titulo">Hora de tomar: <br/><strong>{modalData.nombre}</strong></p>
              <p style={{ color: '#666', marginTop: '-10px', marginBottom: '15px' }}>Dosis: {modalData.dosis}</p>
              
              <div className="modal-actions">
                <button className="btn btn-success" onClick={() => registrarToma('tomado')}>✅ Tomado</button>
                <button className="btn btn-danger" onClick={() => registrarToma('omitido')}>❌ Omitido</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NAVEGACIÓN INFERIOR CON ICONOS PROFESIONALES */}
      {userData?.rol === 'paciente' && (
        <nav className="bottom-nav">
          <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <Home size={22} className="nav-icon" />
            <span className="nav-label">Inicio</span>
          </button>
          <button className={`nav-item ${activeTab === 'recordatorios' ? 'active' : ''}`} onClick={() => setActiveTab('recordatorios')}>
            <Pill size={22} className="nav-icon" />
            <span className="nav-label">Recordatorios</span>
          </button>
          <button className={`nav-item ${activeTab === 'historial' ? 'active' : ''}`} onClick={() => setActiveTab('historial')}>
            <ClipboardList size={22} className="nav-icon" />
            <span className="nav-label">Historial</span>
          </button>
        </nav>
      )}
    </div>
  );
}

export default App;