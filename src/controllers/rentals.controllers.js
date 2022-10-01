import {connection} from '../database/db.js';
import moment from 'moment';
import {rentalSchema} from "../middlewares/schemas.js";

const now = moment();

async function getRentals(req, res) {
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

    rentals.rows.forEach(rental => {
      rental.rentDate = moment.utc(rental.rentDate).format('YYYY-MM-DD');
      if(rental.returnDate !== null){
        rental.returnDate = moment.utc(rental.returnDate).format('YYYY-MM-DD');
      }
    });

    return res.send(rentals.rows);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
}

async function postRental(req, res) {
  const {customerId, gameId, daysRented} = req.body;
  const rentDate = now.format('YYYY-MM-DD');
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
}

async function putRental (req, res) {
    const {id} = req.params;
    let returnDate = now.format('YYYY-MM-DD');
    let daysRented = await connection.query(
      'SELECT "daysRented" FROM rentals WHERE id = $1;',
      [id]
    );
  
    daysRented = daysRented.rows[0].daysRented;
  
    let rentDate = await connection.query(
      'SELECT "rentDate" FROM rentals WHERE id = $1;',
      [id]
    );
    rentDate = moment.utc(rentDate).format('YYYY-MM-DD');
    rentDate = new Date(rentDate);
    returnDate = new Date(returnDate);

    const price = await connection.query(
      'SELECT games."pricePerDay" FROM games JOIN rentals ON games.id = rentals."gameId" WHERE rentals.id = $1;',
      [id]
    );

    let amountDays = Math.abs(returnDate.getTime() - rentDate.getTime());
    amountDays = Math.ceil(amountDays / (1000 * 60 * 60 * 24));
  
    let delayFee = 0;
    if(amountDays > daysRented){
      delayFee = (amountDays - daysRented) * Number(price.rows[0].pricePerDay);
    }
  
    try {
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
  
      returnDate = now.format('YYYY-MM-DD');
      await connection.query(
        `UPDATE rentals SET "returnDate" = '${returnDate}', "delayFee" ='${delayFee}' WHERE id = $1;`,
        [id]
      );
      return res.sendStatus(200);
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
}

async function deleteRental(req, res){
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
  
      if(isReturned.rows[0].returnDate === null){
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
}

export {getRentals, postRental, putRental, deleteRental};