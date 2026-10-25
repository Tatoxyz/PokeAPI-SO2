# TatOS Pokedex API

API REST de una Pokédex construida con **Node.js + Express** y **PostgreSQL**,
desplegada en **TatOS**, un sistema operativo construido desde cero con
Linux From Scratch 12.4.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api` | Información de la API |
| GET | `/api/salud` | Estado del servidor y de la conexión a PostgreSQL |
| GET | `/api/pokemon` | Listar (filtros `?tipo=Agua&capturado=true`) |
| GET | `/api/pokemon/:numero` | Obtener por número de Pokédex |
| POST | `/api/pokemon` | Registrar un Pokémon |
| PUT | `/api/pokemon/:numero` | Actualizar campos de un Pokémon |
| DELETE | `/api/pokemon/:numero` | Eliminar un Pokémon |

## Ejecución

```bash
npm install
cp .env.example .env     # ajustar credenciales
npm start
```

La API escucha en `127.0.0.1:3000` y se publica a través de **Nginx** en el puerto 80.

## Pruebas

```bash
bash pruebas.sh http://127.0.0.1
```
