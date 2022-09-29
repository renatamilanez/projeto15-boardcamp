import express from 'express';
import pkg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

const {Pool} = pkg;
const server = express();
server.use(cors());
server.use(express.json());
dotenv.config({path: '../.env'});
const connection = new Pool({
    connectionString: process.env.DATABASE_URL,
});

server.get('/categories', async (req, res) => {
  try {
    const categories = await connection.query('SELECT * FROM categories;');
    res.send(categories.rows);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.post('/categories', async (req, res) => {
  const {name} = req.body;

  try {
    if(!name || name === ''){
      res.sendStatus(400);
      return
    }
  
    const duplicate = await connection.query(
      'SELECT name FROM categories WHERE name LIKE $1', 
      [name]
    );
  
    if(duplicate.rows.length > 0){
      res.sendStatus(409);
      return
    }
  
    await connection.query(
      'INSERT INTO categories (name) VALUES ($1);',
      [name]
    );
    res.sendStatus(201);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

server.listen(4000, () => {
    console.log('Listening on Port 4000');
});