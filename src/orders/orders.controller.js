const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

// Middleware functions
function orderExists (req, res, next) {
   const orderId = req.params.orderId;
   res.locals.orderId = orderId;
   const foundOrder = orders.find((order) => order.id === orderId);
   if (!foundOrder) {
      return next({
         status: 404,
         message: `Order not found: ${orderId}` });
   }
   res.locals.order = foundOrder;
};

function orderValidDeliverTo (req, res, next) {
   const { data = null } = req.body;
   res.locals.newOD = data;
   const orderdeliverTo = data.deliverTo;
   if (!orderdeliverTo || orderdeliverTo.length === 0) {
      return next({
         status: 400,
         message: "Order must include a deliverTo",
      });
   }
};

function orderValidMobileNumber (req, res, next) {
   const orderMobileNumber = res.locals.newOD.mobileNumber;
   if (!orderMobileNumber || orderMobileNumber.length === 0) {
      return next({
         status: 400,
         message: "Order must include a mobileNumber",
      });
   }
};

function orderHasDishes(req, res, next) {
   const orderDishes = res.locals.newOD.dishes;
   if (!orderDishes || !Array.isArray(orderDishes) || orderDishes.length <= 0) {
      return next({
         status: 400,
         message: "Please add at least one dish to your order to continue.",
      });
   }
   res.locals.dishes = orderDishes;
};

function ordersWithValidDishes (req, res, next) {
   const orderDishes = res.locals.dishes;
   orderDishes.forEach((dish) => {
      const dishQuantity = dish.quantity;
      if (!dishQuantity || typeof dishQuantity != "number" || dishQuantity <= 0) {
         return next({
         status: 400,
         message: `Dish ${orderDishes.indexOf(
            dish
         )} must have a quantity that greater than 0`,
         });
      }
   });
};

function orderIdMatches(req, res, next) {
   const paramId = res.locals.orderId;
   const { id = null } = res.locals.newOD;
   if (!id || id === null) {
      res.locals.newOD.id = res.locals.orderId;
   } else if (paramId != id) {
      return next({
         status: 400,
         message: `Order id does not match route id. Order # ${id}, Route: ${paramId}`,
      });
   }
};

function incomingStatusValid (req, res, next) {
   const { status = null } = res.locals.newOD;
   if (!status || status.length === 0 || status === "invalid") {
      return next({
         status: 400,
         message:
         "Order must have an active status.",
      });
   }
};

function statusValid (req, res, next) {
   const { status = null } = res.locals.order;
   if (status === "delivered") {
      return next({
         status: 400,
         message: "A delivered order cannot be changed",
      });
   }
};

function statusPending (req, res, next) {
   const { status = null } = res.locals.order;
   if (status !== "pending") {
      return next({
         status: 400,
         message: "An order cannot be deleted unless it is pending",
      });
   }
};

// Middleware Functions
function createValidation (req, res, next){
   orderValidDeliverTo(req, res, next);
   orderValidMobileNumber(req, res, next);
   orderHasDishes(req, res, next);
   ordersWithValidDishes(req, res, next);
   next();
};

function readValidation (req, res, next) {
   orderExists(req, res, next);
   next();
};

function updateValidation (req, res, next) {
   orderExists(req, res, next);
   orderValidDeliverTo(req, res, next);
   orderValidMobileNumber(req, res, next);
   orderHasDishes(req, res, next);
   ordersWithValidDishes(req, res, next);
   orderIdMatches(req, res, next);
   incomingStatusValid(req, res, next);
   statusValid(req, res, next);
   next();
};

function deleteValidation (req, res, next) {
   orderExists(req, res, next);
   statusPending(req, res, next);
   next();
};

//Handlers:
function list(req, res) {
   res.status(200).json({ data: orders });
}

function read(req, res) {
   res.status(200).json({ data: res.locals.order });
}

function create(req, res) {
   const newOrderData = res.locals.newOD;
   newOrderData.id = nextId();
   orders.push(newOrderData);
   res.status(201).json({ data: newOrderData });
}


function update(req, res) {
   const newData = res.locals.newOD;
   const oldData = res.locals.order;
   const index = orders.indexOf(oldData);
   for (const key in newData) {
      orders[index][key] = newData[key];
   }
   res.status(200).json({ data: orders[index] });
}

function destroy(req, res) {
   const index = orders.indexOf(res.locals.order);
   orders.splice(index, 1);
   res.sendStatus(204);
}

module.exports = {
   create: [createValidation, create],
   read: [readValidation, read],
   update: [updateValidation, update],
   delete: [deleteValidation, destroy],
   list,
};