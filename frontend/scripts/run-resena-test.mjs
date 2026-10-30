// run-resena-test.mjs
// Simple script to execute the POST handler for /api/resenas locally
// without needing a real Supabase instance. It mocks the Supabase client
// and invokes the handler directly.

import { POST } from "../src/app/api/api/resenas/route.js";

// ---- 1️⃣ Mock supabase client -------------------------------------------------
const mockSupabase = {
  auth: {
    async getUser() {
      return { data: { user: { id: "user-1" } }, error: null };
    },
  },
  from(table) {
    if (table === "reservas") {
      return {
        select() {
          return {
            eq() {
              return {
                eq() {
                  return {
                    limit() {
                      return {
                        single() {
                          // Simulate a confirmed reservation
                          return { data: { id: "reserva-1" }, error: null };
                        },
                      };
                    },
                  };
                },
                // fallback for other chained calls
                neq() { return this; },
                limit() { return this; },
                single() { return { data: null, error: { message: "none" } }; },
              };
            },
          };
        },
      };
    }
    if (table === "resenas_clientes") {
      return {
        // Check for duplicate reseña
        select(cols) {
          return {
            eq() {
              return {
                eq() {
                  return {
                    limit() {
                      return {
                        single() {
                          // No duplicate exists
                          return { data: null, error: null };
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        },
        insert(payload) {
          return {
            select() {
              return {
                single() {
                  // Return the inserted row with an artificial id
                  return { data: { ...payload, id: "reseña-1" }, error: null };
                },
              };
            },
          };
        },
      };
    }
    // default stub for any other table
    return { select: () => ({ single: async () => ({ data: null, error: null }) }) };
  },
};

// ---- 2️⃣ Monkey‑patch the module that creates the client ----------------------
// The route imports createSupabaseServerClient from '@/server/supabase/server'.
// We replace that function at runtime.
const path = require.resolve("../src/server/supabase/server.js");
const originalModule = await import(path);
originalModule.createSupabaseServerClient = async () => mockSupabase;

// ---- 3️⃣ Build a fake Request -------------------------------------------------
const body = JSON.stringify({
  comentario: "Excelente salón, muy recomendado",
  calificacion: 5,
  // reserva_id omitted to let the handler use the mock reserva.id
});

const req = new Request("http://localhost/api/resenas", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body,
});

// ---- 4️⃣ Invoke the handler --------------------------------------------------
POST(req)
  .then(async (res) => {
    const json = await res.json();
    console.log("Response status:", res.status);
    console.log("Body:", JSON.stringify(json, null, 2));
  })
  .catch((err) => {
    console.error("Handler threw:", err);
  });

