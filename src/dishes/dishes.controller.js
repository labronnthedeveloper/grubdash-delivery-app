const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Helper function to assign ID's/
const nextId = require("../utils/nextId");


//CRUD Functions
function list(req, res){
    res.json({data: dishes});
};


function read(req, res) {
    const dishId = req.params.dishId; 
    const foundDish = dishes.find((dish) => (dish.id === dishId));
    res.json({data: foundDish});
}

function create(req, res) {
    const { data: {name, description, price, image_url}} = req.body;
    const newDish = {
      id: nextId(),
      name, 
      description, 
      price,
      image_url,
    };
    dishes.push(newDish);
    res.status(201).json({data: newDish})
  }

function update(req, res){
    const dishId = req.params.dishId; 
    const foundDish = dishes.find((dish) => dish.id === dishId)

    const {data : { name, description, price, image_url } = {} } = req.body;

    foundDish.name = name;
    foundDish.description = description;
    foundDish.price = price; 
    foundDish.image_url= image_url; 
    
    res.json({data: foundDish});
}

// Middleware functions
const dishExists = (req, res, next) => {
    const dishId = req.params.dishId;
    res.locals.dishId = dishId;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (!foundDish) {
       return next({
          status: 404, 
          message: `Dish not found: ${dishId}` });
    }
    res.locals.dish = foundDish;
 };
 
 const dishValidName = (req, res, next) => {
    const { data = null } = req.body;
    res.locals.newDD = data;
    const dishName = data.name;
    if (!dishName || dishName.length === 0) {
       return next({
          status: 400,
          message: "Dish must include a name",
       });
    }
 };
 
 const dishValidDescription = (req, res, next) => {
    const dishDescription = res.locals.newDD.description;
    if (!dishDescription || dishDescription.length === 0) {
       return next({
          status: 400,
          message: "Dish must include a description",
       });
    }
 };
 
 const dishValidPrice = (req, res, next) => {
    const dishPrice = res.locals.newDD.price;
    if (!dishPrice || typeof dishPrice != "number" || dishPrice <= 0) {
       return next({
          status: 400,
          message: "Dish must have a price greater than 0",
       });
    }
 };
 
 const dishValidImage = (req, res, next) => {
    const dishImage = res.locals.newDD.image_url;
    if (!dishImage || dishImage.length === 0) {
       return next({
          status: 400,
          message: "Dish must include an image_url",
       });
    }
 };
 
 const dishIdMatches = (req, res, next) => {
    const paramId = res.locals.dishId;
    const { id = null } = res.locals.newDD;
    if (paramId != id && id) {
       return next({
          status: 400,
          message: `Dish id does not match route id. Dish ID: ${id}, Route: ${paramId}`,
       });
    }
 };


 //Triggering our next(), and coordinating the validation. 
 const createValidation = (req, res, next) => {
    dishValidName(req, res, next);
    dishValidDescription(req, res, next);
    dishValidPrice(req, res, next);
    dishValidImage(req, res, next);
    next();
 };
 
 const readValidation = (req, res, next) => {
    dishExists(req, res, next);
    next();
 };
 
 const updateValidation = (req, res, next) => {
    dishExists(req, res, next);
    dishValidName(req, res, next);
    dishValidDescription(req, res, next);
    dishValidPrice(req, res, next);
    dishValidImage(req, res, next);
    dishIdMatches(req, res, next);
    next();
 };
module.exports = {
    create: [createValidation, create],
    read: [readValidation, read],
    update: [updateValidation, update],
    list,

};
