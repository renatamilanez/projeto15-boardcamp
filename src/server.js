import express from 'express';
import pkg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';
import Joi from 'joi';
import { stripHtml } from 'string-strip-html';
import dayjs from 'dayjs';

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

const rentalSchema = Joi.object({
  customerId: Joi.number().min(1).required(),
  gameId: Joi.number().min(1).required(),
  daysRented: Joi.number().min(1).required()
});

const now = dayjs();

//CATEGORIES - VERIFICADOS
server.get('/categories', async (req, res) => {
  try {
    const categories = await connection.query('SELECT * FROM categories;');
    return res.send(categories.rows);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});
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

//GAMES - VERIFICADOS
server.get('/games', async (req, res) => {
  try {
    const games = await connection.query('SELECT games.*, categories.name AS "categoryName" FROM games JOIN categories ON "categoryId" = categories.id;');
    return res.send(games.rows);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});
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

//CUSTOMERS - VERIFICADOS
server.get('/customers?:cpf', async (req,res) => {
  const cpf = req.query.cpf;

  try {
    if(!cpf){
      const customers = await connection.query(
        'SELECT * FROM customers;'
      );
      return res.send(customers.rows);
    } if (cpf){
      const customers = await connection.query(
        'SELECT * FROM customers WHERE cpf LIKE $1;',
      [`${cpf}%`]
      );

      if(customers.rows.length === 0){
        return res.sendStatus(404);
      }

      return res.send(customers.rows);
    }
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});
server.get('/customers/:id', async (req,res) => {
  const id = req.params.id;

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
server.post('/customers', async (req, res) => {
  let {name, phone, cpf, birthday} = req.body;
  name = stripHtml(name).result.trim();
  cpf = stripHtml(cpf).result.trim();
  phone = stripHtml(phone).result.trim();

  console.log(birthday)

  try {
    const validation = customerSchema.validate({
      name, 
      phone, 
      cpf, 
      birthday
    }, {abortEarly: false}, {convert: false});

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
    };

    const customer = await connection.query(
      'INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4);',
    [name, phone, cpf, birthday]
    );
    return res.sendStatus(201);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});
server.put('/customers/:id', async (req, res) => {
  const id = req.params.id;
  console.log(id)
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
    }, {abortEarly: false}, {convert: false});

    if(validation.error){
      const errors = validation.error.details.map(detail => detail.message);
      return res.status(400).send(errors);
    }

    const cpfDuplicated = await connection.query(
      'SELECT * FROM customers WHERE cpf = $1', 
      [cpf]
    );

    if(cpfDuplicated.rows.length > 0){
      if(cpfDuplicated.rows[0].id != id){
        return res.sendStatus(409);
      } 
    }

    await connection.query(
      `UPDATE customers SET name = '${name}', phone ='${phone}', birthday='${birthday}',cpf= '${cpf}' WHERE id = $1;`,
      [id]
    );
    
    return res.sendStatus(200);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

//RENTALS
server.get('/rentals', async (req, res) => {
  const customerId = parseInt(req.query.customerId);
  const gameId = parseInt(req.query.gameId);

  try {
    if(customerId){
      const rentals = await connection.query(
        'SELECT * FROM rentals WHERE "customerId" = $1;',
        [customerId]
      );
      return res.send(rentals.rows);
    }

    if(gameId){
      const rentals = await connection.query(
        'SELECT * FROM rentals WHERE "gameId" = $1;',
        [gameId]
      );
      return res.send(rentals.rows);
    }

    const rentals = await connection.query(
      'SELECT * FROM rentals;'
    );
    return res.send(rentals.rows);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});
server.post('/rentals', async (req, res) => {
  const {customerId, gameId, daysRented} = req.body;
  const rentDate = now.format('YYYY-MM-DD');
  console.log(rentDate);
  const gamePrice = await connection.query(
    'SELECT "pricePerDay" FROM games WHERE id = $1',
  [gameId]
  );
  const originalPrice = Number(daysRented) * Number(gamePrice.rows[0].pricePerDay);
  const returnDate = null;
  const delayFee = null;

  if(daysRented <= 0){
    return res.sendStatus(400);
  }
  
  let stockTotal = await connection.query(
    'SELECT "stockTotal" FROM games WHERE id = $1',
  [gameId] 
  );

  const isRented = await connection.query(
    'SELECT "daysRented" FROM rentals WHERE "gameId" = $1',
  [gameId]
  );

  const isAvailable = isRented.rows.forEach(item => {
    stockTotal -= Number(item.daysRented);
    console.log(stockTotal);
  });

  if(stockTotal < 0){
    res.sendStatus(400);
  };

  try {
    const validation = rentalSchema.validate({customerId, gameId, daysRented}, {abortEarly: false});

    if(validation.error){
      const errors = validation.error.details.map(detail => detail.message);
      res.status(400).send(errors);
      return;
    };

    const hasUser = await connection.query(
      'SELECT id FROM customers WHERE id = $1',
      [customerId]
    );

    if(hasUser.rows.length === 0){
      return res.sendStatus(400);
    }

    const hasGame = await connection.query(
      'SELECT id FROM games WHERE id = $1',
      [gameId]
    );

    if(hasGame.rows.length === 0){
      return res.sendStatus(400);
    }

    const rental = await connection.query(
      'INSERT INTO rentals ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee") VALUES ($1, $2, $3, $4, $5, $6, $7);',
      [customerId, gameId, rentDate, daysRented, returnDate, originalPrice, delayFee]
    );
    
    return res.sendStatus(201);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

//pronta, falta testar
server.put('/rentals/:id/return', async (req, res) => {
  const {id} = req.params;
  const returnDate = now.format('DD/MM/YYYY');
  let daysRented = await connection.query(
    'SELECT "daysRented" FROM rentals WHERE id = $1;',
    [id]
  );

  daysRented = daysRented.rows[0].daysRented;

  let rentDate = await connection.query(
    'SELECT "rentDate" FROM rentals WHERE id = $1;',
    [id]
  );
  rentDate = rentDate.rows[0].rentDate;

  const amountDays = dayjs(returnDate).subtract(rentDate, 'day');
  let delayFee = 0;
  const price = await connection.query(
    'SELECT games."pricePerDay" FROM games JOIN rentals ON games.id = rentals."gameId" WHERE rentals.id = $1;',
    [id]
  );

  console.log(amountDays); //DANDO ERRO

  if(amountDays > daysRented){
    let delayFee = (amountDays - daysRented) * Number(price.rows[0].price);
  }

  /*try {
    const hasRental = await connection.query(
      'SELECT id FROM rentals WHERE id = $1;',
      [id]
    );
  
    if(hasRental.rows.length === 0){
      return res.sendStatus(404);
    }
  
    const isReturned = await connection.query(
      'SELECT "returnDate" FROM rentals WHERE id = $1',
    [id]
    );
  
    if(isReturned.rows[0].returnDate !== null){
      return res.sendStatus(400);
    }

    /*await connection.query(
      `UPDATE rentals SET "returnDate" = '${returnDate}', "delayFee" ='${delayFee}' WHERE id = $1;`,
      [id]
    );

    return res.sendStatus(200);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }*/
});

//pronta, falta testar
server.delete('/rentals/:id', async (req, res) => {
  const {id} = req.params;

  try {
    const hasId = await connection.query(
      'SELECT id FROM rentals WHERE id = $1;',
      [id]
    );

    if(hasId.rows.length === 0){
      return res.sendStatus(404);
    }

    const isReturned = await connection.query(
      'SELECT "returnDate" FROM rentals WHERE id = $1;',
    [id]
    );

    if(isReturned.rows[0] === null){
      return res.sendStatus(400);
    }

    await connection.query(
      'DELETE FROM rentals WHERE id = $1;',
      [id]
    );
    return res.sendStatus(200);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

server.listen(4000, () => {
    console.log('Listening on Port 4000');
});