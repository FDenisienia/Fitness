import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { SUBSCRIPTION_PLANS } from '../data/mockData';

const PlanContext = createContext(null);

/** Obtiene el plan efectivo: coach = su plan, cliente = plan de su coach. Retorna null si no hay provider o admin. */
export function usePlan() {
  const ctx = useContext(PlanContext);
  return ctx ?? null;
}

export function PlanProvider({ children }) {
  const { user } = useAuth();
  const plan = useMemo(() => {
    if (!user) return null;
    if (user.role === 'admin') return null;
    const planKey = user.subscriptionPlan || 'basico';
    return SUBSCRIPTION_PLANS[planKey] || SUBSCRIPTION_PLANS.basico;
  }, [user]);
  return <PlanContext.Provider value={plan}>{children}</PlanContext.Provider>;
}
