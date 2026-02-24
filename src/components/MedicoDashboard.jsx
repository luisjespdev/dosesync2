import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, set } from 'firebase/database';

// 1. IMPORTACIÓN DE ICONOS PROFESIONALES
import { 
  Send, 
  Users, 
  MessageSquare, 
  Hash, 
  CheckCircle2, 
  XCircle, 
  Clock 
} from 'lucide-react';

export default function MedicoDashboard({ userData }) {
  const [reportes, setReportes] = useState([]);
  const [nota, setNota] = useState("");

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

  const enviarNota = async () => {
    if (!nota.trim() || !userData?.miCodigoMedico) return;
    
    try {
      const notaRef = ref(db, `notasMedicos/${userData.miCodigoMedico}`);
      await set(notaRef, {
        mensaje: nota,
        fecha: new Date().toISOString()
      });
      alert("¡Nota enviada a tus pacientes!");
      setNota("");
    } catch (error) {
      console.error("Error al enviar nota:", error);
      alert("No se pudo enviar la nota.");
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="nurse-code-card">
        <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Hash size={20} color="#3498db" /> Tu Código de Médico
        </h3>
        <strong className="nurse-code-text">{userData.miCodigoMedico}</strong>
        
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <MessageSquare size={18} color="#2ecc71" /> Enviar Indicación Médica
          </h4>
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
              fontFamily: 'inherit',
              marginBottom: '10px'
            }}
          />
          <button 
            className="btn btn-primary" 
            onClick={enviarNota}
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px' 
            }}
          >
            <Send size={16} /> Publicar Nota para Pacientes
          </button>
        </div>
      </div>

      <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '2rem' }}>
        <Users size={24} /> Historial de Mis Pacientes
      </h2>

      <ul className="lista-medicamentos">
        {reportes.length === 0 ? (
          <li className="historial-empty">Aún no hay reportes de pacientes vinculados.</li>
        ) : (
          reportes.map(r => (
            <li key={r.id} className="medicamento-item">
              <div className="medicamento-info">
                <strong>{r.pacienteEmail}</strong>
                <span>{r.medicamento} - <small>Dosis: {r.dosis || 'N/A'}</small> ({r.hora})</span>
                <div className="info-subtext" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={12} />
                  {new Date(r.fecha).toLocaleDateString()} - {new Date(r.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
              <span className={`estado ${r.estado}`} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {r.estado === 'tomado' ? (
                  <><CheckCircle2 size={16} /> Tomado</>
                ) : (
                  <><XCircle size={16} /> Omitido</>
                )}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}