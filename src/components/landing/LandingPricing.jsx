import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PRICING_PLANS } from '../../data/landingData';

export default function LandingPricing() {
  return (
    <section id="planes" className="landing-pricing">
      <Container>
        <motion.div
          className="section-header text-center mb-5"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title">Planes que escalan con vos</h2>
          <p className="section-subtitle max-w-600 mx-auto">
            Empezá con lo esencial y subí de nivel cuando crezca tu cartera de clientes.
          </p>
        </motion.div>

        <Row className="g-4 justify-content-center">
          {PRICING_PLANS.map((plan, i) => (
            <Col xs={12} md={6} lg={4} xl={3} key={plan.id}>
              <motion.div
                className={`pricing-card ${plan.popular ? 'pricing-card--popular' : ''}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                whileHover={{ y: -6 }}
              >
                {plan.popular && <div className="pricing-badge">Más elegido</div>}
                <h3 className="pricing-name">{plan.name}</h3>
                <div className="pricing-price">
                  {plan.price !== null ? (
                    <>
                      <span className="pricing-currency">USD</span>
                      <span className="pricing-amount">{plan.price}</span>
                      <span className="pricing-period">/mes</span>
                    </>
                  ) : (
                    <span className="pricing-custom">A medida</span>
                  )}
                </div>
                <p className="pricing-tagline">{plan.tagline}</p>
                <ul className="pricing-features">
                  {plan.features.map((f, i) => (
                    <li key={i}>
                      <span className="pricing-check">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.noIncludes?.length > 0 && (
                  <ul className="pricing-no-includes">
                    {plan.noIncludes.map((item, i) => (
                      <li key={i}>
                        <span className="pricing-cross">✕</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  as={Link}
                  to={plan.isCustom ? '/registro' : '/registro'}
                  variant={plan.popular ? 'primary' : 'secondary'}
                  className="w-100 mt-auto"
                >
                  {plan.cta}
                </Button>
              </motion.div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}
