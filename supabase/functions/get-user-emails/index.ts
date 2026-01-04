import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller is authenticated by validating their JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing Authorization header");
      throw new Error("Unauthorized: Missing authorization header");
    }

    // Create a client with the user's JWT to verify they're authenticated
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      }
    );

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      throw new Error("Unauthorized: Invalid token");
    }

    console.log("Request from authenticated user:", user.id);

    const { user_ids } = await req.json();

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      throw new Error("user_ids array is required");
    }

    console.log("Fetching emails for user_ids:", user_ids);

    // Use service role key to access auth.users
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Fetch user emails from auth.users
    const emails: Record<string, string> = {};
    
    for (const userId of user_ids) {
      try {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (!error && data?.user?.email) {
          emails[userId] = data.user.email;
          console.log(`Found email for user ${userId}`);
        } else {
          console.warn(`Could not get email for user ${userId}:`, error?.message);
        }
      } catch (err) {
        console.error(`Error fetching user ${userId}:`, err);
      }
    }

    console.log(`Returning ${Object.keys(emails).length} emails`);

    return new Response(JSON.stringify({ emails }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in get-user-emails:", error.message);
    return new Response(
      JSON.stringify({ error: error.message, emails: {} }),
      {
        status: error.message.includes("Unauthorized") ? 401 : 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
