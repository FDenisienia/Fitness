import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Table, Form, InputGroup, Badge } from 'react-bootstrap';
import { store } from '../../data/mockData';
import { useSearchParams } from 'react-router-dom';

export default function ClientsPage() {
  const [searchParams] = useSearchParams();
  const coachFilter = searchParams.get('coach');
  const users = store.getUsers();
  const routines = store.getRoutines();
  const clientRoutines = store.getClientRoutines();
  const [filter, setFilter] = useState({ name: '', coach: '' });

  const clients = users.filter(u => u.role === 'cliente');
  const coaches = users.filter(u => u.role === 'coach');

  const filtered = clients.filter(c => {
    const matchName = !filter.name || `${c.name} ${c.lastName}`.toLowerCase().includes(filter.name.toLowerCase());
    const matchCoach = !filter.coach || c.coachId === filter.coach;
    const matchCoachParam = !coachFilter || c.coachId === coachFilter;
    return matchName && matchCoach && matchCoachParam;
  });

  const getClientRoutines = (clientId) => {
    const cr = clientRoutines.filter(r => r.clientId === clientId);
    return cr.map(r => routines.find(rt => rt.id === r.routineId)).filter(Boolean);
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="mb-1">Alumnos</h2>
        <p className="text-muted mb-0">Solo consulta. Los alumnos son creados y gestionados por sus coaches.</p>
      </div>
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex gap-2 flex-wrap">
            <InputGroup style={{ maxWidth: 300 }}>
              <Form.Control placeholder="Buscar alumno" value={filter.name} onChange={e => setFilter(f => ({ ...f, name: e.target.value }))} />
            </InputGroup>
            <Form.Select style={{ maxWidth: 250 }} value={filter.coach} onChange={e => setFilter(f => ({ ...f, coach: e.target.value }))}>
              <option value="">Todos los coaches</option>
              {coaches.map(c => <option key={c.id} value={c.id}>{c.name} {c.lastName}</option>)}
            </Form.Select>
          </div>
        </Card.Body>
      </Card>
      <Card>
        <Table responsive className="table-modern mb-0">
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Email</th>
              <th>Coach</th>
              <th>Objetivo</th>
              <th>Nivel</th>
              <th>Rutinas</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td>{c.name} {c.lastName}</td>
                <td>{c.email}</td>
                <td>{c.coachId ? (coaches.find(u => u.id === c.coachId)?.name + ' ' + coaches.find(u => u.id === c.coachId)?.lastName) : '-'}</td>
                <td>{c.objective || '-'}</td>
                <td>{c.level || '-'}</td>
                <td>{getClientRoutines(c.id).length}</td>
                <td><Badge bg={c.active ? 'success' : 'secondary'}>{c.active ? 'Activo' : 'Inactivo'}</Badge></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
