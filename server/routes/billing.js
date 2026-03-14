import { Router } from 'express';
import Stripe from 'stripe';
import { requireAuth } from '../middleware/auth.js';
import { getUserById, getUserByStripeCustomer, updateUserStripe } from '../db/database.js';

const router = Router();

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// GET /api/billing/status
router.get('/status', requireAuth, (req, res) => {
  const user = getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    plan: user.plan || 'free',
    stripe_customer_id: user.stripe_customer_id,
    stripe_subscription_id: user.stripe_subscription_id,
    plan_expires_at: user.plan_expires_at,
  });
});

// POST /api/billing/create-checkout-session
router.post('/create-checkout-session', requireAuth, async (req, res) => {
  try {
    const stripe = getStripe();
    const user = getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!process.env.STRIPE_PRICE_ID) {
      return res.status(500).json({ error: 'Stripe price ID not configured' });
    }

    const baseUrl = process.env.APP_URL || 'http://localhost:5173';
    const params = {
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${baseUrl}/settings?upgraded=1`,
      cancel_url: `${baseUrl}/settings`,
      metadata: { user_id: String(req.user.id), username: req.user.username },
    };

    if (user.stripe_customer_id) {
      params.customer = user.stripe_customer_id;
    } else if (user.email) {
      params.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(params);
    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout session error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/create-portal-session
router.post('/create-portal-session', requireAuth, async (req, res) => {
  try {
    const stripe = getStripe();
    const user = getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.stripe_customer_id) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    const baseUrl = process.env.APP_URL || 'http://localhost:5173';
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${baseUrl}/settings`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Portal session error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

// Stripe webhook handler — exported separately so index.js can mount it
// BEFORE express.json() (needs raw body for signature verification)
export async function stripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription' && session.metadata?.user_id) {
          updateUserStripe(Number(session.metadata.user_id), {
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            plan: 'pro',
            plan_expires_at: null,
          });
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const user = getUserByStripeCustomer(sub.customer);
        if (user) {
          const isActive = ['active', 'trialing'].includes(sub.status);
          updateUserStripe(user.id, {
            stripe_subscription_id: sub.id,
            plan: isActive ? 'pro' : 'free',
            plan_expires_at: sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null,
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const user = getUserByStripeCustomer(sub.customer);
        if (user) {
          updateUserStripe(user.id, { plan: 'free', plan_expires_at: null });
        }
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  res.json({ received: true });
}
