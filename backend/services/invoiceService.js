const PDFDocument = require('pdfkit');

/**
 * Generate PDF invoice for an order
 * @param {Object} order - Order data with items
 * @param {Object} user - User data
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateInvoice = (order, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Header
      doc.fontSize(24).fillColor('#4F46E5').text('BOOKSTORE', 50, 50);
      doc.fontSize(10).fillColor('#666').text('Online Bookstore', 50, 80);
      
      // Invoice title
      doc.fontSize(20).fillColor('#000').text('INVOICE', 400, 50, { align: 'right' });
      doc.fontSize(10).fillColor('#666').text(`#INV-${order.order_id.toString().padStart(6, '0')}`, 400, 75, { align: 'right' });

      // Divider
      doc.moveTo(50, 110).lineTo(550, 110).stroke('#eee');

      // Customer info
      doc.fontSize(12).fillColor('#000').text('Bill To:', 50, 130);
      doc.fontSize(10).fillColor('#333')
        .text(`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username, 50, 148)
        .text(user.email, 50, 163)
        .text(user.address || '', 50, 178);

      // Order info
      doc.fontSize(12).fillColor('#000').text('Order Details:', 350, 130);
      doc.fontSize(10).fillColor('#333')
        .text(`Order Date: ${new Date(order.order_date).toLocaleDateString()}`, 350, 148)
        .text(`Order ID: ${order.order_id}`, 350, 163)
        .text(`Payment: ${order.credit_card_number}`, 350, 178);

      // Table header
      const tableTop = 230;
      doc.fillColor('#4F46E5').rect(50, tableTop, 500, 25).fill();
      doc.fillColor('#fff').fontSize(10)
        .text('Item', 60, tableTop + 8)
        .text('ISBN', 250, tableTop + 8)
        .text('Qty', 370, tableTop + 8)
        .text('Price', 420, tableTop + 8)
        .text('Total', 480, tableTop + 8);

      // Table rows
      let y = tableTop + 35;
      const items = order.items || [];
      
      items.forEach((item, index) => {
        const bgColor = index % 2 === 0 ? '#f9fafb' : '#fff';
        doc.fillColor(bgColor).rect(50, y - 5, 500, 25).fill();
        
        doc.fillColor('#333').fontSize(9)
          .text(item.title ? item.title.substring(0, 30) : 'Book', 60, y)
          .text(item.book_isbn || item.isbn, 250, y)
          .text(item.quantity.toString(), 375, y)
          .text(`$${parseFloat(item.price_at_purchase || item.price).toFixed(2)}`, 420, y)
          .text(`$${(item.quantity * parseFloat(item.price_at_purchase || item.price)).toFixed(2)}`, 480, y);
        
        y += 25;
      });

      // Totals
      y += 20;
      doc.moveTo(350, y).lineTo(550, y).stroke('#eee');
      y += 15;

      const subtotal = parseFloat(order.total_amount);
      const tax = subtotal * 0; // No tax in this system
      const total = subtotal + tax;

      doc.fontSize(10).fillColor('#333')
        .text('Subtotal:', 350, y)
        .text(`$${subtotal.toFixed(2)}`, 480, y, { align: 'right' });
      
      y += 20;
      doc.fontSize(12).fillColor('#000').font('Helvetica-Bold')
        .text('Total:', 350, y)
        .text(`$${total.toFixed(2)}`, 480, y, { align: 'right' });

      // Footer
      doc.fontSize(10).fillColor('#666').font('Helvetica')
        .text('Thank you for your purchase!', 50, 700, { align: 'center' })
        .text('Bookstore Online - Your trusted source for books', 50, 715, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateInvoice };
