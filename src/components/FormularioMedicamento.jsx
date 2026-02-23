import { useState } from 'react';
import { db, auth } from '../firebase';
import { ref, push, set } from 'firebase/database'; // Importaciones para Realtime Database

export default function FormularioMedicamento() {
  const [nombre, setNombre] = useState('');
  const [dosis, setDosis] = useState('');
  const [hora, setHora] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Verificamos que el usuario esté autenticado
    if (!auth.currentUser) {
      alert("Debes iniciar sesión primero.");
      return;
    }

    try {
      const uid = auth.currentUser.uid;
      
      // Creamos una referencia a la "carpeta" de medicamentos del usuario
      const medsRef = ref(db, `medicamentos/${uid}`);
      
      // push() genera un ID único automáticamente (como el ID de documento en Firestore)
      const nuevoMedRef = push(medsRef);

      await set(nuevoMedRef, {
        nombre: nombre.trim(),
        dosis: dosis.trim(),
        hora: hora,
        creadoEn: Date.now()
      });

      // Limpiar el formulario
      setNombre('');
      setDosis('');
      setHora('');
      alert("¡Medicamento guardado con éxito!");
      
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al conectar con Realtime Database: " + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form form-card">
      <label htmlFor="med-nombre">Nombre del Medicamento</label>
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
        Añadir Recordatorio
      </button>
    </form>
  );
}