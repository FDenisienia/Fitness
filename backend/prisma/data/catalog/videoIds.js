/** IDs de YouTube en formato embed (demostraciones de técnica; reutilizados por similitud de movimiento). */
export const VID = {
  bench: 'rT7DgCr-3pg',
  squat: 'aclHkVaku9U',
  rdl: 'JCXUYuzwNrM',
  pushup: 'IODxDxX7oi4',
  deadlift: 'ytSbTiO9l6c',
  pullup: 'eGo4IYlbE5g',
  row: '1Tq3QdYUuYs',
  shoulder: 'qEwKCR5JCog',
  curl: '2z8JmcrW6kY',
  tricep: 'nmwgirgXLYM',
  legPress: 'NAhX_iUsz8k',
  lunge: 'QOVaHwm-Q6U',
  plank: '1VUQXbu1J0E',
  run: 'kV-2Q8tFLmk',
  bike: 'S0ZzfdLf4kY',
  rope: '1BZM2Vre5oc',
  rower: 's0Uvk9UIqeE',
  elliptical: 'Ees6yXVb2cU',
  stretch: '4Y2ZdHCOXok',
  mobility: 'x7_R0b1X8xE',
  hiit: 'ml6cT4AZdqI',
  kettlebell: 'bx0g8Q2e6bY',
  trx: 'p8-3QZyJFDg',
  calf: 'gwLzBJYoWlI',
  facepull: 'HSoJiOSnJGA',
};

export function embed(id) {
  return `https://www.youtube.com/embed/${id}`;
}
