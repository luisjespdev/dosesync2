# 💊 DoseSync  
<img src="./public/img/logo.png" width="70" align="right" />

> **Gestión Inteligente de Medicamentos**  
> Plataforma web para mejorar la adherencia terapéutica, conectando pacientes y profesionales de la salud en tiempo real bajo una arquitectura segura y moderna.

---

## 🧩 Tecnologías

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase&logoColor=ffca28)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

---

## 📌 Descripción

**DoseSync** es una aplicación web diseñada para combatir el olvido en los tratamientos médicos.  
Permite que los pacientes reciban alertas precisas sobre sus medicamentos, mientras los profesionales de la salud supervisan el cumplimiento de forma remota y segura.

---

## 🚀 Características

### 👤 Para Pacientes
- ✔ Gestión intuitiva de dosis, horarios y recordatorios.  
- 🔔 Alarmas inteligentes con confirmación: **Tomado / Omitido**.  
- 📊 Historial visual con estados semánticos (Verde / Rojo).  
- 📨 Recepción de instrucciones médicas personalizadas.  
- 🕒 Acuse de recibo con marca de tiempo exacta.

---

### 🩺 Para Profesionales
- 📋 Dashboard centralizado para múltiples pacientes.  
- 🔗 Vinculación mediante código médico único.  
- ⏱ Monitorización en tiempo real del cumplimiento.  
- 🔐 Mensajería privada y segura.  
- 👁 Indicadores de lectura con iconos visuales.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React.js (v19) + Vite |
| Backend / DB | Firebase Realtime Database (NoSQL) |
| Autenticación | Firebase Authentication |
| Animaciones | Framer Motion |
| Iconos | Lucide React |
| Diseño | CSS3 (Mobile First) |

---

## 📂 Estructura del Proyecto

```bash
src/
├── components/
│   ├── login.jsx                # Gestión de acceso, registro y roles
│   ├── PacienteDashboard.jsx    # Vista de usuario, alarmas y consejos dinámicos
│   ├── MedicoDashboard.jsx      # Panel de auditoría médica y mensajería
│   └── FormularioMedicamento.jsx # Gestión de tratamientos (CRUD)
├── firebase.js                  # Configuración central del SDK de Firebase
├── App.jsx                      # Orquestador de rutas, alarmas y estado global
└── main.jsx                     # Punto de entrada de la aplicación
```

---

## 🔒 Seguridad y Privacidad

DoseSync prioriza la integridad de los datos mediante una arquitectura de aislamiento por UID (**Unique Identifier**):

- **Acceso restringido:**  
  Solo el médico con el código de vinculación correcto tiene visibilidad sobre el paciente.

- **Nodos seguros:**  
  Las notas privadas se almacenan en rutas únicas:  
  `notasPrivadas/UID`

- **Privacidad:**  
  Historiales persistentes y protegidos para el cumplimiento normativo de salud.

---

## ⚙️ Instalación y Configuración

### 1️⃣ Clonar repositorio
```bash
git clone https://github.com/luisjespdev/dosesync2.git
```

### 2️⃣ Instalar dependencias
```bash
npm install
```

### 3️⃣ Configurar Firebase

Editar `src/firebase.js`:

```js
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_DOMAIN",
  databaseURL: "TU_URL",
  projectId: "TU_PROJECT_ID",
};
```

### 4️⃣ Ejecutar proyecto
```bash
npm run dev
```

---

## 👨‍💻 Autor

**Luis Espinal (LuisEspDev)**  
Full Stack Developer  
📅 Año: 2026

---

<p align="center">
© 2026 DoseSync - LuisEspDev. Todos los derechos reservados.
</p>
