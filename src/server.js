import express from 'express';
import cors from 'cors';
import categoriesRouter from "./routers/categories.routers.js";
import gamesRouter from "./routers/games.routers.js";
import customersRouter from "./routers/customers.routers.js";
import rentalsRouter from "./routers/rentals.routers.js";

const server = express();
server.use(cors());
server.use(express.json());

server.use(categoriesRouter, gamesRouter, customersRouter, rentalsRouter);

server.listen(4000, () => {
    console.log('Listening on Port 4000');
});