import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, query, orderByChild } from 'firebase/database';

export default function MedicoDashboard({ userData }) {
  const [reportes, setReportes] = useState([]);

  useEffect(() => {
    // Si el médico no tiene código o no se ha cargado, no hacemos nada
    if (!userData?.miCodigoMedico) return;

    // Referencia a la carpeta de reportes específica de este médico
    const reportesRef = ref(db, `reportesMedicos/${userData.miCodigoMedico}`);
    
    // Escuchamos los cambios en tiempo real
    const unsubscribe = onValue(reportesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convertimos el objeto de Firebase en un array
        const listaReportes = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
        // Ordenamos por fecha de la más reciente a la más antigua
        setReportes(listaReportes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
      } else {
        setReportes([]);
      }
    });

    return () => unsubscribe();
  }, [userData]);

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="nurse-code-card">
        <h3>Tu Código de Médico</h3>
        <p>Compártelo con tus pacientes para ver sus actividades:</p>
        <strong className="nurse-code-text">{userData.miCodigoMedico}</strong>
      </div>

      <h2>Historial de Mis Pacientes</h2>
      <ul className="lista-medicamentos">
        {reportes.length === 0 ? (
          <li className="historial-empty">Aún no hay reportes de pacientes vinculados.</li>
        ) : (
          reportes.map(r => (
            <li key={r.id} className="medicamento-item">
              <div className="medicamento-info">
                <strong>{r.pacienteEmail}</strong>
                <span>{r.medicamento} ({r.hora})</span>
                <div className="info-subtext">
                  {new Date(r.fecha).toLocaleDateString()} - {new Date(r.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
              <span className={`estado ${r.estado}`}>
                {r.estado === 'tomado' ? '✅ Tomado' : '❌ Omitido'}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}