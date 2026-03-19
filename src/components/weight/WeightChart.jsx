import React, { useState } from 'react';
import { Card, Form } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PERIODS_BASIC = [
  { value: '1', label: 'Último mes' },
  { value: '3', label: '3 meses' }
];
const PERIODS_ADVANCED = [
  { value: '1', label: 'Último mes' },
  { value: '3', label: '3 meses' },
  { value: '6', label: '6 meses' },
  { value: '12', label: '12 meses' },
  { value: 'all', label: 'Todo' }
];

function filterByPeriod(records, period) {
  if (!records?.length) return [];
  if (period === 'all') return records;
  const months = parseInt(period, 10);
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutStr = cutoff.toISOString().split('T')[0];
  return records.filter(r => r.fecha >= cutStr);
}

function getTrend(records) {
  if (!records || records.length < 2) return null;
  const sorted = [...records].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const first = parseFloat(sorted[0].peso);
  const last = parseFloat(sorted[sorted.length - 1].peso);
  const diff = last - first;
  if (Math.abs(diff) < 0.5) return { text: 'Se mantiene', variant: 'secondary' };
  if (diff < 0) return { text: 'Bajando', variant: 'success' };
  return { text: 'Subiendo', variant: 'warning' };
}

export default function WeightChart({ records = [], showTrend = true, advancedPeriods = true }) {
  const periods = advancedPeriods ? PERIODS_ADVANCED : PERIODS_BASIC;
  const [period, setPeriod] = useState(periods[0]?.value || '3');
  const filtered = filterByPeriod(records, period);
  const chartData = filtered
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map(r => ({ fecha: r.fecha?.slice(5) || r.fecha, peso: parseFloat(r.peso), fullDate: r.fecha }));

  const trend = showTrend && chartData.length >= 2 ? getTrend(filtered) : null;
  const first = chartData[0];
  const last = chartData[chartData.length - 1];

  if (records.length === 0) {
    return (
      <Card className="mb-4">
        <Card.Body className="text-center py-5 text-muted">
          Sin registros de peso. Añade tu primer registro para ver la evolución.
        </Card.Body>
      </Card>
    );
  }

  if (chartData.length < 2) {
    return (
      <Card className="mb-4">
        <Card.Body className="text-center py-4 text-muted">
          Necesitas al menos 2 registros para ver la curva de evolución.
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <strong>Evolución del peso corporal</strong>
        <Form.Select size="sm" style={{ width: 'auto' }} value={period} onChange={e => setPeriod(e.target.value)}>
          {periods.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </Form.Select>
      </Card.Header>
      <Card.Body>
        {trend && (
          <div className={`badge bg-${trend.variant} mb-3`}>Tendencia: {trend.text}</div>
        )}
        <div className="row g-2 mb-3 small">
          <div className="col-auto"><span className="text-muted">Inicial:</span> <strong>{first?.peso} kg</strong> ({first?.fullDate})</div>
          <div className="col-auto"><span className="text-muted">Actual:</span> <strong>{last?.peso} kg</strong> ({last?.fullDate})</div>
          {first !== last && (
            <div className="col-auto">
              <span className="text-muted">Diferencia:</span>{' '}
              <strong className={last.peso - first.peso < 0 ? 'text-success' : 'text-warning'}>
                {(last.peso - first.peso) > 0 ? '+' : ''}{(last.peso - first.peso).toFixed(1)} kg
              </strong>
            </div>
          )}
        </div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} unit=" kg" />
              <Tooltip formatter={v => [`${v} kg`, 'Peso']} labelFormatter={l => `Fecha: ${l}`} />
              <Line type="monotone" dataKey="peso" stroke="var(--accent, #0d6efd)" strokeWidth={2} dot={{ r: 5 }} name="Peso" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card.Body>
    </Card>
  );
}
