import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { ref, push, set, update } from 'firebase/database'; 

// 1. IMPORTACIÓN DE ICONOS PROFESIONALES
import { Pill, Syringe, Clock, Save, PlusCircle, XCircle } from 'lucide-react';

export default function FormularioMedicamento({ medicamentoAEditar, alTerminar }) {
  const [nombre, setNombre] = useState('');
  const [dosis, setDosis] = useState('');
  const [hora, setHora] = useState('');

  useEffect(() => {
    if (medicamentoAEditar) {
      setNombre(medicamentoAEditar.nombre);
      setDosis(medicamentoAEditar.dosis);
      setHora(medicamentoAEditar.hora);
    } else {
      setNombre('');
      setDosis('');
      setHora('');
    }
  }, [medicamentoAEditar]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      alert("Debes iniciar sesión primero.");
      return;
    }

    try {
      const uid = auth.currentUser.uid;
      
      if (medicamentoAEditar) {
        const medRef = ref(db, `medicamentos/${uid}/${medicamentoAEditar.id}`);
        await update(medRef, {
          nombre: nombre.trim(),
          dosis: dosis.trim(),
          hora: hora,
        });
        alert("¡Medicamento actualizado!");
      } else {
        const medsRef = ref(db, `medicamentos/${uid}`);
        const nuevoMedRef = push(medsRef);
        await set(nuevoMedRef, {
          nombre: nombre.trim(),
          dosis: dosis.trim(),
          hora: hora,
          creadoEn: Date.now()
        });
        alert("¡Medicamento guardado!");
      }

      if (alTerminar) alTerminar();
      setNombre(''); setDosis(''); setHora('');
      
    } catch (error) {
      console.error("Error:", error);
      alert("Error al conectar con la base de datos.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form form-card">
      {/* SECCIÓN NOMBRE */}
      <label htmlFor="med-nombre" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Pill size={16} color="#3498db" />
        {medicamentoAEditar ? "Editando:" : "Nombre del Medicamento"}
      </label>
      <input 
        type="text" 
        id="med-nombre" 
        value={nombre} 
        onChange={(e) => setNombre(e.target.value)} 
        required 
        placeholder="Ej. Paracetamol" 
      />

      {/* SECCIÓN DOSIS */}
      <label htmlFor="med-dosis" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Syringe size={16} color="#9b59b6" />
        Dosis
      </label>
      <input 
        type="text" 
        id="med-dosis" 
        value={dosis} 
        onChange={(e) => setDosis(e.target.value)} 
        required 
        placeholder="Ej. 1 tableta de 500mg" 
      />

      {/* SECCIÓN HORA */}
      <label htmlFor="med-hora" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Clock size={16} color="#e67e22" />
        Hora de la toma
      </label>
      <input 
        type="time" 
        id="med-hora" 
        value={hora} 
        onChange={(e) => setHora(e.target.value)} 
        required 
      />

      {/* BOTÓN PRINCIPAL */}
      <button 
        type="submit" 
        className="btn btn-primary" 
        style={{ 
          marginTop: '0.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '8px' 
        }}
      >
        {medicamentoAEditar ? (
          <><Save size={18} /> Guardar Cambios</>
        ) : (
          <><PlusCircle size={18} /> Añadir Recordatorio</>
        )}
      </button>

      {/* BOTÓN CANCELAR */}
      {medicamentoAEditar && (
        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={alTerminar}
          style={{ 
            marginTop: '0.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px' 
          }}
        >
          <XCircle size={18} /> Cancelar Edición
        </button>
      )}
    </form>
  );
}