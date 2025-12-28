const { generateInvoice } = require('../services/invoiceService');

describe('Invoice Service', () => {
  describe('generateInvoice', () => {
    it('should generate a PDF buffer', async () => {
      const mockOrder = {
        order_id: 1,
        order_date: new Date(),
        total_amount: 59.97,
        credit_card_number: '**** **** **** 4242',
        items: [
          { title: 'Test Book 1', book_isbn: '1234567890', quantity: 2, price_at_purchase: 19.99 },
          { title: 'Test Book 2', book_isbn: '0987654321', quantity: 1, price_at_purchase: 19.99 }
        ]
      };

      const mockUser = {
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        address: '123 Test St, Test City, TC 12345'
      };

      const pdfBuffer = await generateInvoice(mockOrder, mockUser);

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(0);
      // PDF files start with %PDF
      expect(pdfBuffer.toString('utf8', 0, 4)).toBe('%PDF');
    });

    it('should handle orders with no items', async () => {
      const mockOrder = {
        order_id: 2,
        order_date: new Date(),
        total_amount: 0,
        credit_card_number: '**** **** **** 1111',
        items: []
      };

      const mockUser = {
        username: 'testuser',
        email: 'test@example.com'
      };

      const pdfBuffer = await generateInvoice(mockOrder, mockUser);

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    });

    it('should handle missing user info gracefully', async () => {
      const mockOrder = {
        order_id: 3,
        order_date: new Date(),
        total_amount: 29.99,
        credit_card_number: '**** **** **** 2222',
        items: [
          { title: 'Book', book_isbn: '1111111111', quantity: 1, price_at_purchase: 29.99 }
        ]
      };

      const mockUser = {
        username: 'user123',
        email: 'user@test.com'
        // Missing first_name, last_name, address
      };

      const pdfBuffer = await generateInvoice(mockOrder, mockUser);

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    });
  });
});
