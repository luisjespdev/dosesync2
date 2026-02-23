import { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database'; // Importaciones de Realtime Database

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('paciente');
  const [codigoMedico, setCodigoMedico] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert("Error: Verifica tu correo o contraseña.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || password.length < 6) {
      alert("Ingresa un email válido y una contraseña de al menos 6 caracteres.");
      return;
    }
    if (rol === 'paciente' && !codigoMedico) {
      alert("Como paciente, debes ingresar el código proporcionado por tu médico.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Estructura de datos para Realtime Database
      let dataToSave = { 
        email: email, 
        rol: rol,
        uid: user.uid 
      };

      if (rol === 'enfermero') {
        // Generamos el código único para el médico
        dataToSave.miCodigoMedico = "MED-" + Math.random().toString(36).substring(2, 6).toUpperCase();
      } else {
        dataToSave.codigoVinculado = codigoMedico.toUpperCase();
      }

      // Guardamos en la ruta 'usuarios/id_del_usuario'
      await set(ref(db, 'usuarios/' + user.uid), dataToSave);
      
      alert("¡Cuenta de EstarTech creada con éxito!");
    } catch (error) {
      alert("Error al registrar: " + error.message);
    }
  };

  return (
    <section className="login-section">
      <div className="login-card">
        <div className="logo-container small">
          <img src="/img/logo.png" alt="DoseSync Logo" className="logo-img small" width="80" height="54" />
          <div className="logo small">DoseSync</div>
        </div>
        <h1>{isRegistering ? "Crear Cuenta" : "Iniciar sesión"}</h1>
        
        <form className="form" onSubmit={isRegistering ? handleRegister : handleLogin}>
          <label>Ingresar como:</label>
          <select value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value="paciente">Paciente</option>
            <option value="enfermero">Enfermero / Médico</option>
          </select>

          <label>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            placeholder="tu@email.com" 
          />
          
          <label>Contraseña</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            placeholder="Mínimo 6 letras" 
          />
          
          {rol === 'paciente' && isRegistering && (
            <div>
              <label>Código de tu Médico</label>
              <input 
                type="text" 
                value={codigoMedico} 
                onChange={(e) => setCodigoMedico(e.target.value)} 
                placeholder="Ej. MED-XXXX" 
                required
              />
            </div>
          )}
          
          <div className="login-actions">
            {!isRegistering ? (
              <>
                <button type="submit" className="btn btn-primary">Entrar</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsRegistering(true)}>Registrar</button>
              </>
            ) : (
              <>
                <button type="submit" className="btn btn-primary">Confirmar Registro</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsRegistering(false)}>Volver</button>
              </>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
