// Datos mock para desarrollo - Listos para conexión con API

export const OBJECTIVES = [
  'pérdida de peso',
  'fuerza',
  'hipertrofia',
  'resistencia',
  'movilidad',
  'personalizado'
];

export const LEVELS = ['principiante', 'intermedio', 'avanzado'];

export const ROUTINE_STATUS = ['borrador', 'activa', 'archivada'];

export const STIMULUS_TYPES = ['fuerza', 'resistencia', 'quema de grasa', 'mixto'];

export const MUSCLE_GROUPS = [
  'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps',
  'Cuádriceps', 'Isquiotibiales', 'Glúteos', 'Pantorrillas', 'Piernas',
  'Abdominales', 'Lumbares', 'Core',
  'Cardio', 'HIIT', 'Movilidad', 'Deportes',
];
export const EQUIPMENT = [
  'Barra', 'Mancuernas', 'Kettlebell', 'Máquina', 'Peso corporal',
  'Bandas', 'TRX', 'Cuerda', 'Bicicleta', 'Otro',
];

// === FEATURE GATING: componentes reales y flags por plan ===
// Módulos: Dashboard | Calendario | Alumnos | Seguimiento peso | Rutinas | Biblioteca | Consultas
// Gating: maxAlumnos, hasWeightTracking, hasLibrary, hasAdvancedWeight

export const SUBSCRIPTION_PLANS = {
  basico: {
    id: 'basico', name: 'Básico', price: 4.99, maxAlumnos: 10,
    hasWeightTracking: false, hasLibrary: false, hasAdvancedWeight: false,
    tagline: 'Lo esencial: alumnos, rutinas y calendario',
    features: [
      'Hasta 10 alumnos activos',
      'Gestión de alumnos y ficha por cliente',
      'Creación y asignación de rutinas',
      'Calendario de entrenamientos',
      'Biblioteca global de ejercicios (solo lectura)',
      'Exporte PDF de rutinas',
      'Mensajería coach-cliente'
    ],
    noIncludes: ['Seguimiento de peso', 'Biblioteca personal', 'Filtros avanzados en gráficos']
  },
  pro: {
    id: 'pro', name: 'Pro', price: 19.99, maxAlumnos: 30,
    hasWeightTracking: true, hasLibrary: true, hasAdvancedWeight: false,
    tagline: 'Seguimiento de peso y biblioteca personal',
    features: [
      'Hasta 30 alumnos activos',
      'Todo lo del Básico',
      'Seguimiento de peso (registro, historial, gráfico)',
      'Gráfico evolución con tendencia (1m, 3m)',
      'Calorías estimadas y estímulo por rutina',
      'Biblioteca personal de ejercicios',
      'Ejercicios con calorías por rep/min'
    ],
    noIncludes: ['Filtros 6m, 12m, todo', 'Análisis de peso por períodos amplios']
  },
  premium: {
    id: 'premium', name: 'Premium', price: 39.99, maxAlumnos: 100,
    hasWeightTracking: true, hasLibrary: true, hasAdvancedWeight: true,
    tagline: 'Análisis avanzado y más capacidad',
    features: [
      'Hasta 100 alumnos activos',
      'Todo lo del Pro',
      'Gráfico peso: filtros 6m, 12m y todo el historial',
      'Análisis de peso por períodos amplios'
    ],
    noIncludes: []
  },
  personalizado: {
    id: 'personalizado', name: 'Personalizado', price: null, maxAlumnos: 999,
    hasWeightTracking: true, hasLibrary: true, hasAdvancedWeight: true,
    tagline: 'Plataforma a medida para equipos',
    features: [
      'Alumnos ilimitados',
      'Todo lo del Premium'
    ],
    noIncludes: []
  }
};

