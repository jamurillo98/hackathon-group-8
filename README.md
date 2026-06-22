# ACU IT Hackathon – Group 8  
Virtual Client Interaction Web App  
Prototype for practising real‑world client/patient conversations in a safe virtual environment.

---

## 🚀 Overview
This project is a browser‑based prototype that allows students to:
- Enter a scenario (e.g., patient case, client issue)
- Interact with a virtual figurine/client
- See themselves via the device camera
- Speak naturally to the virtual client
- Record the session (up to 30 minutes)
- Download the recording for review

This prototype is built for the ACU IT Hackathon (23 June 2026).

---

## 🧩 Tech Stack
- **Frontend:** HTML / JS / (React or Vite depending on final setup)
- **3D/Scene:** Three.js or HTML Canvas
- **Camera & Recording:** WebRTC + MediaRecorder API
- **AI Dialogue:** LLM prompts or rule‑based responses

---

## 📁 Project Structure

src/
ui/        → Scenario input + UI components (M2)
scene/     → Figurines, camera feed, animations (M3)
ai/        → Dialogue engine + scenario logic (M4)
group-8/     → Demo video, technical explanation, reflection

---

## 👥 Team Roles

- **M1 – Tech Lead / Integrator**  
  Architecture, glue code, recording pipeline, final integration.

- **M2 – Frontend/UI Developer**  
  Scenario input, layout, user experience.

- **M3 – 3D/Interaction Developer**  
  Figurines, scene rendering, camera integration.

- **M4 – AI/Dialogue Engineer**  
  Scenario → behaviour logic, LLM prompts, TTS responses.

---

## 🌿 Branch Workflow

### Main branches
- `main` → stable, demo‑ready  
- `dev` → integration branch for all work

### Feature branches
Each member works on their own branch:

feature/m1-integration
feature/m2-ui
feature/m3-scene
feature/m4-ai

### Pull Request Rules
- Open PR → `dev`
- Include: what changed, how to test, files touched
- At least one reviewer before merge

---

## ▶️ Running the Project (Local)

npm install
npm run dev

Then open the local URL shown in the terminal.

---

## 🎥 Deliverables (Hackathon Requirements)

All final deliverables go in:

group-8/

This includes:
- `demo.mp4` (3‑minute demo)
- `tech-explain.md` (how scenario input drives the environment)
- `reflection.md` (educational impact)

---

## 📌 Notes
This is a prototype built under hackathon constraints.  
Functionality focuses on demonstrating:
- Scenario‑driven interaction  
- Virtual environment  
- Camera integration  
- Recording + download  
- Basic AI‑driven responses  

