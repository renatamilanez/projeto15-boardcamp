import express from "express";
import {getCustomerBy, getCustomers, postCustomer, putCustomer} from "../controllers/customers.controllers.js";

const router = express.Router();

router.get('/customers?:cpf', getCustomerBy);
router.get('/customers/:id', getCustomers);
router.post('/customers', postCustomer);
router.put('/customers/:id', putCustomer);

export default router;