import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API Granja de Cuyes',
    version: '1.0.0',
    description: 'Documentación automática de la API de gestión de granja de cuyes',
  },
  servers: [
    { url: 'http://localhost:4000', description: 'Desarrollo local' },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/**/*.ts', './src/schemas/**/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
