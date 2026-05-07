When the repo is cloned, run for each project:
```sh
bun install
```

Add ```.env``` file with the follow template:
```
MONGO_URI=mongodb://localhost:27017
JWT_SECRET=clave_secreta
```
into the ```/salesCatalogAppAPI/``` directory.

## Run Frontend
```sh
bun dev
```
## Run Backend
```sh
bun run dev
```