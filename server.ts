import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from '@supabase/supabase-js';
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const APIFY_TOKEN = (process.env.APIFY_TOKEN || '').trim();
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pawcolinueutmyxxlrui.supabase.co';
const SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const ANON_KEY = (process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VZ_fuGTHNuFhI3ivO_W62g_Ggh7ngGQ').trim();

if (!SERVICE_ROLE_KEY) {
  console.error("❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing. Administrative tasks (auth.admin) will fail.");
} else {
  console.log(`✅ SUPABASE_SERVICE_ROLE_KEY detected (Length: ${SERVICE_ROLE_KEY.length})`);
}

// Use SERVICE_ROLE_KEY for the server-side client to bypass RLS and perform admin tasks
const SUPABASE_KEY = SERVICE_ROLE_KEY || ANON_KEY;

const supabaseServer = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const ACTOR_IDS: Record<string, string> = {
  instagram: 'apify~instagram-scraper',
  tiktok: 'clockworks~tiktok-scraper',
  youtube: 'streamers~youtube-channel-scraper',
  kwai: 'luan.r.dev~kwai-profile-scraper'
};

const cleanJson = (text: string): string => {
  if (!text) return '{}';
  const match = text.match(/```json([\s\S]*?)```/);
  if (match) return match[1].trim();
  if (text.trim().startsWith('{')) return text.trim();
  return text;
};

console.log("VIRAL ROAD Server starting...");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Log relevant requests for debugging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const isApi = req.url.startsWith('/api/');
      const isError = res.statusCode >= 400;
      
      // Only log API calls or errors to reduce noise and confusion
      if ((isApi || isError) && req.url !== '/api/health' && req.url !== '/api/ping') {
        console.log(`${new Date().toISOString()} | ${req.method} ${req.url} | ${res.statusCode} | ${duration}ms`);
      }
    });
    next();
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      message: "Viral Road API is live",
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV
    });
  });

  // Ping for connectivity test
  app.get("/api/ping", (req, res) => {
    res.send("pong");
  });

  // Gemini Health Check
  app.get("/api/gemini-health", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({ status: 'error', message: 'GEMINI_API_KEY não configurada' });
      }
      return res.json({ status: 'ok', message: 'Gemini API configurada no ambiente' });
    } catch (error: any) {
      return res.status(500).json({ status: 'error', message: error.message });
    }
  });

  // Supabase Health Check
  app.get("/api/supabase-health", async (req, res) => {
    try {
      const { data, error } = await supabaseServer.from('profiles').select('count', { count: 'exact', head: true });
      
      return res.json({ 
        status: error ? 'error' : 'ok', 
        message: error ? error.message : 'Conexão com Supabase estável',
        details: error || null,
        config: {
          url: SUPABASE_URL.substring(0, 15) + '...',
          hasServiceKey: !!SERVICE_ROLE_KEY && SERVICE_ROLE_KEY.length > 20,
          hasAnonKey: !!ANON_KEY && ANON_KEY.length > 20,
          isServiceKeyValid: SERVICE_ROLE_KEY !== ANON_KEY
        }
      });
    } catch (error: any) {
      return res.status(500).json({ 
        status: 'error', 
        message: error.message || 'Falha catastrófica ao contatar Supabase' 
      });
    }
  });

  // Check if password has been leaked (HaveIBeenPwned API)
  app.post("/api/auth/check-password-leak", async (req, res) => {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    try {
      // 1. Hash the password using SHA-1
      const sha1Hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
      
      // 2. Get the first 5 characters (prefix) and the rest (suffix)
      const prefix = sha1Hash.substring(0, 5);
      const suffix = sha1Hash.substring(5);

      // 3. Query HIBP API (k-Anonymity)
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch from HIBP API");
      }

      const text = await response.text();
      const lines = text.split('\n');
      
      // 4. Check if the suffix exists in the results
      let count = 0;
      for (const line of lines) {
        const [hashSuffix, occurrenceCount] = line.split(':');
        if (hashSuffix.trim() === suffix) {
          count = parseInt(occurrenceCount.trim(), 10);
          break;
        }
      }

      return res.json({
        isLeaked: count > 0,
        occurrences: count
      });
    } catch (error: any) {
      console.error("HIBP Check Error:", error);
      // Fail gracefully - if API is down, we don't block the user but log it
      return res.json({
        isLeaked: false,
        error: "Could not verify password security at this time"
      });
    }
  });

  // Debug Environment (Masked)
  app.get("/api/debug-env", (req, res) => {
    res.json({
      SUPABASE_URL: SUPABASE_URL ? "SET" : "MISSING",
      SERVICE_ROLE_KEY: SERVICE_ROLE_KEY ? `SET (Length: ${SERVICE_ROLE_KEY.length})` : "MISSING",
      ANON_KEY: ANON_KEY ? `SET (Length: ${ANON_KEY.length})` : "MISSING",
      APIFY_TOKEN: APIFY_TOKEN ? "SET" : "MISSING",
      NODE_ENV: process.env.NODE_ENV
    });
  });

  // DB Proxy Route (More resilient than client-side fetch)
  app.get("/api/db/profile", async (req, res) => {
    const { userId } = req.query;
    console.log(`${new Date().toISOString()} | DB Get Profile Request for ${userId}`);
    
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    try {
      const { data, error } = await supabaseServer
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error("Supabase Get Profile Error:", error);
        throw error;
      }
      return res.json({ status: "ok", data });
    } catch (error: any) {
      console.error("DB Get Profile Proxy Error:", error);
      return res.status(500).json({ 
        error: "DB_GET_PROFILE_ERROR", 
        message: error.message || "Erro ao carregar perfil via proxy." 
      });
    }
  });

  // DB Schema Check (Debug)
  app.get("/api/db/schema-check", async (req, res) => {
    try {
      const { data, error } = await supabaseServer.rpc('get_table_columns', { table_name: 'profiles' });
      
      // If RPC is not available, try a simple select
      if (error) {
        const { data: sample, error: selectError } = await supabaseServer.from('profiles').select('*').limit(1);
        return res.json({ 
          status: "fallback", 
          columns: sample ? Object.keys(sample[0] || {}) : [],
          error: selectError 
        });
      }
      
      return res.json({ status: "ok", columns: data });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/db/upsert-profile", async (req, res) => {
    const { userId, profileData, accessToken } = req.body;
    const requestId = Math.random().toString(36).substring(7);
    console.log(`${new Date().toISOString()} | [${requestId}] DB Upsert Request for ${userId}`);
    
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (!profileData) return res.status(400).json({ error: "Missing profileData" });

    try {
      // Create a FRESH client for this request to avoid connection pooling issues
      // and add a timeout to the fetch operation
      const getClient = () => {
        const options: any = {
          auth: { persistSession: false },
          global: {
            fetch: (url: string, opts: any) => {
              // Use a 45s timeout for database operations
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 45000);
              return fetch(url, { 
                ...opts, 
                signal: controller.signal 
              }).finally(() => clearTimeout(timeoutId));
            }
          }
        };

        if (accessToken && (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY === ANON_KEY)) {
          return createClient(SUPABASE_URL, ANON_KEY, {
            ...options,
            global: { 
              ...options.global,
              headers: { Authorization: `Bearer ${accessToken}` } 
            }
          });
        }
        return createClient(SUPABASE_URL, SERVICE_ROLE_KEY || ANON_KEY, options);
      };

      // Ensure the ID is set correctly in the payload
      const payload: any = { 
        ...profileData,
        id: userId,
        updated_at: new Date().toISOString()
      };

      // Recursive recovery for missing columns (PGRST204 or 42703) or 5xx errors
      const performUpsertWithRecovery = async (currentPayload: any, attempt = 1): Promise<{ data: any, error: any, removedColumns: string[] }> => {
        const removedColumns: string[] = [];
        const payloadStr = JSON.stringify(currentPayload);
        const payloadSize = payloadStr.length;
        
        console.log(`[${requestId}] [Attempt ${attempt}] Payload size: ${(payloadSize / 1024).toFixed(2)} KB | Keys:`, Object.keys(currentPayload));
        
        try {
          const client = getClient();
          // On later attempts, don't use .select() to keep the response small and avoid timeouts
          const query = client.from('profiles').upsert(currentPayload, { onConflict: 'id' });
          
          let result;
          if (attempt < 3) {
            result = await query.select();
          } else {
            result = await query;
          }

          const { data, error } = result;

          // PGRST204 is PostgREST "Column not found", 42703 is Postgres "Column does not exist"
          const isColumnError = error && (
            error.code === 'PGRST204' || 
            error.code === '42703' || 
            error.message?.includes("column") || 
            error.message?.includes("schema cache")
          );

          // Detect 520 or 5xx errors
          const err = error as any;
          const isServerError = err && (
            err.status === 520 || 
            err.status >= 500 || 
            (typeof err.message === 'string' && (
              err.message.includes("520") || 
              err.message.includes("500") ||
              err.message.includes("Cloudflare") ||
              err.message.includes("<title>") ||
              err.message.includes("unknown error") ||
              err.message.includes("timeout") ||
              err.message.includes("fetch")
            )) ||
            !err.status // Network errors often have no status
          );

          // If payload is MASSIVE (> 2MB), start stripping immediately even on attempt 1 if it failed
          if (isServerError && payloadSize > 2 * 1024 * 1024 && attempt === 1) {
            console.warn(`[${requestId}] 🚨 Payload too large (${(payloadSize / 1024).toFixed(2)} KB). Forcing Safe Mode.`);
            const nextPayload = { ...currentPayload };
            if (nextPayload.social_profiles) {
              nextPayload.social_profiles = nextPayload.social_profiles.map((p: any) => {
                const { raw_apify_data, recent_posts, ...rest } = p;
                return rest;
              });
            }
            return performUpsertWithRecovery(nextPayload, attempt + 1);
          }

          if (isColumnError && attempt < 10) {
            console.warn(`[${requestId}] [Attempt ${attempt}] Column error: ${error.message}`);
            
            const missingColumnMatch = error.message.match(/column "([^"]+)"/) || 
                                     error.message.match(/column '([^']+)'/);
            
            let missingColumn = missingColumnMatch ? missingColumnMatch[1] : null;
            
            if (missingColumn && currentPayload[missingColumn] !== undefined) {
              const nextPayload = { ...currentPayload };
              delete nextPayload[missingColumn];
              const result = await performUpsertWithRecovery(nextPayload, attempt + 1);
              return { ...result, removedColumns: [missingColumn, ...result.removedColumns] };
            }
          }

          // Handle 520/5xx errors with retries and eventually stripping heavy data
          if (isServerError && attempt < 12) {
            console.warn(`[${requestId}] [Attempt ${attempt}] Server Error (520/5xx). Retrying...`);
            
            let nextPayload = { ...currentPayload };
            let strippedSomething = false;
            let strippedLabel = "";

            // Progressive stripping logic - even more aggressive now
            if (attempt === 2 && nextPayload.social_profiles) {
              // Strip raw_apify_data from all profiles
              nextPayload.social_profiles = nextPayload.social_profiles.map((p: any) => {
                const { raw_apify_data, ...rest } = p;
                return rest;
              });
              strippedSomething = true;
              strippedLabel = "raw_apify_data";
            } 
            else if (attempt === 3 && nextPayload.social_profiles) {
              // Strip recent_posts (often large)
              nextPayload.social_profiles = nextPayload.social_profiles.map((p: any) => {
                const { recent_posts, ...rest } = p;
                return rest;
              });
              strippedSomething = true;
              strippedLabel = "recent_posts";
            }
            else if (attempt === 4 && nextPayload.avatar_url && nextPayload.avatar_url.length > 1000) {
              // Strip large avatar_url
              delete nextPayload.avatar_url;
              strippedSomething = true;
              strippedLabel = "avatar_url";
            }
            else if (attempt === 5 && nextPayload.social_profiles) {
              // Truncate analysis_ai fields significantly
              nextPayload.social_profiles = nextPayload.social_profiles.map((p: any) => {
                if (p.analysis_ai) {
                  const { diagnostic, next_post_recommendation, ...rest } = p.analysis_ai;
                  // Keep only essential diagnostic info
                  const miniDiag = diagnostic ? { 
                    status_label: diagnostic.status_label,
                    key_action_item: (diagnostic.key_action_item || "").substring(0, 100)
                  } : undefined;
                  return { ...p, analysis_ai: { ...rest, diagnostic: miniDiag } };
                }
                return p;
              });
              strippedSomething = true;
              strippedLabel = "truncated analysis_ai";
            }
            else if (attempt === 6 && nextPayload.settings) {
              delete nextPayload.settings;
              strippedSomething = true;
              strippedLabel = "settings";
            }
            else if (attempt === 7 && nextPayload.social_profiles) {
              // Strip analysis_ai entirely from all profiles
              nextPayload.social_profiles = nextPayload.social_profiles.map((p: any) => {
                const { analysis_ai, ...rest } = p;
                return rest;
              });
              strippedSomething = true;
              strippedLabel = "analysis_ai (Nuclear)";
            }
            else if (attempt === 8 && nextPayload.social_profiles) {
              // Only keep the VERY LAST profile
              if (nextPayload.social_profiles.length > 1) {
                nextPayload.social_profiles = [nextPayload.social_profiles[nextPayload.social_profiles.length - 1]];
                strippedSomething = true;
                strippedLabel = "all but last profile";
              }
            }
            else if (attempt === 9 && nextPayload.social_profiles) {
              delete nextPayload.social_profiles;
              strippedSomething = true;
              strippedLabel = "social_profiles (Nuclear)";
            }
            else if (attempt >= 10) {
              // Absolute minimal payload
              nextPayload = { id: userId, updated_at: new Date().toISOString() };
              strippedSomething = true;
              strippedLabel = "everything but ID (Absolute Minimal)";
            }

            if (strippedSomething) {
              console.log(`[${requestId}] ⚠️ SAFE MODE: Stripping ${strippedLabel} for next attempt`);
              // Add a small delay before retry in safe mode
              await new Promise(resolve => setTimeout(resolve, 1000));
              return performUpsertWithRecovery(nextPayload, attempt + 1);
            }

            // Exponential backoff for non-stripping retries
            const delay = Math.min(500 * Math.pow(2, attempt - 1), 10000);
            await new Promise(resolve => setTimeout(resolve, delay));
            return performUpsertWithRecovery(currentPayload, attempt + 1);
          }

          return { data, error, removedColumns };
        } catch (exc: any) {
          console.error(`[${requestId}] [Attempt ${attempt}] Exception:`, exc.message);
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return performUpsertWithRecovery(currentPayload, attempt + 1);
          }
          return { data: null, error: exc, removedColumns: [] };
        }
      };

      const { data, error, removedColumns } = await performUpsertWithRecovery(payload);
      
      if (error) {
        const errorMsg = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
        console.error(`[${requestId}] Final Error:`, errorMsg.substring(0, 500));
        return res.status(400).json({ error: "SUPABASE_UPSERT_ERROR", message: errorMsg });
      }
      
      return res.json({ status: "ok", data, recovered: removedColumns.length > 0, removedColumns });
    } catch (error: any) {
      console.error(`[${requestId}] Global Exception:`, error);
      return res.status(500).json({ error: "DB_PROXY_EXCEPTION", message: error.message });
    }
  });

  // Auth Proxy Route (Fallback for metadata updates)
  app.post("/api/auth/update-metadata", async (req, res) => {
    const { userId, metadata } = req.body;
    console.log(`${new Date().toISOString()} | Auth Metadata Update Request for ${userId}`);
    
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (!metadata) return res.status(400).json({ error: "Missing metadata" });

    try {
      if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY === ANON_KEY) {
        console.warn("SERVICE_ROLE_KEY is missing or same as ANON_KEY. Auth Admin operations will likely fail.");
        return res.status(403).json({
          error: "AUTH_CONFIG_ERROR",
          message: "O servidor não está configurado com a SERVICE_ROLE_KEY necessária para esta operação."
        });
      }

      console.log(`Attempting admin metadata update for user ${userId}...`);
      const { data, error } = await supabaseServer.auth.admin.updateUserById(userId, {
        user_metadata: metadata
      });
      
      if (error) {
        console.error("Supabase Auth Admin Update Error:", error);
        
        // If it's a permission error, it might be the key
        if (error.status === 403 || error.code === 'not_admin' || error.message?.includes("not allowed")) {
           return res.status(403).json({
             error: "AUTH_PERMISSION_ERROR",
             message: "O servidor não tem permissão administrativa (SERVICE_ROLE_KEY pode estar incorreta).",
             details: error
           });
        }

        return res.status(error.status || 500).json({ 
          error: "SUPABASE_AUTH_ERROR", 
          message: error.message,
          details: error
        });
      }
      console.log("✅ Auth Admin metadata update successful");
      return res.json({ status: "ok", data });
    } catch (error: any) {
      console.error("Auth Proxy Exception:", error);
      return res.status(500).json({ 
        error: "AUTH_PROXY_EXCEPTION", 
        message: error.message || "Erro interno ao atualizar metadados via proxy." 
      });
    }
  });

  // Hooks Library Proxy Routes
  app.get("/api/db/hooks", async (req, res) => {
    const { userId } = req.query;
    console.log(`${new Date().toISOString()} | DB Get Hooks Request for ${userId}`);
    
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    try {
      const { data, error } = await supabaseServer
        .from('hooks_library')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Supabase Get Hooks Error:", error);
        return res.status(400).json({ error: "SUPABASE_ERROR", message: error.message });
      }
      return res.json({ status: "ok", data });
    } catch (error: any) {
      console.error("DB Get Hooks Proxy Exception:", error);
      return res.status(500).json({ error: "DB_GET_HOOKS_EXCEPTION", message: error.message });
    }
  });

  app.post("/api/db/hooks", async (req, res) => {
    const { userId, payload } = req.body;
    console.log(`${new Date().toISOString()} | DB Insert Hooks Request for ${userId}`);
    
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (!payload) return res.status(400).json({ error: "Missing payload" });

    try {
      // Ensure userId is set on all items if it's an array
      const itemsToInsert = Array.isArray(payload) 
        ? payload.map(item => ({ ...item, user_id: userId }))
        : { ...payload, user_id: userId };

      const { data, error } = await supabaseServer
        .from('hooks_library')
        .insert(itemsToInsert)
        .select();
      
      if (error) throw error;
      return res.json({ status: "ok", data });
    } catch (error: any) {
      console.error("DB Insert Hooks Error:", error);
      return res.status(500).json({ error: "DB_INSERT_HOOKS_ERROR", message: error.message });
    }
  });

  app.delete("/api/db/hooks/:id", async (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;
    console.log(`${new Date().toISOString()} | DB Delete Hook Request for ${id} (User: ${userId})`);
    
    if (!id) return res.status(400).json({ error: "Missing id" });
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    try {
      const { error } = await supabaseServer
        .from('hooks_library')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) throw error;
      return res.json({ status: "ok" });
    } catch (error: any) {
      console.error("DB Delete Hook Error:", error);
      return res.status(500).json({ error: "DB_DELETE_HOOK_ERROR", message: error.message });
    }
  });

  // Content Blueprints Proxy Routes
  app.get("/api/db/blueprints", async (req, res) => {
    const { userId } = req.query;
    console.log(`${new Date().toISOString()} | DB Get Blueprints Request for ${userId}`);
    
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    try {
      const { data, error } = await supabaseServer
        .from('content_blueprints')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return res.json({ status: "ok", data });
    } catch (error: any) {
      console.error("DB Get Blueprints Error:", error);
      return res.status(500).json({ error: "DB_GET_BLUEPRINTS_ERROR", message: error.message });
    }
  });

  app.post("/api/db/blueprints", async (req, res) => {
    const { userId, payload } = req.body;
    console.log(`${new Date().toISOString()} | DB Insert Blueprint Request for ${userId}`);
    
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (!payload) return res.status(400).json({ error: "Missing payload" });

    try {
      const itemToInsert = { ...payload, user_id: userId };

      const { data, error } = await supabaseServer
        .from('content_blueprints')
        .insert(itemToInsert)
        .select();
      
      if (error) throw error;
      return res.json({ status: "ok", data });
    } catch (error: any) {
      console.error("DB Insert Blueprint Error:", error);
      return res.status(500).json({ error: "DB_INSERT_BLUEPRINT_ERROR", message: error.message });
    }
  });

  app.patch("/api/db/blueprints/:id", async (req, res) => {
    const { id } = req.params;
    const { userId, payload } = req.body;
    console.log(`${new Date().toISOString()} | DB Patch Blueprint Request for ${id}`);
    
    if (!id) return res.status(400).json({ error: "Missing id" });
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (!payload) return res.status(400).json({ error: "Missing payload" });

    try {
      const { data, error } = await supabaseServer
        .from('content_blueprints')
        .update(payload)
        .eq('id', id)
        .eq('user_id', userId)
        .select();
      
      if (error) throw error;
      return res.json({ status: "ok", data });
    } catch (error: any) {
      console.error("DB Patch Blueprint Error:", error);
      return res.status(500).json({ error: "DB_PATCH_BLUEPRINT_ERROR", message: error.message });
    }
  });

  app.delete("/api/db/blueprints/:id", async (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;
    console.log(`${new Date().toISOString()} | DB Delete Blueprint Request for ${id}`);
    
    if (!id) return res.status(400).json({ error: "Missing id" });
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    try {
      const { error } = await supabaseServer
        .from('content_blueprints')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) throw error;
      return res.json({ status: "ok" });
    } catch (error: any) {
      console.error("DB Delete Blueprint Error:", error);
      return res.status(500).json({ error: "DB_DELETE_BLUEPRINT_ERROR", message: error.message });
    }
  });

  // Road Strategies Proxy Routes
  app.get("/api/db/road-strategies", async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    try {
      const { data, error } = await supabaseServer
        .from('road_strategies')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return res.json({ status: "ok", data });
    } catch (error: any) {
      console.error("DB Get Road Strategies Error:", error);
      return res.status(500).json({ error: "DB_GET_ROAD_STRATEGIES_ERROR", message: error.message });
    }
  });

  app.post("/api/db/road-strategies", async (req, res) => {
    const { userId, payload } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (!payload) return res.status(400).json({ error: "Missing payload" });

    try {
      const itemToInsert = { ...payload, user_id: userId };
      const { data, error } = await supabaseServer
        .from('road_strategies')
        .insert(itemToInsert)
        .select();
      
      if (error) throw error;
      return res.json({ status: "ok", data });
    } catch (error: any) {
      console.error("DB Insert Road Strategy Error:", error);
      return res.status(500).json({ error: "DB_INSERT_ROAD_STRATEGY_ERROR", message: error.message });
    }
  });

  // Usage Limits Proxy Routes
  app.get("/api/db/usage", async (req, res) => {
    const { userId } = req.query;
    console.log(`${new Date().toISOString()} | DB Get Usage Request for ${userId}`);
    
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    try {
      const { data, error } = await supabaseServer
        .from('usage_limits')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return res.json({ status: "ok", data });
    } catch (error: any) {
      console.error("DB Get Usage Error:", error);
      return res.status(500).json({ error: "DB_GET_USAGE_ERROR", message: error.message });
    }
  });

  app.post("/api/db/usage/increment", async (req, res) => {
    const { userId } = req.body;
    console.log(`${new Date().toISOString()} | DB Increment Usage Request for ${userId}`);
    
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    try {
      // Get current usage
      const { data: usageData, error: getError } = await supabaseServer
        .from('usage_limits')
        .select('used_this_month')
        .eq('user_id', userId)
        .single();
      
      if (getError && getError.code !== 'PGRST116') throw getError;
      
      const newUsedCount = (usageData?.used_this_month || 0) + 1;
      
      const { data, error } = await supabaseServer
        .from('usage_limits')
        .upsert({ 
          user_id: userId, 
          used_this_month: newUsedCount,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select();
      
      if (error) throw error;
      return res.json({ status: "ok", data });
    } catch (error: any) {
      console.error("DB Increment Usage Error:", error);
      return res.status(500).json({ error: "DB_INCREMENT_USAGE_ERROR", message: error.message });
    }
  });

  // Apify Proxy Route
  app.post("/api/apify-proxy", async (req, res) => {
    console.log("Apify Proxy Request received");
    try {
      if (!APIFY_TOKEN || APIFY_TOKEN.length < 10) {
        console.error("APIFY_TOKEN MISSING");
        return res.status(500).json({ 
          error: "APIFY_CONFIGURATION_ERROR", 
          message: "O token do Apify não foi configurado no ambiente (APIFY_TOKEN)." 
        });
      }

      let { platform, payload } = req.body || {};
      platform = platform ? platform.toString().toLowerCase().trim() : '';
      const actorId = ACTOR_IDS[platform];

      if (!actorId) {
        return res.status(400).json({ error: `Plataforma '${platform}' não suportada ou inválida.` });
      }

      // Adicionado timeout de 55 segundos para evitar 504 do gateway
      const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&memory=2048&timeout=55`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            console.error("Apify Error Body:", errorBody);

            if (response.status === 504 || response.status === 408) {
              return res.status(504).json({ 
                error: "APIFY_TIMEOUT", 
                message: "A plataforma demorou muito para responder. Tente novamente em instantes." 
              });
            }
            
            return res.status(response.status).json({
              error: "APIFY_API_ERROR",
              message: errorBody.error?.message || errorBody.message || `Erro ${response.status} no Apify`,
              details: errorBody
            });
        }

        const data = await response.json();
        return res.status(200).json(data);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          return res.status(504).json({ error: "TIMEOUT", message: "Tempo limite de requisição excedido." });
        }
        throw fetchError;
      }
    } catch (error: any) {
      console.error("Proxy Error:", error);
      
      if (error.message?.includes("401")) {
        return res.status(401).json({ 
          error: "APIFY_AUTH_ERROR", 
          message: "Falha na autenticação com Apify. Verifique o APIFY_TOKEN." 
        });
      }
      
      if (error.message?.includes("404")) {
        return res.status(404).json({ 
          error: "APIFY_ACTOR_NOT_FOUND", 
          message: "O Actor do Apify não foi encontrado. Verifique os ACTOR_IDS." 
        });
      }

      return res.status(500).json({ 
        error: "APIFY_PROXY_ERROR", 
        message: error.message || "Erro interno no proxy do Apify." 
      });
    }
  });

  // Apify Health Route
  app.get("/api/apify-health", async (req, res) => {
    try {
      if (!APIFY_TOKEN || APIFY_TOKEN.length < 10) {
        return res.json({ status: "error", message: "Token Apify ausente" });
      }
      const response = await fetch(`https://api.apify.com/v2/users/me?token=${APIFY_TOKEN}`);
      if (response.ok) {
        const data = await response.json();
        return res.json({ status: "ok", user: data.data.username || data.data.email });
      }
      return res.json({ status: "error", message: "Token Apify inválido ou expirado" });
    } catch (error: any) {
      return res.json({ status: "error", message: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Running in DEVELOPMENT mode with Vite middleware");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Running in PRODUCTION mode");
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  // Global Error Handler (After Routes)
  app.use((err: any, req: any, res: any, next: any) => {
    console.error(`[GLOBAL ERROR] ${new Date().toISOString()} | ${req.method} ${req.url}:`, err);
    if (res.headersSent) return next(err);
    res.status(500).json({ 
      error: "INTERNAL_SERVER_ERROR", 
      message: err.message || "Ocorreu um erro inesperado no servidor." 
    });
  });

  try {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[${new Date().toISOString()}] VIRAL ROAD Server is fully operational on port ${PORT}`);
      console.log(`[${new Date().toISOString()}] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[${new Date().toISOString()}] Supabase URL: ${SUPABASE_URL}`);
    });
  } catch (listenError) {
    console.error("FAILED TO START SERVER:", listenError);
    process.exit(1);
  }
}

startServer().catch(err => {
  console.error("CRITICAL SERVER ERROR:", err);
  process.exit(1);
});
