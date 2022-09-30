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

const customerSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().min(10).max(11).pattern(/^[0-9]+$/).required(),
  cpf: Joi.string().length(11).pattern(/^[0-9]+$/).required(),
  birthday: Joi.date().required()
});

//ROTA PRONTA E VERIFICADA
server.get('/categories', async (req, res) => {
  try {
    const categories = await connection.query('SELECT * FROM categories;');
    return res.send(categories.rows);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
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
        return res.status(400).send(errors);
    }
  
    const duplicate = await connection.query(
      'SELECT name FROM categories WHERE name LIKE $1', 
      [name]
    );
  
    if(duplicate.rows.length > 0){
      return res.sendStatus(409);
    }
  
    await connection.query(
      'INSERT INTO categories (name) VALUES ($1);',
      [name]
    );
    return res.sendStatus(201);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

//rota pronta e verificada
server.get('/games', async (req, res) => {
  try {
    const games = await connection.query('SELECT games.*, categories.name AS "categoryName" FROM games JOIN categories ON "categoryId" = categories.id;');
    return res.send(games.rows);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
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
      return res.sendStatus(409);
    };

    const hasCategory = await connection.query(
      'SELECT id FROM categories WHERE id = $1',
      [categoryId]
    );

    if(hasCategory.rows.length === 0){
      return res.sendStatus(400);
    };

    const game = await connection.query(
      'INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5);',
      [name, image, stockTotal, categoryId, pricePerDay]
    );
    return res.sendStatus(201);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

//todos pronta, falta testar com cpf
server.get('/customers?cpf', async (req,res) => {
  const cpf = req.query.cpf;

  try {
    if(!cpf){
      const customers = await connection.query(
        'SELECT * FROM customers;'
      );
      return res.send(customers.rows);
    } if (cpf){
      const customers = await connection.query(
        'SELECT * FROM customers;'
      );
      return res.send(customers.rows);
    }
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

//pronta e testada
server.get('/customers/:id', async (req,res) => {
  const id = req.params.id;
  console.log(id)
  try {
    if(id){
      const customers = await connection.query(
        'SELECT * FROM customers WHERE id = $1;',
        [id]
      );
  
      if(customers.rows.length === 0){
        return res.sendStatus(404);
      };
      return res.send(customers.rows[0]);
    }
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

//pronta e verificada
server.post('/customers', async (req, res) => {
  let {name, phone, cpf, birthday} = req.body;
  name = stripHtml(name).result.trim();
  cpf = stripHtml(cpf).result.trim();
  phone = stripHtml(phone).result.trim();

  try {
    const validation = customerSchema.validate({
      name, 
      phone, 
      cpf, 
      birthday
    }, {abortEarly: false});

    if(validation.error){
      const errors = validation.error.details.map(detail => detail.message);
      return res.status(400).send(errors);
    }

    const cpfDuplicated = await connection.query(
      'SELECT cpf FROM customers WHERE cpf = $1', 
      [cpf]
    );

    if(cpfDuplicated.rows.length > 0){
      return res.sendStatus(409);
    }

    const customer = await connection.query(
      'INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4);',
    [name, phone, cpf, birthday]
    );
    return res.sendStatus(201);
  } catch (error) {
    
  }
});

server.listen(4000, () => {
    console.log('Listening on Port 4000');
});