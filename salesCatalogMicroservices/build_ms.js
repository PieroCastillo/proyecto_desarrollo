import fs from 'fs';
import path from 'path';

const sourceDir = 'D:\\Catalogo_DS\\proyecto_desarrollo\\salesCatalogAppAPI';
const destBaseDir = 'D:\\Catalogo_DS\\proyecto_desarrollo\\salesCatalogMicroservices';

const services = [
  { name: 'auth-service', port: 3001, routes: ['auth', 'clients', 'consultants'] },
  { name: 'catalog-service', port: 3002, routes: ['products'] },
  { name: 'orders-service', port: 3003, routes: ['orders', 'dashboard', 'routes', 'trainings'] }
];

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    if (element === 'node_modules' || element === '.env' || element === '.git') return;
    const stat = fs.lstatSync(path.join(from, element));
    if (stat.isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else if (stat.isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
}

function generateIndexTs(serviceName, routes) {
  const imports = routes.map(r => "import " + r + " from './routes/" + r + "'").join('\n');
  const routeMounts = routes.map(r => "app.route('/api', " + r + ")").join('\n');
  
  return `import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwtMiddleware } from './middleware/auth'
import { serve } from '@hono/node-server'

${imports}

const app = new Hono()

app.use('/api/*', cors())
app.use('/api/*', jwtMiddleware)

${routeMounts}

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
console.log("🚀 Servicio " + "${serviceName}" + " corriendo en el puerto " + port);

serve({
  fetch: app.fetch,
  port: port
})
`;
}

const dockerfileContent = `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001 3002 3003
CMD ["npm", "run", "dev"]
`;

services.forEach(svc => {
  const targetDir = path.join(destBaseDir, svc.name);
  console.log("Creando " + svc.name + "...");
  
  copyFolderSync(sourceDir, targetDir);
  
  const indexTsPath = path.join(targetDir, 'src', 'index.ts');
  fs.writeFileSync(indexTsPath, generateIndexTs(svc.name, svc.routes));
  
  const dockerfilePath = path.join(targetDir, 'Dockerfile');
  fs.writeFileSync(dockerfilePath, dockerfileContent);
  
  const pkgPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.name = svc.name;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }
});

console.log('¡Todos los microservicios han sido generados exitosamente!');
