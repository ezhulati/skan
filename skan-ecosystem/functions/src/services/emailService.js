const sgMail = require("@sendgrid/mail");

// Configure SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "YOUR_SENDGRID_API_KEY_HERE";
const FROM_EMAIL = "noreply@skan.al";

sgMail.setApiKey(SENDGRID_API_KEY);

/**
 * Send user invitation email
 * @param {string} email - Recipient email address
 * @param {string} fullName - Full name of the invitee
 * @param {string} inviteToken - Invitation token
 * @param {string} venueName - Name of the venue/restaurant
 * @param {string} inviterName - Name of the person sending invitation
 * @returns {Promise<void>}
 */
async function sendInvitationEmail(email, fullName, inviteToken, venueName, inviterName) {
  try {
    const inviteUrl = `https://admin.skan.al/accept-invitation?token=${inviteToken}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Join ${venueName} on SKAN.AL</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
          .subtitle { font-size: 16px; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 18px; margin-bottom: 20px; color: #333; }
          .message { font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 30px; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0; }
          .cta-button:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
          .details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .detail-label { font-weight: bold; color: #333; }
          .detail-value { color: #666; }
          .footer { padding: 30px; text-align: center; border-top: 1px solid #eee; }
          .footer-text { font-size: 14px; color: #888; line-height: 1.5; }
          .security-note { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px; color: #856404; }
          @media (max-width: 600px) {
            .container { width: 100% !important; }
            .header, .content, .footer { padding: 20px !important; }
            .detail-row { flex-direction: column; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">SKAN.AL</div>
            <div class="subtitle">QR Restaurant Ordering System</div>
          </div>
          
          <div class="content">
            <div class="greeting">Përshëndetje ${fullName}!</div>
            
            <div class="message">
              <strong>${inviterName}</strong> ju ka ftuar të bashkoheni me ekipin e <strong>${venueName}</strong> në platformën SKAN.AL.
              <br><br>
              SKAN.AL është sistemi modern i porosive me kod QR që ndihmon restorantet të ofrojnë shërbim më të shpejtë dhe më efikas për klientët e tyre.
            </div>

            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Restoranti:</span>
                <span class="detail-value">${venueName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Ftuar nga:</span>
                <span class="detail-value">${inviterName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email-i juaj:</span>
                <span class="detail-value">${email}</span>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" class="cta-button">Pranoni Ftesën & Krijoni Llogarinë</a>
            </div>
            
            <div class="security-note">
              <strong>🔒 Siguria:</strong> Ky link i ftesës është i vlefshëm për 7 ditë dhe mund të përdoret vetëm një herë. 
              Nëse nuk e keni kërkuar këtë ftesë, ju lutemi injoroni këtë email.
            </div>
            
            <div class="message">
              Pasi të pranoni ftesën, do të mund të:
              <ul>
                <li>Menaxhoni porositë në kohë reale</li>
                <li>Përditësoni statusin e porosive</li>
                <li>Shihni analitikën e performancës</li>
                <li>Bashkëpunoni me ekipin tuaj</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-text">
              <strong>SKAN.AL</strong> - Sistemi i Porosive me Kod QR për Restorantet Shqiptare
              <br>
              <a href="https://skan.al" style="color: #667eea;">skan.al</a> | 
              <a href="mailto:support@skan.al" style="color: #667eea;">support@skan.al</a>
              <br><br>
              Nëse keni pyetje ose probleme, mos hezitoni të na kontaktoni.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Përshëndetje ${fullName}!

${inviterName} ju ka ftuar të bashkoheni me ekipin e ${venueName} në platformën SKAN.AL.

SKAN.AL është sistemi modern i porosive me kod QR që ndihmon restorantet të ofrojnë shërbim më të shpejtë dhe më efikas për klientët e tyre.

Detajet e ftesës:
- Restoranti: ${venueName}
- Ftuar nga: ${inviterName}
- Email-i juaj: ${email}

Për të pranuar ftesën dhe krijuar llogarinë tuaj, klikoni këtu:
${inviteUrl}

SIGURIA: Ky link i ftesës është i vlefshëm për 7 ditë dhe mund të përdoret vetëm një herë.

Pasi të pranoni ftesën, do të mund të:
- Menaxhoni porositë në kohë reale
- Përditësoni statusin e porosive
- Shihni analitikën e performancës
- Bashkëpunoni me ekipin tuaj

Nëse keni pyetje ose probleme, mos hezitoni të na kontaktoni në support@skan.al

SKAN.AL - Sistemi i Porosive me Kod QR për Restorantet Shqiptare
https://skan.al
    `;

    const msg = {
      to: email,
      from: {
        email: FROM_EMAIL,
        name: "SKAN.AL Team"
      },
      subject: `Ftesë për të bashkuar ${venueName} në SKAN.AL`,
      text: textContent,
      html: htmlContent,
      categories: ["user-invitation"],
      customArgs: {
        venue: venueName,
        inviteToken: inviteToken
      }
    };

    const response = await sgMail.send(msg);
    
    console.log("📧 Invitation email sent successfully:", {
      to: email,
      venue: venueName,
      messageId: response[0]?.headers?.["x-message-id"]
    });

    return response;
    
  } catch (error) {
    console.error("❌ Failed to send invitation email:", {
      error: error.message,
      email,
      venueName,
      code: error.code
    });
    throw new Error(`Failed to send invitation email: ${error.message}`);
  }
}

/**
 * Send password reset email
 * @param {string} email - Recipient email address
 * @param {string} fullName - Full name of the user
 * @param {string} resetToken - Password reset token
 * @returns {Promise<void>}
 */
async function sendPasswordResetEmail(email, fullName, resetToken) {
  try {
    const resetUrl = `https://admin.skan.al/reset-password?token=${resetToken}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Rivendosni Fjalëkalimin - SKAN.AL</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">Rivendosni Fjalëkalimin</h2>
          
          <p>Përshëndetje ${fullName},</p>
          
          <p>Kemi marrë një kërkesë për të rivendosur fjalëkalimin tuaj në SKAN.AL.</p>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Rivendosni Fjalëkalimin
            </a>
          </p>
          
          <p style="font-size: 14px; color: #666;">
            Ky link është i vlefshëm për 15 minuta. Nëse nuk e keni kërkuar këtë rivendosje, ju lutemi injoroni këtë email.
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            SKAN.AL - Sistemi i Porosive me Kod QR<br>
            <a href="https://skan.al">skan.al</a>
          </p>
        </div>
      </body>
      </html>
    `;

    const msg = {
      to: email,
      from: {
        email: FROM_EMAIL,
        name: "SKAN.AL Team"
      },
      subject: "Rivendosni Fjalëkalimin - SKAN.AL",
      html: htmlContent,
      categories: ["password-reset"]
    };

    const response = await sgMail.send(msg);
    console.log("📧 Password reset email sent successfully:", email);
    return response;
    
  } catch (error) {
    console.error("❌ Failed to send password reset email:", error.message);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}

module.exports = {
  sendInvitationEmail,
  sendPasswordResetEmail
};