// Usuarios iniciales
let usersData = [
  {
    id: '1',
    email: 'admin@fitcoach.com',
    password: 'admin123',
    name: 'Admin',
    lastName: 'Sistema',
    role: 'admin',
    active: true,
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    email: 'coach@fitcoach.com',
    password: 'coach123',
    name: 'Carlos',
    lastName: 'González',
    role: 'coach',
    specialty: 'Entrenamiento funcional',
    active: true,
    subscriptionPlan: 'pro',
    subscriptionStatus: 'activa',
    createdAt: '2024-01-15'
  },
  {
    id: '3',
    email: 'maria.coach@fitcoach.com',
    password: 'coach123',
    name: 'María',
    lastName: 'López',
    role: 'coach',
    specialty: 'Hipertrofia y fuerza',
    active: true,
    subscriptionPlan: 'basico',
    subscriptionStatus: 'activa',
    createdAt: '2024-02-01'
  },
  {
    id: '4',
    email: 'cliente1@email.com',
    password: 'cliente123',
    name: 'Juan',
    lastName: 'Pérez',
    role: 'cliente',
    age: 28,
    objective: 'hipertrofia',
    level: 'intermedio',
    coachId: '2',
    active: true,
    createdAt: '2024-02-15'
  },
  {
    id: '5',
    email: 'cliente2@email.com',
    password: 'cliente123',
    name: 'Ana',
    lastName: 'Martínez',
    role: 'cliente',
    age: 35,
    objective: 'pérdida de peso',
    level: 'principiante',
    coachId: '2',
    active: true,
    createdAt: '2024-03-01'
  },
  {
    id: '6',
    email: 'cliente3@email.com',
    password: 'cliente123',
    name: 'Luis',
    lastName: 'Rodríguez',
    role: 'cliente',
    age: 42,
    objective: 'resistencia',
    level: 'avanzado',
    coachId: '3',
    active: true,
    createdAt: '2024-03-10'
  }
];

// Rutinas
let routinesData = [
  {
    id: 'r1',
    name: 'Fuerza Base',
    description: 'Rutina de fuerza enfocada en los principales grupos musculares con progresión lineal.',
    objective: 'hipertrofia',
    level: 'intermedio',
    frequencyPerWeek: 4,
    durationMinutes: 60,
    daysCount: 4,
    status: 'activa',
    createdBy: '2',
    createdByRole: 'coach',
    createdAt: '2024-03-01',
    exercises: [
      {
        id: 'e1',
        name: 'Sentadilla Back',
        description: 'Sentadilla con barra alta',
        instructions: 'Mantén la espalda recta, baja hasta que los muslos estén paralelos al suelo.',
        sets: 4,
        reps: '8',
        time: null,
        rest: '90 seg',
        caloriasPorRep: 0.5,
        caloriasPorMin: null,
        videoUrl: 'https://www.youtube.com/embed/aclHkVaku9U',
        imageUrl: null,
        order: 1,
        observations: 'Calentar bien antes'
      },
      {
        id: 'e2',
        name: 'Press de banca',
        description: 'Press plano con barra',
        instructions: 'Descender controlado hasta el pecho, empujar hacia arriba.',
        sets: 4,
        reps: '10',
        time: null,
        rest: '90 seg',
        caloriasPorRep: 0.4,
        caloriasPorMin: null,
        videoUrl: 'https://www.youtube.com/embed/rT7DgCr-3pg',
        imageUrl: null,
        order: 2,
        observations: null
      },
      {
        id: 'e3',
        name: 'Peso muerto rumano',
        description: 'RDL para isquiotibiales',
        instructions: 'Mantén las piernas casi rectas, inclínate hacia adelante con la barra.',
        sets: 3,
        reps: '12',
        time: null,
        rest: '60 seg',
        caloriasPorRep: 0.35,
        caloriasPorMin: null,
        videoUrl: 'https://www.youtube.com/embed/JCXUYuzwNrM',
        imageUrl: null,
        order: 3,
        observations: 'Sentir estiramiento en isquiotibiales'
      }
    ],
    recommendations: 'Descansar bien entre sesiones. Mantener hidratación adecuada.',
    warnings: 'Si sientes dolor articular, detener y consultar.',
    estimulo: 'fuerza'
  },
  {
    id: 'r2',
    name: 'Full Body Principiante',
    description: 'Rutina completa para quienes empiezan en el gym.',
    objective: 'resistencia',
    level: 'principiante',
    frequencyPerWeek: 3,
    durationMinutes: 45,
    daysCount: 3,
    status: 'activa',
    createdBy: '1',
    createdByRole: 'admin',
    createdAt: '2024-02-20',
    exercises: [
      {
        id: 'e4',
        name: 'Sentadilla con peso corporal',
        description: 'Sentadilla básica sin carga',
        instructions: 'Pies al ancho de hombros, baja y sube controlado.',
        sets: 3,
        reps: '12',
        time: null,
        rest: '60 seg',
        caloriasPorRep: 0.3,
        caloriasPorMin: null,
        videoUrl: 'https://www.youtube.com/embed/aclHkVaku9U',
        imageUrl: null,
        order: 1,
        observations: null
      },
      {
        id: 'e5',
        name: 'Flexiones',
        description: 'Push-ups clásicas',
        instructions: 'Mantén el core activo, baja el pecho hacia el suelo.',
        sets: 3,
        reps: '10',
        time: null,
        rest: '45 seg',
        caloriasPorRep: 0.4,
        caloriasPorMin: null,
        videoUrl: 'https://www.youtube.com/embed/IODxDxX7oi4',
        imageUrl: null,
        order: 2,
        observations: 'Modificar con rodillas si es necesario'
      }
    ],
    recommendations: 'Empezar con pesos ligeros. Priorizar técnica sobre carga.',
    warnings: null,
    estimulo: 'mixto'
  }
];

