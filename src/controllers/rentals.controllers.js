import {connection} from '../database/db.js';
import dayjs from 'dayjs';
import {rentalSchema} from "../middlewares/schemas.js";

const now = dayjs();

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
}

//pronta, falta testar
async function putRental (req, res) {
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
}

//pronta, falta testar
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
}

export {getRentals, postRental, putRental, deleteRental};