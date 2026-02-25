import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { ref, onValue, remove, update } from 'firebase/database'; 
import FormularioMedicamento from './FormularioMedicamento';

// IMPORTACIÓN DE ICONOS PROFESIONALES
import { 
  Stethoscope, Lightbulb, Link, Pencil, Trash2, 
  CheckCircle2, XCircle, Info, Check, Clock 
} from 'lucide-react';

export default function PacienteDashboard({ userData, activeTab, dispararAlarma }) {
  const [medicamentos, setMedicamentos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [editando, setEditando] = useState(null); 
  const [notaDelMedico, setNotaDelMedico] = useState(null); 
  const [datoAzar, setDatoAzar] = useState("");
  const timeoutsRef = useRef({});

  const datosCuriosos = [
    "Tomar agua suficiente ayuda a que tu cuerpo absorba mejor ciertos medicamentos.",
    "Mantener una rutina fija mejora la efectividad de tu tratamiento en un 40%.",
    "¿Sabías que algunos alimentos pueden interferir con tus medicinas? Consulta siempre a tu médico.",
    "Guardar tus medicamentos en un lugar fresco y seco ayuda a mantener su potencia.",
    "DoseSync te ayuda a mantener el control, pero tu constancia es la clave del éxito.", 
    "Nunca compartas tus medicamentos con otras personas, cada tratamiento es único.", 
    "Si olvidas una dosis, no tomes el doble en la siguiente toma sin consultar a tu médico.", 
    "Poner una alarma diaria a la misma hora ayuda a crear un hábito saludable.", 
    "Verifica siempre la fecha de vencimiento antes de iniciar un nuevo frasco.", 
    "Hacer ejercicio ligero mejora la circulación y ayuda a la efectividad de algunos tratamientos."
];

  // EFECTO: Notas Médicas Privadas e Individuales
  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    if (activeTab === 'home') {
      const indice = Math.floor(Math.random() * datosCuriosos.length);
      setDatoAzar(datosCuriosos[indice]);
    }

    const notaPrivadaRef = ref(db, `notasPrivadas/${uid}`);
    const unsubNota = onValue(notaPrivadaRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setNotaDelMedico(data);
      } else {
        setNotaDelMedico({ mensaje: "Sin instrucciones nuevas.", leida: true });
      }
    });

    return () => unsubNota();
  }, [activeTab]);

  const confirmarLecturaNota = async () => {
    if (!auth.currentUser || !notaDelMedico) return;
    const uid = auth.currentUser.uid;
    try {
      await update(ref(db, `notasPrivadas/${uid}`), {
        leida: true,
        fechaLectura: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error al confirmar lectura");
    }
  };

  // EFECTO: Gestión de Medicamentos, Alarmas e Historial
  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    // Escuchar Medicamentos y programar Alarmas
    const medsRef = ref(db, `medicamentos/${uid}`);
    const unsubMed = onValue(medsRef, (snapshot) => {
      const data = snapshot.val();
      const listaMeds = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      setMedicamentos(listaMeds);

      // Limpiar timeouts previos
      Object.values(timeoutsRef.current).forEach(clearTimeout);
      timeoutsRef.current = {};

      listaMeds.forEach(m => {
        if (!m.hora) return;
        const now = new Date();
        const [hh, mm] = m.hora.split(':').map(Number);
        let next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0);
        if (next <= now) next.setDate(next.getDate() + 1);
        const delay = next - now;

        timeoutsRef.current[m.id] = setTimeout(() => {
          dispararAlarma(m.nombre, m.hora, m.dosis);
        }, delay);
      });
    });

    // Escuchar Historial
    const histRef = ref(db, `historial/${uid}`);
    const unsubHis = onValue(histRef, (snapshot) => {
      const data = snapshot.val();
      const listaHis = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      setHistorial(listaHis.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
    });

    return () => { 
      unsubMed(); unsubHis(); 
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, [dispararAlarma]);

  const eliminarMedicamento = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este recordatorio?")) {
      try {
        const uid = auth.currentUser.uid;
        await remove(ref(db, `medicamentos/${uid}/${id}`));
      } catch (error) {
        alert("Error al eliminar.");
      }
    }
  };

  return (
    <div className="dashboard-container">
      {/* PESTAÑA: INICIO (HOME) */}
      {activeTab === 'home' && (
        <div className="animate-in">
          <h2 className="welcome-title">Bienvenido a DoseSync</h2>
          
          <div className={`curiosidad-card medical-note ${notaDelMedico?.leida ? '' : 'unread'}`} 
               style={{ borderLeft: '5px solid #e74c3c', marginBottom: '1rem', position: 'relative' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Stethoscope size={18} /> Indicación Médica Personalizada
            </h4>
            <p style={{ fontStyle: 'italic', color: '#2c3e50' }}>
              "{notaDelMedico?.mensaje || "Cargando..."}"
            </p>
            
            {notaDelMedico?.mensaje && notaDelMedico.mensaje !== "Sin instrucciones nuevas." && !notaDelMedico.leida && (
               <button 
                 onClick={confirmarLecturaNota}
                 className="btn-confirm-read"
                 style={{ marginTop: '10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', background: '#2ecc71', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
               >
                 <Check size={14} /> Marcar como leída
               </button>
            )}
            {notaDelMedico?.leida && notaDelMedico.fechaLectura && notaDelMedico.mensaje !== "Sin instrucciones nuevas." && (
                <small style={{ fontSize: '0.65rem', color: '#7f8c8d', display: 'block', marginTop: '5px' }}>
                  Confirmado hoy a las {new Date(notaDelMedico.fechaLectura).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </small>
            )}
          </div>

          <div className="curiosidad-card info-card">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Lightbulb size={18} /> ¿Sabías que...?</h4>
            <p>{datoAzar}</p>
          </div>

          <div className="curiosidad-card vinculacion-card" style={{marginTop: '1rem', opacity: 0.8}}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Link size={18} /> Estado de Vinculación</h4>
            <p>Código Médico: <strong>{userData?.codigoVinculado || 'Sin vincular'}</strong></p>
          </div>
        </div>
      )}

      {/* PESTAÑA: RECORDATORIOS */}
      {activeTab === 'recordatorios' && (
        <div className="animate-in">
          <h2>Gestionar Medicamentos</h2>
          <FormularioMedicamento 
            medicamentoAEditar={editando} 
            alTerminar={() => setEditando(null)} 
          />
          <h3 style={{ marginTop: '1.5rem' }}>Mis Medicamentos</h3>
          <ul className="lista-medicamentos">
            {medicamentos.length === 0 ? (
              <p className="historial-empty">No tienes medicamentos guardados.</p>
            ) : (
              medicamentos.map(m => (
                <li key={m.id} className="medicamento-item card-shadow">
                  <div className="medicamento-info">
                    <strong>{m.nombre}</strong>
                    <span>{m.dosis} · {m.hora}</span>
                  </div>
                  <div className="medicamento-actions">
                    <button className="btn-icon" onClick={() => setEditando(m)}>
                      <Pencil size={18} color="#3498db" />
                    </button>
                    <button className="btn-icon" onClick={() => eliminarMedicamento(m.id)}>
                      <Trash2 size={18} color="#e74c3c" />
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* PESTAÑA: HISTORIAL */}
      {activeTab === 'historial' && (
        <div className="animate-in">
          <h2>Historial de Tomas</h2>
          <ul className="lista-historial">
            {historial.length === 0 ? (
              <p className="historial-empty">Aún no hay registros en tu historial.</p>
            ) : (
              historial.map(h => (
                <li key={h.id} className="historial-item card-shadow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Info size={18} color="#666" />
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ fontSize: '1rem' }}>{h.medicamento}</strong><br/>
                      <small style={{ color: '#444', fontWeight: 'bold' }}>Dosis: {h.dosis || 'N/A'}</small><br/>
                      
                      {h.motivoOmision && (
                        <small style={{ display: 'block', color: '#d35400', backgroundColor: '#fdf2e9', padding: '2px 5px', borderRadius: '4px', marginTop: '2px', fontStyle: 'italic' }}>
                          Nota: {h.motivoOmision}
                        </small>
                      )}
                      
                      <small style={{ color: '#888' }}>
                        <Clock size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                        {h.hora} - {new Date(h.fecha).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontWeight: 'bold', 
                    color: h.estado === 'tomado' ? '#2ecc71' : '#e74c3c',
                    fontSize: '0.9rem'
                  }}>
                    {h.estado === 'tomado' ? (
                      <><CheckCircle2 size={18} /> Tomado</>
                    ) : (
                      <><XCircle size={18} /> Omitido</>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

