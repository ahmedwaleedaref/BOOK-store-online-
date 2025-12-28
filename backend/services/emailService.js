const nodemailer = require('nodemailer');
const { generateInvoice } = require('./invoiceService');

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

/**
 * Send order confirmation email with PDF invoice
 */
const sendOrderConfirmation = async (order, user) => {
  // Skip if SMTP not configured
  if (!process.env.SMTP_USER) {
    console.log('SMTP not configured - skipping email notification');
    console.log('Order confirmation would be sent to:', user.email);
    return { skipped: true };
  }

  try {
    const transporter = createTransporter();
    
    // Generate PDF invoice
    const pdfBuffer = await generateInvoice(order, user);

    const itemsList = (order.items || [])
      .map(item => `<li>${item.title || 'Book'} (x${item.quantity}) - $${(item.quantity * parseFloat(item.price_at_purchase || item.price)).toFixed(2)}</li>`)
      .join('');

    await transporter.sendMail({
      from: `"Bookstore" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Order Confirmation #${order.order_id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Order Confirmed!</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Hello ${user.first_name || user.username},</p>
            <p>Thank you for your order! We're excited to confirm that your order has been placed successfully.</p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #4F46E5;">Order #${order.order_id}</h3>
              <p><strong>Date:</strong> ${new Date(order.order_date).toLocaleDateString()}</p>
              <p><strong>Total:</strong> $${parseFloat(order.total_amount).toFixed(2)}</p>
            </div>
            
            <h3>Items Ordered:</h3>
            <ul style="padding-left: 20px;">
              ${itemsList}
            </ul>
            
            <p>Your invoice is attached to this email as a PDF.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:80'}/my-orders/${order.order_id}" 
                 style="display: inline-block; background-color: #4F46E5; color: white; 
                        padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                View Order Details
              </a>
            </div>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p>Thank you for shopping with Bookstore Online!</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `invoice-${order.order_id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    console.log('Order confirmation email sent to:', user.email);
    return { sent: true };
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return { error: error.message };
  }
};

/**
 * Send welcome email to new users
 */
const sendWelcomeEmail = async (user) => {
  if (!process.env.SMTP_USER) {
    console.log('SMTP not configured - skipping welcome email');
    return { skipped: true };
  }

  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"Bookstore" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Welcome to Bookstore Online!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Welcome to Bookstore!</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Hello ${user.first_name || user.username},</p>
            <p>Thank you for joining Bookstore Online! We're thrilled to have you as part of our community of book lovers.</p>
            
            <h3>What you can do:</h3>
            <ul style="padding-left: 20px;">
              <li>Browse our extensive collection of books</li>
              <li>Create wishlists for books you want to read</li>
              <li>Read and write reviews</li>
              <li>Get personalized recommendations</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:80'}/books" 
                 style="display: inline-block; background-color: #4F46E5; color: white; 
                        padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Start Browsing
              </a>
            </div>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p>Happy reading!</p>
          </div>
        </div>
      `
    });

    return { sent: true };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { error: error.message };
  }
};

module.exports = {
  sendOrderConfirmation,
  sendWelcomeEmail
};
