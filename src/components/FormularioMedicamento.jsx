import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { ref, push, set, update } from 'firebase/database'; 

export default function FormularioMedicamento({ medicamentoAEditar, alTerminar }) {
  const [nombre, setNombre] = useState('');
  const [dosis, setDosis] = useState('');
  const [hora, setHora] = useState('');

  // Sincronizar campos cuando se pulsa el botón de editar
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
        // LÓGICA DE ACTUALIZACIÓN
        const medRef = ref(db, `medicamentos/${uid}/${medicamentoAEditar.id}`);
        await update(medRef, {
          nombre: nombre.trim(),
          dosis: dosis.trim(),
          hora: hora,
        });
        alert("¡Medicamento actualizado!");
      } else {
        // LÓGICA DE CREACIÓN
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

      // Limpiar y avisar al dashboard
      if (alTerminar) alTerminar();
      setNombre(''); setDosis(''); setHora('');
      
    } catch (error) {
      console.error("Error:", error);
      alert("Error al conectar con la base de datos.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form form-card">
      <label htmlFor="med-nombre">{medicamentoAEditar ? "Editando:" : "Nombre del Medicamento"}</label>
      <input 
        type="text" 
        id="med-nombre" 
        value={nombre} 
        onChange={(e) => setNombre(e.target.value)} 
        required 
        placeholder="Ej. Paracetamol" 
      />

      <label htmlFor="med-dosis">Dosis</label>
      <input 
        type="text" 
        id="med-dosis" 
        value={dosis} 
        onChange={(e) => setDosis(e.target.value)} 
        required 
        placeholder="Ej. 1 tableta de 500mg" 
      />

      <label htmlFor="med-hora">Hora de la toma</label>
      <input 
        type="time" 
        id="med-hora" 
        value={hora} 
        onChange={(e) => setHora(e.target.value)} 
        required 
      />

      <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
        {medicamentoAEditar ? "Guardar Cambios" : "Añadir Recordatorio"}
      </button>

      {medicamentoAEditar && (
        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={alTerminar}
          style={{ marginTop: '0.5rem' }}
        >
          Cancelar Edición
        </button>
      )}
    </form>
  );
}