const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function generate() {
  console.log('Generating OpenAPI specification for TeachFlow Mobile...');
  const backendDir = 'D:/Backend_teachflow';
  
  const { Test } = require(path.join(backendDir, 'node_modules/@nestjs/testing'));
  const { SwaggerModule, DocumentBuilder } = require(path.join(backendDir, 'node_modules/@nestjs/swagger'));
  const { AppModule } = require(path.join(backendDir, 'dist/app.module'));

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('TeachFlow Mobile API')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  await app.close();

  const apiDir = path.resolve(__dirname, '../src/api');
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }

  const specPath = path.join(apiDir, 'openapi.json');
  fs.writeFileSync(specPath, JSON.stringify(document, null, 2), 'utf8');
  console.log(`✓ Saved OpenAPI spec to ${specPath}`);

  console.log('Generating TypeScript types from OpenAPI spec...');
  const typesPath = path.join(apiDir, 'openapi-types.ts');
  execSync(`npx openapi-typescript "${specPath}" -o "${typesPath}"`, { stdio: 'inherit' });
  console.log(`✓ Generated TypeScript types at ${typesPath}`);
}

generate().catch((err) => {
  console.error('Error generating OpenAPI spec:', err);
  process.exit(1);
});
