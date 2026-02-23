import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database'; // Importaciones de Realtime
import FormularioMedicamento from './FormularioMedicamento';

export default function PacienteDashboard({ userData, activeTab, dispararAlarma }) {
  const [medicamentos, setMedicamentos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const timeoutsRef = useRef({});

  useEffect(() => {
    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;

    // 1. Escuchar MEDICAMENTOS en Realtime Database
    const medsRef = ref(db, `medicamentos/${uid}`);
    const unsubMed = onValue(medsRef, (snapshot) => {
      const data = snapshot.val();
      const listaMeds = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      
      setMedicamentos(listaMeds);

      // Limpiar alarmas anteriores
      Object.values(timeoutsRef.current).forEach(clearTimeout);
      timeoutsRef.current = {};

      // Programar alarmas
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

    // 2. Escuchar HISTORIAL en Realtime Database
    // Nota: Para usar orderByChild, recuerda activar los .indexOn en las reglas de Firebase si es necesario
    const histRef = ref(db, `historial/${uid}`);
    const unsubHis = onValue(histRef, (snapshot) => {
      const data = snapshot.val();
      const listaHis = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      
      // Ordenar por fecha (descendente) manualmente ya que RTDB ordena ascendente
      setHistorial(listaHis.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
    });

    return () => { 
      unsubMed(); 
      unsubHis(); 
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, [dispararAlarma]);

  return (
    <div>
      {/* PESTAÑA: INICIO */}
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

      {/* PESTAÑA: RECORDATORIOS */}
      {activeTab === 'recordatorios' && (
        <>
          <h2>Gestionar Medicamentos</h2>
          <FormularioMedicamento />
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