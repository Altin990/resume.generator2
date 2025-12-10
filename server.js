// server.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();
const PORT = process.env.PORT || 3000;

// init stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Force non-www (resumegenerator.ink instead of www.resumegenerator.ink)
app.use((req, res, next) => {
  const host = req.headers.host || "";

  if (host.startsWith("www.")) {
    const newHost = host.slice(4); // remove "www."
    return res.redirect(301, `https://${newHost}${req.url}`);
  }

  next();
});


// middleware
app.use(cors());
app.use(express.json());

// serve static files (index.html, script.js, style.css, etc.)
app.use(express.static(path.join(__dirname)));

// root route -> index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// create checkout session (one-time 9.99€)
// create checkout session (one-time 9.99€)
app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: "https://resumegenerator.ink/success.html",
      cancel_url: "https://resumegenerator.ink/",
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({ error: "Unable to create checkout session" });
  }
});



// *** THIS WAS MISSING / NOT RUNNING ***
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
