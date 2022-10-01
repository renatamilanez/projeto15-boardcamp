import dotenv from 'dotenv';
import pkg from 'pg';

const {Pool} = pkg;

dotenv.config({path: '../.env'});

const connection = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export {connection};