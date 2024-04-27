/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";
import {Stripe} from "stripe";
// import * as functions from "firebase-functions";
import * as express from "express";
import {Timestamp} from "firebase-admin/firestore";
import {admin, db} from "./services/firebase";


// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const stripe = new Stripe(
  "sk_test_51Oxc6cP1MvTLwLocVATqovs3RJUtPrgtEvkjcAAO" +
  "xp2jZ6jzpi6PM5nTP82FUPoJFZJSLsnIqUDoUT9qEr2rBzwI00z4jUyPig"
);

const app = express();
// app.use(middleware);
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
// });

// app.use(cors());


// This creates the companion account
const params: Stripe.AccountCreateParams = {
  type: "express",
  email: "mr.manuell@gmail.com",
  country: "ES",
  capabilities: {
    card_payments: {
      requested: true,
    },
    // transfers: {
    //   requested: true,
    // },
  },
  business_type: "individual",
  individual: {
    first_name: "Johnny",
    last_name: "Test",
    address: {
      line1: "address_full_match",
      city: "Barcelona",
      country: "Spain",
      state: "Barcelona",
      postal_code: "08005",
    },
    dob: {
      year: 1901,
      month: 1,
      day: 1,
    },
    id_number: "000000000",
  },
};

app.post("/createCompanionAccount",
  async (req, res) => {
    const account = await stripe.accounts.create(params);
    res.send({account});
  }
);

const getIpAddress = (req: any): string => {
  let reqHeaders = "";
  if (Array.isArray(req.headers["x-forwarded-for"])) {
    reqHeaders = req.headers["x-forwarded-for"][0];
  } else if (req.headers["x-forwarded-for"] !== undefined) {
    reqHeaders = req.headers["x-forwarded-for"];
  }

  return reqHeaders || req.socket.remoteAddress || "";
};

app.post("/updateAccount",
  async (req, res) => {
    const account = await stripe.accounts.update("acct_1P7bE004ijYq7O78", {
      tos_acceptance: {
        date: Timestamp.now().toMillis(),
        ip: getIpAddress(req),
      },
      business_type: "individual",
      individual: {
        first_name: "Johnny",
        last_name: "Test",
        address: {
          line1: "address_full_match",
          city: "Barcelona",
          country: "Spain",
          state: "Barcelona",
          postal_code: "08005",
        },
        dob: {
          year: 1901,
          month: 1,
          day: 1,
        },
        id_number: "000000000",
      },
    });

    // db.collection("StripeAccount");
    res.send({account});
  }
);

app.post("/test", async (req, res) => {
  let idToken = "";

  if ( req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")) {
    idToken = req.headers.authorization.split(" ")[1];
  }

  try {
    const usr = await db
      .collection("users").doc("test1").get();
    console.log("usr ID", usr);

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("Decoded token: ", decodedToken);
  } catch (e) {
    console.log("ERROR: ", e);
  }
  res.send({data: "Some snap"});
});

// This links the companion account. Returns the link for completing onboarding
app.post("/linkCompanionAccount",
  async (req, res) => {
    console.log("HERE");
    const accountLink = await stripe.accountLinks.create({
      account: req.body.accountId,
      refresh_url: "https://example.com/reauth",
      return_url: "https://example.com/return",
      type: "account_onboarding",
      collect: "eventually_due",
    });
    res.send({accountLink});
  }
);

// TODO: create client account

// connectedAccountId: account of the client
app.post("/payment-sheet", async (req, res) => {
  // Use an existing Customer ID if this is a returning customer.
  const customer = await stripe.customers.create();
  const ephemeralKey = await stripe.ephemeralKeys.create(
    {customer: customer.id},
    {apiVersion: "2023-10-16"}
  );
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1099,
    currency: "usd",
    customer: customer.id,
    // In the latest version of the API, specifying `automatic_payment_methods`
    // is optional because Stripe enables its functionality by default.
    automatic_payment_methods: {
      enabled: true,
    },
    application_fee_amount: 500,
    transfer_data: {
      destination: req.body.connectedAccountId,
    },
  });

  res.json({
    paymentIntent: paymentIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: customer.id,
    publishableKey: "pk_test_51Oxc6cP1MvTLwLocwORjoy9NNHVwFXVnZsCqHshjiQUv" +
    "Rsog5FSwtXsy5U6kj2xt3vWUVzs4MA3yYKA4oUjU60zG00eV7027F7",
  });
});

exports.widgets = onRequest(app);
