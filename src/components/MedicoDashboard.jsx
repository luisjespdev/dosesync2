import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, set } from 'firebase/database'; // Importamos 'set' para guardar la nota

export default function MedicoDashboard({ userData }) {
  const [reportes, setReportes] = useState([]);
  const [nota, setNota] = useState(""); // Estado para escribir la nota

  // 1. Escuchar reportes de pacientes (Tu código actual)
  useEffect(() => {
    if (!userData?.miCodigoMedico) return;

    const reportesRef = ref(db, `reportesMedicos/${userData.miCodigoMedico}`);
    
    const unsubscribe = onValue(reportesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const listaReportes = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setReportes(listaReportes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
      } else {
        setReportes([]);
      }
    });

    return () => unsubscribe();
  }, [userData]);

  // 2. FUNCIÓN NUEVA: Enviar nota a los pacientes
  const enviarNota = async () => {
    if (!nota.trim() || !userData?.miCodigoMedico) return;
    
    try {
      // Guardamos la nota en una ruta que el paciente también conoce
      const notaRef = ref(db, `notasMedicos/${userData.miCodigoMedico}`);
      await set(notaRef, {
        mensaje: nota,
        fecha: new Date().toISOString()
      });
      alert("¡Nota enviada a tus pacientes!");
      setNota(""); // Limpiar el campo tras enviar
    } catch (error) {
      console.error("Error al enviar nota:", error);
      alert("No se pudo enviar la nota.");
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="nurse-code-card">
        <h3>Tu Código de Médico</h3>
        <strong className="nurse-code-text">{userData.miCodigoMedico}</strong>
        
        {/* SECCIÓN NUEVA: Panel de Comunicación */}
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
          <h4>Enviar Indicación Médica</h4>
          <textarea 
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Escribe una instrucción para tus pacientes vinculados..."
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '8px', 
              border: '1px solid #ccc',
              minHeight: '80px',
              fontFamily: 'inherit'
            }}
          />
          <button 
            className="btn btn-primary" 
            onClick={enviarNota}
            style={{ marginTop: '10px', width: '100%' }}
          >
            Publicar Nota para Pacientes
          </button>
        </div>
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