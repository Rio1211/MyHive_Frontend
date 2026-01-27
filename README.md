# My Hive (The Employee Management System)

## How to run
1. Clone Repository
```bash
git clone https://csgit.ucalgary.ca/rio.he1/seng513-202504-group-20.git
cd project
```
2. Install dependencies

```bash
cd backend
npm install
```

```bash
cd ../frontend
npm install
```
3. Set up enviroment variables
- Copy .env.examples to .env
- Backend .env.example to .env
```bash
PORT=5233
MONGO_URI=mongodb://mongo:27017/ems_db
```
- Frontend .env
```bash
REACT_APP_API_URL=http://localhost:5001
```
4. Run app with Docker
```bash
docker compose up -d --build
```
5. Access app
- Frontend:http://localhost:5173
- backend:http://localhost:5233
- Mongodb: localhost:27017

6. Stop containers
```bash
docker-compose down
```

## Database
- /model/(Mongoose models)
- database_schema.md
- userSeed.js
- departmentSeed.js

### Running Seeding Scripts 
- While the docker is up run
- User seed
```
docker exec -it seng513-202504-group-20-backend-1 node userSeed.js
```
- Department Seed
```
docker exec -it seng513-202504-group-20-backend-1 node departmentSeed.js
```

# Backend
 **If you are want to set up the backend on your own machine, the steps above will work. However, if you want to set up the backend on your own machine, you will need to set up a mongodb instance and set the MONGO_URI environment variable to point to your mongodb instance. You will also need to set up a .env file in the backend directory**