// Asignación de rutinas a clientes
let clientRoutinesData = [
  { clientId: '4', routineId: 'r1', assignedAt: '2024-03-05', assignedBy: '2' },
  { clientId: '4', routineId: 'r2', assignedAt: '2024-03-10', assignedBy: '2' },
  { clientId: '5', routineId: 'r2', assignedAt: '2024-03-01', assignedBy: '2' },
  { clientId: '6', routineId: 'r1', assignedAt: '2024-03-12', assignedBy: '3' }
];

// Planificación calendario: workouts asignados a fechas específicas (estilo TrainingPeaks)
// RPE = escala 1-10 (carga percibida), sensations = sensaciones post-entreno, feedback = notas del alumno
let plannedWorkoutsData = [
  { id: 'pw1', clientId: '4', routineId: 'r1', date: '2025-03-18', notes: 'Día A - piernas', completed: true, completedAt: '2025-03-18', rpe: 8, sensations: 'Bien, sin molestias', feedback: 'Bien ejecutado', clientNotes: 'Bien ejecutado' },
  { id: 'pw1b', clientId: '4', routineId: 'r1', date: '2025-03-10', notes: 'Sesión anterior', completed: true, completedAt: '2025-03-10', rpe: 7 },
  { id: 'pw1c', clientId: '4', routineId: 'r1', date: '2025-03-05', notes: null, completed: true, completedAt: '2025-03-05', rpe: 7 },
  { id: 'pw1d', clientId: '4', routineId: 'r1', date: '2025-02-28', notes: null, completed: true, completedAt: '2025-02-28', rpe: 6 },
  { id: 'pw1e', clientId: '4', routineId: 'r1', date: '2025-02-20', notes: null, completed: true, completedAt: '2025-02-20', rpe: 6 },
  { id: 'pw2', clientId: '4', routineId: 'r1', date: '2025-03-20', notes: 'Día B - pecho/hombros', completed: false },
  { id: 'pw2b', clientId: '4', routineId: 'r2', date: '2025-03-16', notes: null, completed: true, completedAt: '2025-03-16', rpe: 7 },
  { id: 'pw2c', clientId: '4', routineId: 'r1', date: '2025-03-22', notes: null, completed: false },
  { id: 'pw3', clientId: '5', routineId: 'r2', date: '2025-03-18', notes: 'Full body', completed: true, completedAt: '2025-03-18', rpe: 7, sensations: 'Un poco de fatiga', feedback: 'Primer día', clientNotes: '' },
  { id: 'pw4', clientId: '5', routineId: 'r2', date: '2025-03-20', notes: null, completed: false },
  { id: 'pw5', clientId: '6', routineId: 'r1', date: '2025-03-19', notes: 'Fuerza', completed: false }
];

