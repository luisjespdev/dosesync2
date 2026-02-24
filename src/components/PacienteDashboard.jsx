import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { ref, onValue, remove } from 'firebase/database'; 
import FormularioMedicamento from './FormularioMedicamento';

// 1. IMPORTACIÓN DE ICONOS PROFESIONALES
import { 
  Stethoscope, 
  Lightbulb, 
  Link, 
  Pencil, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Info 
} from 'lucide-react';

export default function PacienteDashboard({ userData, activeTab, dispararAlarma }) {
  const [medicamentos, setMedicamentos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [editando, setEditando] = useState(null); 
  const [notaDelMedico, setNotaDelMedico] = useState("Sin instrucciones nuevas.");
  const [datoAzar, setDatoAzar] = useState("");
  const timeoutsRef = useRef({});

  const datosCuriosos = [
    "Tomar agua suficiente ayuda a que tu cuerpo absorba mejor ciertos medicamentos.",
    "Mantener una rutina fija mejora la efectividad de tu tratamiento en un 40%.",
    "¿Sabías que algunos alimentos pueden interferir con tus medicinas? Consulta siempre a tu médico.",
    "Guardar tus medicamentos en un lugar fresco y seco ayuda a mantener su potencia.",
    "DoseSync te ayuda a mantener el control, pero tu constancia es la clave del éxito."
  ];

  useEffect(() => {
    if (!auth.currentUser) return;
    if (activeTab === 'home') {
      const indice = Math.floor(Math.random() * datosCuriosos.length);
      setDatoAzar(datosCuriosos[indice]);
    }

    if (userData?.codigoVinculado) {
      const notaRef = ref(db, `notasMedicos/${userData.codigoVinculado}`);
      const unsubNota = onValue(notaRef, (snapshot) => {
        const data = snapshot.val();
        if (data) setNotaDelMedico(data.mensaje);
      });
      return () => unsubNota();
    }
  }, [activeTab, userData?.codigoVinculado]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const medsRef = ref(db, `medicamentos/${uid}`);
    const unsubMed = onValue(medsRef, (snapshot) => {
      const data = snapshot.val();
      const listaMeds = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      setMedicamentos(listaMeds);

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
    <div>
      {/* PESTAÑA: INICIO (HOME) */}
      {activeTab === 'home' && (
        <>
          <h2>Bienvenido a DoseSync</h2>
          
          <div className="curiosidad-card" style={{ borderLeft: '5px solid #e74c3c', marginBottom: '1rem' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Stethoscope size={18} /> Indicación Médica
            </h4>
            <p style={{ fontStyle: 'italic' }}>"{notaDelMedico}"</p>
          </div>

          <div className="curiosidad-card">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lightbulb size={18} /> ¿Sabías que...?
            </h4>
            <p>{datoAzar}</p>
          </div>

          <div className="curiosidad-card" style={{marginTop: '1rem', opacity: 0.8}}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link size={18} /> Estado de Vinculación
            </h4>
            <p>Conectado con el código: <strong>{userData?.codigoVinculado || 'Sin vincular'}</strong></p>
          </div>
        </>
      )}

      {/* PESTAÑA: RECORDATORIOS */}
      {activeTab === 'recordatorios' && (
        <>
          <h2>Gestionar Medicamentos</h2>
          <FormularioMedicamento 
            medicamentoAEditar={editando} 
            alTerminar={() => setEditando(null)} 
          />
          <h3>Mis Medicamentos</h3>
          <ul className="lista-medicamentos">
            {medicamentos.length === 0 ? (
              <p className="historial-empty">No tienes medicamentos guardados.</p>
            ) : (
              medicamentos.map(m => (
                <li key={m.id} className="medicamento-item">
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
        </>
      )}

      {/* PESTAÑA: HISTORIAL */}
      {activeTab === 'historial' && (
        <>
          <h2>Historial de Tomas</h2>
          <ul className="lista-historial">
            {historial.length === 0 ? (
               <p className="historial-empty">Aún no hay registros en tu historial.</p>
            ) : (
              historial.map(h => (
                <li key={h.id} className="historial-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Info size={16} color="#666" />
                    <div>
                      <strong>{h.medicamento}</strong>
                      <br/>
                      <small style={{color: '#666'}}>Dosis: {h.dosis || 'N/A'}</small>
                      <br/>
                      <span>{h.hora}</span>
                    </div>
                  </div>
                  <span className={`estado ${h.estado}`}>
                    {h.estado === 'tomado' ? (
                      <><CheckCircle2 size={14} /> Tomado</>
                    ) : (
                      <><XCircle size={14} /> Omitido</>
                    )}
                  </span>
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  );
}