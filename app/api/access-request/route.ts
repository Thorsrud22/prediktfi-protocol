import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, twitterHandle, walletAddress, communities, focus } = body;

    // Validate input
    if (!email || !twitterHandle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Structure the email content
    const timestamp = new Date().toISOString();
    const interests = Array.isArray(focus) ? focus.join(', ') : 'None selected';

    // Send email via Resend
    const { error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'prediktfun@gmail.com',
      subject: `🚀 Access Request: @${twitterHandle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #3B82F6; margin-bottom: 24px;">New Alpha Access Request</h1>
          
          <div style="background: #1E293B; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="color: #F8FAFC; margin: 0 0 16px 0; font-size: 18px;">User Profile</h2>
            <table style="width: 100%; color: #94A3B8;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #334155;"><strong>Twitter:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #334155; color: #F8FAFC;">
                    <a href="https://twitter.com/${twitterHandle.replace('@', '')}" style="color: #38BDF8;">@${twitterHandle.replace('@', '')}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #334155;"><strong>Email:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #334155; color: #F8FAFC;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #334155;"><strong>Wallet:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #334155; color: #F8FAFC; font-family: monospace;">${walletAddress || 'Not provided'}</td>
              </tr>
               <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #334155;"><strong>Communities:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #334155; color: #F8FAFC;">${communities || 'None listed'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Interests:</strong></td>
                <td style="padding: 8px 0; color: #F8FAFC;">${interests}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #0F172A; border-radius: 12px; padding: 24px; border: 1px solid #334155;">
            <h2 style="color: #F8FAFC; margin: 0 0 16px 0; font-size: 18px;">Action Required</h2>
            <ul style="color: #94A3B8; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Review applicant background</li>
              <li style="margin-bottom: 8px;">Add to whitelist if qualified</li>
              <li>Send welcome kit</li>
            </ul>
          </div>
          
          <p style="color: #64748B; font-size: 12px; margin-top: 24px;">
            Received: ${timestamp}
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Access request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
