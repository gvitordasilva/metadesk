import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RequestBody {
  action: string;
  [key: string]: any;
}

// Database connection pool
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const databaseUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!databaseUrl) {
      throw new Error("SUPABASE_DB_URL not configured");
    }
    pool = new Pool(databaseUrl, 3, true);
  }
  return pool;
}

async function query(sql: string, params: any[] = []) {
  const pool = getPool();
  const connection = await pool.connect();
  try {
    const result = await connection.queryObject(sql, params);
    return result.rows;
  } finally {
    connection.release();
  }
}

async function queryOne(sql: string, params: any[] = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { action } = body;

    let result: any;

    switch (action) {
      case "getFlow":
        // Get active flow for webchat
        result = await queryOne(
          `SELECT * FROM chatbot_flows 
           WHERE id = $1 
           AND is_active = true 
           AND channel IN ('all', 'webchat')`,
          [body.flowId]
        );
        break;

      case "getEntryNode":
        // Get entry point node or first node by order
        result = await queryOne(
          `SELECT * FROM chatbot_nodes 
           WHERE flow_id = $1 
           AND is_active = true 
           AND is_entry_point = true
           LIMIT 1`,
          [body.flowId]
        );

        // Fallback to first node by order if no entry point
        if (!result) {
          result = await queryOne(
            `SELECT * FROM chatbot_nodes 
             WHERE flow_id = $1 
             AND is_active = true 
             ORDER BY node_order ASC
             LIMIT 1`,
            [body.flowId]
          );
        }
        break;

      case "getNode":
        result = await queryOne(
          `SELECT * FROM chatbot_nodes 
           WHERE id = $1 
           AND is_active = true`,
          [body.nodeId]
        );
        break;

      case "getNodeOptions":
        result = await query(
          `SELECT * FROM chatbot_node_options 
           WHERE node_id = $1 
           ORDER BY option_order ASC`,
          [body.nodeId]
        );
        break;

      default:
        return new Response(
          JSON.stringify({ ok: false, error: `Unknown action: ${action}`, code: "UNKNOWN_ACTION" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify({ ok: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chatbot public error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message, code: "SERVER_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
