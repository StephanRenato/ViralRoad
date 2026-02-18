// @ts-nocheck
/**
 * ARQUIVO DE REFERÊNCIA: Supabase Edge Function (Server-side)
 * Este código não é executado no navegador. Ele deve ser implantado via CLI do Supabase.
 * Endpoint recomendado: https://<project-id>.supabase.co/functions/v1/stripe-webhook
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@11.1.0"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

serve(async (req) => {
  const signature = req.headers.get('stripe-signature') as string

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') as string
    )

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const email = session.customer_details.email
      const plan = session.metadata.plan_type // 'creator' ou 'pro'

      // Localizar usuário pelo e-mail
      const { data: userData } = await supabase
        .from('usage_limits')
        .select('user_id')
        .eq('email', email)
        .single()

      if (userData) {
        // Atualizar Limites de Uso
        const limit = plan === 'pro' ? 999999 : 500
        await supabase
          .from('usage_limits')
          .update({ 
            plan: plan,
            monthly_limit: limit,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userData.user_id)

        // Atualizar Status da Assinatura no Perfil
        await supabase
          .from('profiles')
          .update({ 
            subscription_status: 'active',
            current_plan: plan
          })
          .eq('id', userData.user_id)
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})