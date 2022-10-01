import {connection} from '../database/db.js';
import { stripHtml } from 'string-strip-html';
import {gameSchema} from "../middlewares/schemas.js";

async function getGames (req, res) {
    try {
      const games = await connection.query('SELECT games.*, categories.name AS "categoryName" FROM games JOIN categories ON "categoryId" = categories.id;');
      return res.send(games.rows);
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
}

async function postGame (req, res) {
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
}

export {getGames, postGame}