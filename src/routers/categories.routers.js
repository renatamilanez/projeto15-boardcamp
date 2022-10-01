import express from "express";
import {getCategory, postCategory} from "../controllers/categories.controllers.js";

const router = express.Router();

router.get('/categories', getCategory);
router.post('/categories', postCategory);

export default router;