import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface ResendEmailRequest {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

async function sendEmail(request: ResendEmailRequest) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }
  
  return response.json();
}



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EmailTemplate = 'interest_accepted' | 'connection_request' | 'connection_accepted' | 'startup_update';

interface EmailPayload {
  to: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, any>;
}

function generateEmailHtml(template: EmailTemplate, data: Record<string, any>): string {
  const baseStyles = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px; }
    .content { padding: 32px; }
    .content h2 { color: #1f2937; margin: 0 0 16px; font-size: 22px; }
    .content p { color: #4b5563; line-height: 1.6; margin: 0 0 16px; }
    .highlight { background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; }
    .highlight strong { color: #1f2937; }
    .cta { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .footer { padding: 24px 32px; background: #f9fafb; text-align: center; }
    .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
  `;

  let content = '';

  switch (template) {
    case 'interest_accepted':
      content = `
        <h2>🎉 You've been accepted!</h2>
        <p>Great news! Your interest in <strong>${data.startupName}</strong> has been accepted by the founder.</p>
        <div class="highlight">
          <p><strong>Startup:</strong> ${data.startupName}</p>
          <p><strong>Founder:</strong> ${data.founderName}</p>
        </div>
        <p>You're now part of the team! Start collaborating and make an impact.</p>
        <a href="${data.ctaLink}" class="cta">View Startup</a>
      `;
      break;

    case 'connection_request':
      content = `
        <h2>👋 New Connection Request</h2>
        <p><strong>${data.senderName}</strong> wants to connect with you on CollabHub.</p>
        <div class="highlight">
          <p>Expand your professional network and discover new collaboration opportunities.</p>
        </div>
        <a href="${data.ctaLink}" class="cta">View Profile</a>
      `;
      break;

    case 'connection_accepted':
      content = `
        <h2>🤝 Connection Accepted!</h2>
        <p><strong>${data.accepterName}</strong> has accepted your connection request.</p>
        <div class="highlight">
          <p>You're now connected! Start a conversation to explore collaboration opportunities.</p>
        </div>
        <a href="${data.ctaLink}" class="cta">Start Conversation</a>
      `;
      break;

    case 'startup_update':
      content = `
        <h2>📢 New Update from ${data.startupName}</h2>
        <p>There's a new progress update from a startup you're following.</p>
        <div class="highlight">
          <p><strong>${data.updateTitle}</strong></p>
          ${data.updateSummary ? `<p>${data.updateSummary}</p>` : ''}
        </div>
        <a href="${data.ctaLink}" class="cta">View Update</a>
      `;
      break;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CollabHub</h1>
          <p>Where startups find their dream teams</p>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} CollabHub. All rights reserved.</p>
          <p>You received this email because you're a CollabHub member.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: EmailPayload = await req.json();
    
    console.log("Sending email notification:", {
      to: payload.to,
      template: payload.template,
      subject: payload.subject,
    });

    // Validate payload
    if (!payload.to || !payload.subject || !payload.template) {
      throw new Error("Missing required fields: to, subject, or template");
    }

    const html = generateEmailHtml(payload.template, payload.data);

    const emailResponse = await sendEmail({
      from: "CollabHub <collabhub.tech@gmail.com>",
      to: [payload.to],
      subject: payload.subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    
    // Return success to not block app flow, but log the error
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 200, // Don't return 500 to avoid blocking app
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
