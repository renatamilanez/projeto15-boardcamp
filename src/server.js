import express from 'express';
import pkg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

const {Pool} = pkg;

dotenv.config({path: '../.env'});

const connection = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const server = express();
server.use(cors());
server.use(express.json());

server.listen(4000, () => {
    console.log('Listening on Port 4000');
});