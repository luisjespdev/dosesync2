import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, set } from 'firebase/database';

// IMPORTACIÓN DE ICONOS PROFESIONALES
import { 
  Send, 
  Users, 
  MessageSquare, 
  Hash, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ChevronDown,
  ChevronRight,
  UserCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function MedicoDashboard({ userData }) {
  const [reportesAgrupados, setReportesAgrupados] = useState({});
  const [pacienteAbierto, setPacienteAbierto] = useState(null); 
  const [notasPorPaciente, setNotasPorPaciente] = useState({});
  const [datosNotas, setDatosNotas] = useState({}); // Rastrear leída y fecha de lectura

  useEffect(() => {
    if (!userData?.miCodigoMedico) return;

    const reportesRef = ref(db, `reportesMedicos/${userData.miCodigoMedico}`);
    
    const unsubscribe = onValue(reportesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const listaRaw = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        // --- AGRUPACIÓN POR UID DEL PACIENTE ---
        const agrupados = listaRaw.reduce((acc, curr) => {
          const uid = curr.pacienteUID;
          if (!uid) return acc; // Ignorar reportes sin UID (antiguos)

          if (!acc[uid]) {
            acc[uid] = {
              nombre: curr.pacienteNombre,
              email: curr.pacienteEmail,
              tomas: []
            };
          }
          acc[uid].tomas.push(curr);
          return acc;
        }, {});

        // Ordenar tomas por fecha descendente
        Object.keys(agrupados).forEach(uid => {
          agrupados[uid].tomas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        });

        setReportesAgrupados(agrupados);

        // --- ESCUCHAR ESTADO DE CADA NOTA PRIVADA ---
        Object.keys(agrupados).forEach(uid => {
          const notaRef = ref(db, `notasPrivadas/${uid}`);
          onValue(notaRef, (notaSnap) => {
            const notaData = notaSnap.val();
            setDatosNotas(prev => ({
              ...prev,
              [uid]: notaData ? notaData : { leida: true } // Si no hay nota, se considera "al día"
            }));
          });
        });
      } else {
        setReportesAgrupados({});
      }
    });

    return () => unsubscribe();
  }, [userData]);

  const enviarNotaIndividual = async (uid, nombre) => {
    const texto = notasPorPaciente[uid];
    if (!texto?.trim()) return;
    
    try {
      await set(ref(db, `notasPrivadas/${uid}`), {
        mensaje: texto,
        fechaEnvio: new Date().toISOString(),
        leida: false,
        fechaLectura: null // Se resetea al enviar nueva indicación
      });
      alert(`Nota enviada a ${nombre}`);
      setNotasPorPaciente(prev => ({ ...prev, [uid]: "" }));
    } catch (error) {
      console.error("Error al enviar nota:", error);
      alert("No se pudo enviar la nota.");
    }
  };

  return (
    <div style={{ textAlign: 'center', paddingBottom: '2rem' }}>
      <div className="nurse-code-card">
        <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Hash size={20} color="#3498db" /> Código Médico
        </h3>
        <strong className="nurse-code-text">{userData.miCodigoMedico}</strong>
      </div>

      <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '2rem' }}>
        <Users size={24} /> Mis Pacientes
      </h2>

      <div className="lista-agrupada" style={{ marginTop: '1rem' }}>
        {Object.keys(reportesAgrupados).length === 0 ? (
          <p className="historial-empty">No hay pacientes con actividad registrada.</p>
        ) : (
          Object.keys(reportesAgrupados).map(uid => (
            <div key={uid} style={{ marginBottom: '10px', textAlign: 'left' }}>
              
              {/* CABECERA DEL PACIENTE */}
              <div 
                onClick={() => setPacienteAbierto(pacienteAbierto === uid ? null : uid)} 
                style={{ 
                  background: 'white', padding: '15px', borderRadius: '12px', 
                  display: 'flex', justifyContent: 'space-between', cursor: 'pointer', 
                  boxShadow: 'var(--shadow)', 
                  border: datosNotas[uid]?.leida === false ? '2px solid #e74c3c' : '1px solid #eee' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <UserCircle size={28} color="#3498db" />
                  <div>
                    <strong style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {reportesAgrupados[uid].nombre}
                      {datosNotas[uid]?.leida === false && (
                        <span style={{ width: '8px', height: '8px', background: '#e74c3c', borderRadius: '50%' }}></span>
                      )}
                    </strong>
                    <small style={{ color: '#64748b' }}>{reportesAgrupados[uid].email}</small>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {datosNotas[uid]?.leida === false ? (
                    <EyeOff size={18} color="#e74c3c" title="Pendiente de lectura" />
                  ) : (
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Eye size={18} color="#2ecc71" title="Visto" />
                      {datosNotas[uid]?.fechaLectura && (
                        <small style={{ fontSize: '0.65rem', color: '#95a5a6' }}>
                          Visto: {new Date(datosNotas[uid].fechaLectura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </small>
                      )}
                    </div>
                  )}
                  {pacienteAbierto === uid ? <ChevronDown /> : <ChevronRight />}
                </div>
              </div>

              {/* CUERPO DEL PACIENTE (ACORDEÓN) */}
              {pacienteAbierto === uid && (
                <div style={{ background: '#fcfcfc', border: '1px solid #eee', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '15px' }}>
                  
                  {/* SECCIÓN ENVIAR NOTA */}
                  <div style={{ marginBottom: '20px', padding: '10px', background: '#fff', borderRadius: '8px', border: '1px solid #eee' }}>
                    <h5 style={{ color: '#2ecc71', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MessageSquare size={14} /> Nueva indicación para {reportesAgrupados[uid].nombre}:
                    </h5>
                    <textarea 
                      value={notasPorPaciente[uid] || ""} 
                      onChange={(e) => setNotasPorPaciente(prev => ({ ...prev, [uid]: e.target.value }))} 
                      placeholder="Escribe una instrucción privada..." 
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', minHeight: '60px', fontFamily: 'inherit' }} 
                    />
                    <button 
                      className="btn btn-success btn-sm" 
                      onClick={() => enviarNotaIndividual(uid, reportesAgrupados[uid].nombre)} 
                      style={{ marginTop: '8px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}
                    >
                      <Send size={14} /> Enviar
                    </button>
                  </div>

                  <h5 style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '10px' }}>Historial de tomas:</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {reportesAgrupados[uid].tomas.map(r => (
                      <div key={r.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '10px', 
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #f0f0f0'
                      }}>
                        <div style={{ fontSize: '0.9rem' }}>
                          <strong style={{ display: 'block', color: '#2c3e50' }}>{r.medicamento}</strong> 
                          <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '2px' }}>
                            <span style={{ fontWeight: '600' }}>Dosis: {r.dosis || 'N/A'}</span> <br/>
                            <Clock size={12} style={{ verticalAlign: 'middle' }} /> {r.hora} - {new Date(r.fecha).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '5px', 
                          fontWeight: 'bold',
                          color: r.estado === 'tomado' ? '#2ecc71' : '#e74c3c' 
                        }}>
                          {r.estado === 'tomado' ? (
                            <><CheckCircle2 size={18} /> Tomado</>
                          ) : (
                            <><XCircle size={18} /> Omitido</>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}