// Biblioteca GLOBAL (plataforma) + PERSONAL (por coach). caloriasPorRep = por repetición, caloriasPorMin = por minuto
let exerciseLibraryData = [
  { id: 'ex1', name: 'Sentadilla Back', description: 'Sentadilla con barra alta', instructions: 'Mantén espalda recta, baja hasta muslos paralelos.', muscleGroup: 'Piernas', equipment: 'Barra', caloriasPorRep: 0.5, caloriasPorMin: null, videoUrl: 'https://www.youtube.com/embed/aclHkVaku9U', createdBy: '1', scope: 'global' },
  { id: 'ex2', name: 'Press de banca', description: 'Press plano con barra', instructions: 'Descender controlado hasta el pecho.', muscleGroup: 'Pecho', equipment: 'Barra', caloriasPorRep: 0.4, caloriasPorMin: null, videoUrl: 'https://www.youtube.com/embed/rT7DgCr-3pg', createdBy: '1', scope: 'global' },
  { id: 'ex3', name: 'Peso muerto rumano', description: 'RDL isquiotibiales', instructions: 'Piernas casi rectas, inclínate con la barra.', muscleGroup: 'Isquiotibiales', equipment: 'Barra', caloriasPorRep: 0.35, caloriasPorMin: null, videoUrl: 'https://www.youtube.com/embed/JCXUYuzwNrM', createdBy: '1', scope: 'global' },
  { id: 'ex4', name: 'Flexiones', description: 'Push-ups clásicas', instructions: 'Core activo, baja pecho al suelo.', muscleGroup: 'Pecho', equipment: 'Peso corporal', caloriasPorRep: 0.4, caloriasPorMin: null, videoUrl: 'https://www.youtube.com/embed/IODxDxX7oi4', createdBy: '1', scope: 'global' },
  { id: 'ex5', name: 'Running', description: 'Carrera continua', instructions: 'Mantén ritmo constante.', muscleGroup: 'Cardio', equipment: 'Otro', caloriasPorRep: null, caloriasPorMin: 10, videoUrl: '', createdBy: '1', scope: 'global' },
  { id: 'ex6', name: 'Mi ejercicio personal', description: 'Ejercicio propio del coach Carlos', instructions: 'Técnica específica.', muscleGroup: 'Core', equipment: 'Kettlebell', caloriasPorRep: 0.3, caloriasPorMin: null, videoUrl: '', createdBy: '2', scope: 'coach' }
];

// Registro de peso corporal (seguimiento simple: peso + fecha + observaciones)
let weightRecordsData = [
  { id: 'wr1', clientId: '4', peso: 82, fecha: '2025-03-01', observaciones: 'Control inicial', createdAt: '2025-03-01' },
  { id: 'wr2', clientId: '4', peso: 81.5, fecha: '2025-03-08', observaciones: 'Buen progreso', createdAt: '2025-03-08' },
  { id: 'wr3', clientId: '4', peso: 81, fecha: '2025-03-15', observaciones: null, createdAt: '2025-03-15' },
  { id: 'wr4', clientId: '5', peso: 72, fecha: '2025-03-01', observaciones: 'Inicio plan', createdAt: '2025-03-01' },
  { id: 'wr5', clientId: '5', peso: 70.5, fecha: '2025-03-15', observaciones: 'Muy bien', createdAt: '2025-03-15' }
];

// Mensajería: conversaciones entre coach y cliente
let conversationsData = [
  { id: 'conv1', clientId: '4', coachId: '2', lastMessageAt: '2025-03-19T14:30:00', lastMessagePreview: 'Entendido, voy a probar esa variante. ¡Gracias!', coachUnreadCount: 0, clientUnreadCount: 0 },
  { id: 'conv2', clientId: '5', coachId: '2', lastMessageAt: '2025-03-18T10:15:00', lastMessagePreview: 'Llevo 2 semanas con la rutina inicial. ¿Cuándo debería aumentar la intensidad?', coachUnreadCount: 1, clientUnreadCount: 0 },
  { id: 'conv3', clientId: '6', coachId: '3', lastMessageAt: null, lastMessagePreview: null, coachUnreadCount: 0, clientUnreadCount: 0 }
];

let chatMessagesData = [
  { id: 'm1', conversationId: 'conv1', senderId: '4', senderRole: 'cliente', content: 'Hola, cuando bajo en la sentadilla siento molestia en la rodilla derecha. ¿Es normal o estoy haciendo algo mal?', createdAt: '2025-03-18T09:00:00', readBy: ['4', '2'] },
  { id: 'm2', conversationId: 'conv1', senderId: '2', senderRole: 'coach', content: 'Hola Juan. Es importante revisar la técnica. Prueba abrir un poco más las rodillas y asegurarte de que no se metan hacia adentro. Si persiste, conviene que un fisio revise la alineación.', createdAt: '2025-03-18T14:20:00', readBy: ['4', '2'] },
  { id: 'm3', conversationId: 'conv1', senderId: '4', senderRole: 'cliente', content: 'Entendido, voy a probar esa variante. ¡Gracias!', createdAt: '2025-03-19T14:30:00', readBy: ['4', '2'] },
  { id: 'm4', conversationId: 'conv2', senderId: '5', senderRole: 'cliente', content: 'Llevo 2 semanas con la rutina inicial. ¿Cuándo debería aumentar la intensidad?', createdAt: '2025-03-18T10:15:00', readBy: ['5'] }
];

