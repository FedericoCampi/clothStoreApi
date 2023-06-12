'use strict';

/**
 * order controller
 */

const stripe = require('stripe')('sk_test_51MxtytAfwBI7P8aa8C2mn75Ppw7EMmoQBuCVbLmJJwUPdnalqkMR3uFqQ6zNki0lfi3oI76j2klvByN2g7K8ko1j00hhAQZdbl');
const express = require('express');
const app = express();
app.use(express.static('public'));

const YOUR_DOMAIN = 'http://localhost:5173'
// const YOUR_DOMAIN = 'http://localhost:1337'

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::order.order', ({strapi})=>({
  async create(ctx){

    const { products } = ctx.request.body;

    const lineItems = await Promise.all(
      products.map(async(product)=> {
        const item = await strapi.service('api::product.product').findOne(product.id)

        return {
          price_data:{
            currency: "usd",
            product_data:{
              name: item.title,
            },
            unit_amount: item.price*100,
          },
          quantity: product.quantity,
        }
      })
    );

    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        success_url: `${YOUR_DOMAIN}?success=true`,
        cancel_url: `${YOUR_DOMAIN}?success=false`,
        line_items: lineItems,
        shipping_address_collection: { allowed_countries: ["US", "CA"]},
        payment_method_types: ["card"]
      });
      await strapi.service("api::order.order").create({data:{
        products,
        stripeId: session.id,
      }
    })
    // res.redirect(303, session.url);

    return { stripeSession: session };

    } catch (error) {
      ctx.response.status = 500;
      console.log(error);
    }
  }
}));
