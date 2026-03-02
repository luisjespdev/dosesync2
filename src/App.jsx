import { useState, useEffect } from 'react';

// Firebase
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, push, set } from 'firebase/database';

// Capacitor (Para notificaciones nativas con el móvil cerrado)
import { LocalNotifications } from '@capacitor/local-notifications';

// UI & Animaciones
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Pill, ClipboardList, LogOut, Bell, 
  CheckCircle2, XCircle 
} from 'lucide-react';

// Recursos y Componentes
import logo from './assets/logo.png';
import Login from './components/login';
import PacienteDashboard from './components/PacienteDashboard';
import MedicoDashboard from './components/MedicoDashboard';

function App() {
  // --- Estados ---
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ nombre: '', hora: '', dosis: '' });

  // --- 1. Inicialización de Permisos Nativa ---
  useEffect(() => {
    const initNativeHardware = async () => {
      try {
        await LocalNotifications.requestPermissions();
      } catch (e) {
        console.warn("DoseSync: Permisos de notificación no disponibles en web pura.");
      }
    };
    initNativeHardware();
  }, []);

  // --- 2. Manejo de Sesión y Datos ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = ref(db, 'usuarios/' + currentUser.uid);
        
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          // SEGURIDAD: Ya no asignamos "paciente" por defecto. 
          // Guardamos exactamente lo que diga la base de datos.
          setUserData(data); 
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

  // --- 3. Lógica de Alarmas y Registro ---
  const dispararAlarma = (nombre, hora, dosis) => {
    setModalData({ nombre, hora, dosis });
    setShowModal(true);
    
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  };

  const registrarToma = async (estado) => {
    setShowModal(false);
    if (!user) return;

    try {
      const timestamp = new Date().toISOString();
      const dataToma = {
        pacienteUID: user.uid,
        pacienteNombre: userData?.nombreUsuario || "Usuario sin nombre",
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

      console.log(`DoseSync: Registro completado para ${user.uid}`);
    } catch (error) {
      console.error("Error al registrar toma:", error);
    }
  };

  // --- Renderizado ---
  if (loading) return (
    <div className="loading-screen">
      <motion.h2 
        animate={{ opacity: [0.5, 1, 0.5] }} 
        transition={{ repeat: Infinity, duration: 2 }}
      >
        Cargando DoseSync...
      </motion.h2>
    </div>
  );

  if (!user) return <Login />;

  return (
    <div className="app-main">
      <header className="app-header">
        <div className="logo-container header">
          <img src={logo} alt="DoseSync" className="logo-img header-profesional" />
          <span className="logo-texto-minimalista">
            {userData?.rol === 'enfermero' ? 'Portal Médico' : 'DoseSync'}
          </span>
        </div>

        <button onClick={() => auth.signOut()} className="btn btn-sm btn-danger header-btn-right">
          <LogOut size={16} style={{ marginRight: '5px' }} /> Salir
        </button>
      </header>

      <main className="screens">
        <section className="screen active">
          <div className="screen-inner">
            {/* RENDERIZADO ESTRICTO CONDICIONADO AL ROL */}
            {userData?.rol === 'enfermero' ? (
              <MedicoDashboard userData={userData} />
            ) : userData?.rol === 'paciente' ? (
              <PacienteDashboard
                userData={userData}
                activeTab={activeTab}
                dispararAlarma={dispararAlarma}
                setActiveTab={setActiveTab}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <h3>Verificando acceso...</h3>
                <p>Si esta pantalla no desaparece, es posible que tu cuenta no tenga un rol asignado correctamente.</p>
              </div>
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
            />
            <motion.div
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <Bell size={48} color="#e74c3c" className="animate-bounce" />
              <p className="modal-titulo">
                Hora de la dosis: <br/><strong>{modalData.nombre}</strong>
              </p>
              <p style={{ color: '#666', marginTop: '-10px', marginBottom: '20px' }}>
                Dosis: {modalData.dosis}
              </p>

              <div className="modal-actions">
                <button
                  className="btn btn-success"
                  onClick={() => registrarToma('tomado')}
                  style={{ background: '#2ecc71', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <CheckCircle2 size={18} /> Tomado
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => registrarToma('omitido')}
                  style={{ background: '#e74c3c', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <XCircle size={18} /> Omitido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MENÚ INFERIOR SOLO VISIBLE PARA PACIENTES */}
      {userData?.rol === 'paciente' && (
        <nav className="bottom-nav">
          <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <Home size={22} /><span className="nav-label">Inicio</span>
          </button>
          <button className={`nav-item ${activeTab === 'recordatorios' ? 'active' : ''}`} onClick={() => setActiveTab('recordatorios')}>
            <Pill size={22} /><span className="nav-label">Recordatorios</span>
          </button>
          <button className={`nav-item ${activeTab === 'historial' ? 'active' : ''}`} onClick={() => setActiveTab('historial')}>
            <ClipboardList size={22} /><span className="nav-label">Historial</span>
          </button>
        </nav>
      )}
    </div>
  );
}

export default App;