// Conversaciones Admin ↔ Coach (consultas, dudas de coaches)
let adminCoachConversationsData = [
  { id: 'ac1', coachId: '2', adminId: '1', lastMessageAt: '2025-03-19T11:20:00', lastMessagePreview: '¿Puedo añadir ejercicios propios a la biblioteca global?', adminUnreadCount: 0, coachUnreadCount: 0 }
];

let adminCoachChatMessagesData = [
  { id: 'acm1', conversationId: 'ac1', senderId: '2', senderRole: 'coach', content: 'Hola, tengo una duda sobre la biblioteca de ejercicios. ¿Puedo añadir ejercicios propios a la biblioteca global?', createdAt: '2025-03-19T10:45:00', readBy: ['2', '1'] },
  { id: 'acm2', conversationId: 'ac1', senderId: '1', senderRole: 'admin', content: 'Los ejercicios que crees desde tu biblioteca personal son solo visibles para ti. La biblioteca global la gestiona el administrador. Si necesitas ejercicios específicos, puedes solicitarlos y los evaluamos.', createdAt: '2025-03-19T11:20:00', readBy: ['1', '2'] }
];

export const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

// Store en memoria para persistencia durante la sesión (legacy - usar API)
export const store = {
  getUsers: () => JSON.parse(localStorage.getItem('fitcoach_users') || JSON.stringify(usersData)),
  setUsers: (users) => {
    localStorage.setItem('fitcoach_users', JSON.stringify(users));
  },
  getRoutines: () => JSON.parse(localStorage.getItem('fitcoach_routines') || JSON.stringify(routinesData)),
  setRoutines: (routines) => {
    localStorage.setItem('fitcoach_routines', JSON.stringify(routines));
  },
  getClientRoutines: () => JSON.parse(localStorage.getItem('fitcoach_client_routines') || JSON.stringify(clientRoutinesData)),
  setClientRoutines: (data) => {
    localStorage.setItem('fitcoach_client_routines', JSON.stringify(data));
  },
  getConsultations: () => JSON.parse(localStorage.getItem('fitcoach_consultations') || JSON.stringify([])),
  setConsultations: (consultations) => {
    localStorage.setItem('fitcoach_consultations', JSON.stringify(consultations));
  },
  getConversations: () => JSON.parse(localStorage.getItem('fitcoach_conversations') || JSON.stringify(conversationsData)),
  setConversations: (data) => {
    localStorage.setItem('fitcoach_conversations', JSON.stringify(data));
  },
  getChatMessages: () => JSON.parse(localStorage.getItem('fitcoach_chat_messages') || JSON.stringify(chatMessagesData)),
  setChatMessages: (data) => {
    localStorage.setItem('fitcoach_chat_messages', JSON.stringify(data));
  },
  getAdminCoachConversations: () => JSON.parse(localStorage.getItem('fitcoach_admin_coach_conversations') || JSON.stringify(adminCoachConversationsData)),
  setAdminCoachConversations: (data) => {
    localStorage.setItem('fitcoach_admin_coach_conversations', JSON.stringify(data));
  },
  getAdminCoachChatMessages: () => JSON.parse(localStorage.getItem('fitcoach_admin_coach_chat_messages') || JSON.stringify(adminCoachChatMessagesData)),
  setAdminCoachChatMessages: (data) => {
    localStorage.setItem('fitcoach_admin_coach_chat_messages', JSON.stringify(data));
  },
  getPlannedWorkouts: () => JSON.parse(localStorage.getItem('fitcoach_planned_workouts') || JSON.stringify(plannedWorkoutsData)),
  setPlannedWorkouts: (data) => {
    localStorage.setItem('fitcoach_planned_workouts', JSON.stringify(data));
  },
  getExerciseLibrary: () => JSON.parse(localStorage.getItem('fitcoach_exercise_library') || JSON.stringify(exerciseLibraryData)),
  setExerciseLibrary: (data) => {
    localStorage.setItem('fitcoach_exercise_library', JSON.stringify(data));
  },
  getWeightRecords: () => JSON.parse(localStorage.getItem('fitcoach_weight_records') || JSON.stringify(weightRecordsData)),
  setWeightRecords: (data) => {
    localStorage.setItem('fitcoach_weight_records', JSON.stringify(data));
  }
};
