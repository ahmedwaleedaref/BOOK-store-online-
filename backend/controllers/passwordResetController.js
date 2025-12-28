const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { query } = require('../config/database');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Request password reset
const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user by email
    const users = await query(
      'SELECT user_id, email, first_name FROM USERS WHERE email = ?',
      [email]
    );

    // Always return success to prevent email enumeration
    if (users.length === 0) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent'
      });
    }

    const user = users[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    // Invalidate any existing tokens for this user
    await query(
      'UPDATE PASSWORD_RESET_TOKENS SET used = TRUE WHERE user_id = ? AND used = FALSE',
      [user.user_id]
    );

    // Store new token
    await query(
      'INSERT INTO PASSWORD_RESET_TOKENS (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.user_id, hashedToken, expiresAt]
    );

    // Create reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:80';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Send email
    if (process.env.SMTP_USER) {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"Bookstore" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Password Reset Request</h2>
            <p>Hello ${user.first_name || 'there'},</p>
            <p>You requested to reset your password. Click the button below to proceed:</p>
            <a href="${resetUrl}" 
               style="display: inline-block; background-color: #4F46E5; color: white; 
                      padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                      margin: 20px 0;">
              Reset Password
            </a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">Bookstore Online</p>
          </div>
        `
      });
    } else {
      // Log token for development
      console.log('Password reset token (dev mode):', resetToken);
      console.log('Reset URL:', resetUrl);
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent',
      // Include token in dev mode for testing
      ...(process.env.NODE_ENV === 'development' && { devToken: resetToken })
    });
  } catch (error) {
    next(error);
  }
};

// Verify reset token
const verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const tokens = await query(
      `SELECT t.token_id, t.user_id, t.expires_at, u.email
       FROM PASSWORD_RESET_TOKENS t
       JOIN USERS u ON t.user_id = u.user_id
       WHERE t.token = ? AND t.used = FALSE AND t.expires_at > NOW()`,
      [hashedToken]
    );

    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.json({
      success: true,
      data: { email: tokens[0].email }
    });
  } catch (error) {
    next(error);
  }
};

// Reset password with token
const resetPassword = async (req, res, next) => {
  try {
    const { token, new_password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const tokens = await query(
      `SELECT token_id, user_id, expires_at
       FROM PASSWORD_RESET_TOKENS
       WHERE token = ? AND used = FALSE AND expires_at > NOW()`,
      [hashedToken]
    );

    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    const tokenData = tokens[0];

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const password_hash = await bcrypt.hash(new_password, saltRounds);

    // Update password
    await query(
      'UPDATE USERS SET password_hash = ? WHERE user_id = ?',
      [password_hash, tokenData.user_id]
    );

    // Mark token as used
    await query(
      'UPDATE PASSWORD_RESET_TOKENS SET used = TRUE WHERE token_id = ?',
      [tokenData.token_id]
    );

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestPasswordReset,
  verifyResetToken,
  resetPassword
};
