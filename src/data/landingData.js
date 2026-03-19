// Datos para la landing page - centralizados y reutilizables
import { SUBSCRIPTION_PLANS } from './mockData';

export const FEATURES = [
  {
    id: 'clientes',
    title: 'Gestión de clientes',
    description: 'Fichas completas por alumno: objetivos, nivel, historial. Organizá toda tu lista de alumnos desde un solo panel.',
    icon: 'users',
  },
  {
    id: 'rutinas',
    title: 'Rutinas personalizadas',
    description: 'Creá planes según objetivo, equipamiento y nivel. Asigná con un clic y actualizá cuando quieras.',
    icon: 'routines',
  },
  {
    id: 'biblioteca',
    title: 'Biblioteca de ejercicios',
    description: 'Ejercicios con instrucciones, calorías y videos. Usá la global o armá tu propia biblioteca personal.',
    icon: 'library',
  },
  {
    id: 'seguimiento',
    title: 'Seguimiento de progreso',
    description: 'Peso corporal, gráficos de evolución y estadísticas. Tus clientes registran, vos analizás tendencias.',
    icon: 'chart',
  },
  {
    id: 'chat',
    title: 'Chat coach-cliente',
    description: 'Comunicación directa dentro de la plataforma. Sin WhatsApp, sin pérdida de contexto.',
    icon: 'message',
  },
  {
    id: 'dashboard',
    title: 'Dashboard inteligente',
    description: 'Estado diario de cada cliente, alumnos del día, alertas y actividad reciente a simple vista.',
    icon: 'dashboard',
  },
  {
    id: 'calendario',
    title: 'Calendario de entrenamientos',
    description: 'Planificá sesiones, asigná rutinas por fecha y seguí el cumplimiento de tus alumnos.',
    icon: 'calendar',
  },
  {
    id: 'videos',
    title: 'Videos y demostraciones',
    description: 'Cargá videos propios o enlazá demostraciones para que cada ejercicio sea claro y ejecutable.',
    icon: 'video',
  },
];

export const HOW_IT_WORKS_STEPS = [
  { step: 1, title: 'Creás tu cuenta', desc: 'Registrate como coach en segundos.' },
  { step: 2, title: 'Asignás clientes', desc: 'Agregá alumnos y configurá sus perfiles.' },
  { step: 3, title: 'Creás rutinas', desc: 'Diseñá planes a medida desde la biblioteca.' },
  { step: 4, title: 'Ellos entrenan', desc: 'Los clientes ejecutan y registran progreso.' },
  { step: 5, title: 'Seguimiento continuo', desc: 'Analizá datos y ajustá para mejores resultados.' },
];

export const BENEFITS = [
  { title: 'Ahorro de tiempo', desc: 'Todo centralizado. Menos papeles, más foco en tu trabajo.' },
  { title: 'Mejor organización', desc: 'Rutinas, calendario y clientes en un solo lugar.' },
  { title: 'Profesionalización', desc: 'Tu servicio se ve serio y confiable.' },
  { title: 'Mejores resultados', desc: 'Cliente más comprometido, coach más informado.' },
];

export const TESTIMONIALS = [
  {
    name: 'María Gómez',
    role: 'Entrenadora personal',
    avatar: 'MG',
    text: 'Desde que uso la plataforma, mis clientes cumplen más. La organización mejoró un 100% y el chat integrado cambió todo.',
  },
  {
    name: 'Lucas Fernández',
    role: 'Coach deportivo',
    avatar: 'LF',
    text: 'El seguimiento de peso y las rutinas personalizadas me permiten dar un servicio premium. Mis alumnos lo notan.',
  },
  {
    name: 'Ana Torres',
    role: 'Cliente',
    avatar: 'AT',
    text: 'Tengo mi rutina en el celular, mi coach me escribe directo y puedo registrar mi peso. Todo en un solo lugar.',
  },
];

export const PRICING_PLANS = [
  {
    ...SUBSCRIPTION_PLANS.basico,
    popular: false,
    cta: 'Empezar con Básico',
  },
  {
    ...SUBSCRIPTION_PLANS.pro,
    popular: true,
    cta: 'Empezar con Pro',
  },
  {
    ...SUBSCRIPTION_PLANS.premium,
    popular: false,
    cta: 'Empezar con Premium',
  },
  {
    ...SUBSCRIPTION_PLANS.personalizado,
    popular: false,
    cta: 'Contactar',
    isCustom: true,
  },
];
