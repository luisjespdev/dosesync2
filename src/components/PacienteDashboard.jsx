import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { ref, onValue, remove } from 'firebase/database'; 
import FormularioMedicamento from './FormularioMedicamento';

export default function PacienteDashboard({ userData, activeTab, dispararAlarma }) {
  const [medicamentos, setMedicamentos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [editando, setEditando] = useState(null); // Estado para edición
  const timeoutsRef = useRef({});

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
          dispararAlarma(m.nombre, m.hora);
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

  // FUNCIÓN PARA ELIMINAR
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
      {activeTab === 'home' && (
        <>
          <h2>Bienvenido a DoseSync</h2>
          <div className="curiosidad-card">
            <h4>Estado de Vinculación</h4>
            <p>Conectado con el código: <strong>{userData?.codigoVinculado || 'Sin vincular'}</strong></p>
          </div>
          <div className="curiosidad-card" style={{marginTop: '1rem'}}>
            <h4>Dato curioso</h4>
            <p>Tomar agua suficiente ayuda a que tu cuerpo absorba mejor ciertos medicamentos.</p>
          </div>
        </>
      )}

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
                    <button className="btn-icon" onClick={() => setEditando(m)}>✏️</button>
                    <button className="btn-icon" onClick={() => eliminarMedicamento(m.id)}>🗑️</button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </>
      )}

      {activeTab === 'historial' && (
        <>
          <h2>Historial de Tomas</h2>
          <ul className="lista-historial">
            {historial.length === 0 ? (
               <p className="historial-empty">Aún no hay registros en tu historial.</p>
            ) : (
              historial.map(h => (
                <li key={h.id} className="historial-item">
                  <div><strong>{h.medicamento}</strong><br/><span>{h.hora}</span></div>
                  <span className={`estado ${h.estado}`}>{h.estado === 'tomado' ? '✅ Tomado' : '❌ Omitido'}</span>
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  );
}