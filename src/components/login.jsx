import { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import logo from '/public/img/logo.png';

// IMPORTACIÓN CORRECTA: Vite procesará esta imagen para que funcione en GitHub Pages
import logo from '/public/img/logo.png'; 

import { User, Mail, Lock, Stethoscope } from 'lucide-react';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
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
    
    if (isRegistering && !nombreUsuario.trim()) {
      alert("Por favor, ingresa tu nombre completo.");
      return;
    }
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
      
      let dataToSave = { 
        nombreUsuario: nombreUsuario.trim(),
        email: email, 
        rol: rol,
        uid: user.uid 
      };

      if (rol === 'enfermero') {
        dataToSave.miCodigoMedico = "MED-" + Math.random().toString(36).substring(2, 6).toUpperCase();
      } else {
        dataToSave.codigoVinculado = codigoMedico.toUpperCase();
      }

      await set(ref(db, 'usuarios/' + user.uid), dataToSave);
      
      alert(`¡Bienvenido a DoseSync, ${nombreUsuario}!`);
    } catch (error) {
      alert("Error al registrar: " + error.message);
    }
  };

  return (
    <section className="login-section">
      <div className="login-card">
        <div className="logo-container small">
          {/* CAMBIO CLAVE: Usamos la variable {logo} en lugar de la ruta "/img/logo.png" */}
          <img 
            src={logo} 
            alt="DoseSync Logo" 
            className="logo-img small" 
            width="80" 
            height="54" 
          />
          <div className="logo small">DoseSync</div>
        </div>
        <h1>{isRegistering ? "Crear Cuenta" : "Iniciar sesión"}</h1>
        
        <form className="form" onSubmit={isRegistering ? handleRegister : handleLogin}>
          <label>Ingresar como:</label>
          <select value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value="paciente">Paciente</option>
            <option value="enfermero">Enfermero / Médico</option>
          </select>

          {isRegistering && (
            <>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <User size={14} /> Nombre Completo
              </label>
              <input 
                type="text" 
                value={nombreUsuario} 
                onChange={(e) => setNombreUsuario(e.target.value)} 
                required 
                placeholder="Ej. Juan Pérez" 
              />
            </>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Mail size={14} /> Email
          </label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            placeholder="tu@email.com" 
          />
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Lock size={14} /> Contraseña
          </label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            placeholder="Mínimo 6 letras" 
          />
          
          {rol === 'paciente' && isRegistering && (
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Stethoscope size={14} /> Código de tu Médico
              </label>
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