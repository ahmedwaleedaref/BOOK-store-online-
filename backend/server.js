require('dotenv').config();

const app = require('./app');
const { testConnection } = require('./config/database');
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('Failed to connect to database. Please check your configuration.');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`

                                                       
    BOOKSTOR                   
                                                            
   Server is running on port ${PORT}                           
   Environment: ${process.env.NODE_ENV || 'development'}                              
                                                            
   API Base URL: http://localhost:${PORT}                      
   Health Check: http://localhost:${PORT}/health               
                                                           
   Database: ${process.env.DB_NAME || 'BookstoreDB'}                                  

      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();

module.exports = app;
