import {connection} from '../database/db.js';
import { stripHtml } from 'string-strip-html';
import {categorieSchema} from "../middlewares/schemas.js";

async function getCategory(req, res) {
    try {
      const categories = await connection.query('SELECT * FROM categories;');
      return res.send(categories.rows);
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
}

async function postCategory (req, res){
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
      error(error);
      return res.sendStatus(500);
    }
}

export {getCategory, postCategory};