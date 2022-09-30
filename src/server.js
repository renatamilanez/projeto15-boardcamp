import express from 'express';
import pkg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';
import Joi from 'joi';
import { stripHtml } from 'string-strip-html';

const {Pool} = pkg;
const server = express();
server.use(cors());
server.use(express.json());
dotenv.config({path: '../.env'});
const connection = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const categorieSchema = Joi.object({
  name: Joi.string().required(),
});

const gameSchema = Joi.object({
  name: Joi.string().required(),
  stockTotal: Joi.number().min(1).required(),
  pricePerDay: Joi.number().min(1).required(),
  categoryId: Joi.required(),
  image: Joi.string().required(),
});

//ROTA PRONTA E VERIFICADA
server.get('/categories', async (req, res) => {
  try {
    const categories = await connection.query('SELECT * FROM categories;');
    res.send(categories.rows);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

//ROTA PRONTA E VERIFICADA
server.post('/categories', async (req, res) => {
  try {
    let {name} = req.body;
    name = stripHtml(name).result.trim();
    const validation = categorieSchema.validate({name}, {abortEarly: false});

    if(validation.error){
        const errors = validation.error.details.map(detail => detail.message);
        res.status(400).send(errors);
        return;
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

//rota pronta e verificada
server.get('/games', async (req, res) => {
  try {
    const games = await connection.query('SELECT games.*, categories.name AS "categoryName" FROM games JOIN categories ON "categoryId" = categories.id;');
    res.send(games.rows);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

//rota pronta e verificada
server.post('/games', async (req, res) => {
  let {name, stockTotal, categoryId, pricePerDay, image} = req.body;
  name = stripHtml(name).result.trim();
  image = stripHtml(image).result.trim();

  try {
    const validation = gameSchema.validate({
      name, 
      stockTotal, 
      categoryId, 
      pricePerDay, 
      image
    }, {abortEarly: false});

    if(validation.error){
      const errors = validation.error.details.map(detail => detail.message);
      res.status(400).send(errors);
      return;
    };

    const nameDuplicated = await connection.query(
      'SELECT name FROM games WHERE name LIKE $1', 
      [name]
    );

    if(nameDuplicated.rows.length > 0){
      res.sendStatus(409);
      return
    };

    const hasCategory = await connection.query(
      'SELECT id FROM categories WHERE id = $1',
      [categoryId]
    );

    if(hasCategory.rows.length === 0){
      res.sendStatus(400);
      return
    };

    const game = await connection.query(
      'INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5);',
      [name, image, stockTotal, categoryId, pricePerDay]
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