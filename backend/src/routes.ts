import express from 'express';
import multer from 'multer';
import { celebrate, Joi } from 'celebrate';

import multerConfig from './config/multer';

//importando classes
import PointsController from './controllers/PointsController';
import ItemsController from './controllers/ItemsController';

const routes = express.Router();
const upload =  multer(multerConfig);

//Instanciando classes
const pointsControler = new PointsController();
const itemsController = new ItemsController();

routes
    .get('/items', itemsController.index)
    .get('/points', pointsControler.index)
    .get('/points/:id', pointsControler.show)
    .post('/points', 
        upload.single('image'),
        celebrate({
            body: Joi.object().keys({
                name: Joi.string().required(),
                email: Joi.string().required().email(),
                whatsapp: Joi.string().required(),
                latitude: Joi.number().required(),
                longitude: Joi.number().required(),
                city: Joi.string().required(),
                uf: Joi.string().required().max(2),
                items: Joi.string().required(),
            }),
        }, {
            abortEarly: false
        }),
        pointsControler.create
    );


export default routes;