import express from "express";
import {getRentals, postRental, putRental, deleteRental} from "../controllers/rentals.controllers.js";

const router = express.Router();

router.get('/rentals', getRentals);
router.post('/rentals', postRental);
router.put('/rentals/:id/return', putRental);
router.delete('/rentals/:id', deleteRental);

export default router;