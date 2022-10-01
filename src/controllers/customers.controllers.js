import {connection} from '../database/db.js';
import { stripHtml } from 'string-strip-html';
import {customerSchema} from "../middlewares/schemas.js";

async function getCustomerBy(req,res){
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
}

async function getCustomers(req,res) {
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
}

async function postCustomer(req, res) {
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
}

async function putCustomer(req, res) {
    const id = req.params.id;
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
}

export {getCustomerBy, getCustomers, postCustomer, putCustomer};