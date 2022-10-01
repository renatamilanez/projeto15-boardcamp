import Joi from 'joi';

const rentalSchema = Joi.object({
    customerId: Joi.number().min(1).required(),
    gameId: Joi.number().min(1).required(),
    daysRented: Joi.number().min(1).required()
});

const customerSchema = Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().min(10).max(11).pattern(/^[0-9]+$/).required(),
    cpf: Joi.string().length(11).pattern(/^[0-9]+$/).required(),
    birthday: Joi.date().required()
});

const gameSchema = Joi.object({
    name: Joi.string().required(),
    stockTotal: Joi.number().min(1).required(),
    pricePerDay: Joi.number().min(1).required(),
    categoryId: Joi.required(),
    image: Joi.string().required(),
});

const categorieSchema = Joi.object({
    name: Joi.string().required(),
});

export {rentalSchema, customerSchema, gameSchema, categorieSchema};
