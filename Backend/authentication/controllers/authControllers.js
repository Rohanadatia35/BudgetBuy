const User = require("../models/User");
require("dotenv").config({ path: "../.env" });
const tokencookies = require("../Token/CreateToken");
const axios = require("axios");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const CryptoJS = require("crypto-js");

async function validateGoogleToken(access_token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: access_token,
      audience: process.env.GOOGLE_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
    });
    const payload = ticket.getPayload();
    return payload;
  } catch (error) {
    console.log("Token validation failed:", error);
    return null;
  }
}

//This function handles all the error that could possibly be there while registering
const errorHandle = (err) => {
  let errors = {
    name: "",
    contact: "",
    email: "",
    password: "",
    address: "",
    pincode: "",
    tags: "",
  };

  //this thing is only for the fields that need unique values
  if (err.code === 11000) {
    errors.email = "the phone number or email is already registered";
    return errors;
  }

  //all other error handle
  if (err.message.includes("user validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }
  return errors;
};

//api for registering a new custommer
module.exports.signup_post = async (req, res) => {
  const { name, contact, email, password, tags } = req.body;
  try {
    const user = await User.create({
      name,
      contact,
      email,
      password,
      tags,
    });
    console.log("called")
    const user_id = user._id;
    const useremail = user.email;
    const resp = await axios.post(process.env.ORDER + "/createCart/", {
      user_id,
      useremail,
    });
    if (resp.status == 201) {
      res.status(201).json({ user: user._id });
    } else {
      console.log(resp.message);
      res.status(400).json({ error: resp });
    }
  } catch (err) {
    const errors = errorHandle(err);
    res.status(401).json({ errors });
  }
};

module.exports.callback = async (req, res) => {
  const code = req.query.code;
  const url = "https://oauth2.googleapis.com/token";
  const data = {
    redirect_uri: process.env.AUTHENTICATION + "/auth/google/callback",
    code: code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    grant_type: "authorization_code",
  };
  const headers = { "Content-Type": "application/json" };

  try {
    const response = await axios.post(url, data, { headers: headers });
    const token_info = response.data;
    const id_token = await validateGoogleToken(token_info.id_token);
    if (id_token) {
      const user = await User.findOne({ email: id_token.email });
      if (user) {
        const token = tokencookies(user._id, user.email, user.name);
        console.log(req.hostname);
        res
          .cookie("jwt", token, {
            httpOnly: true,
            maxAge: 3 * 24 * 60 * 60 * 1000,
            // sameSite: "None",
            // secure: true,
            // path: "/",
            // domain: ".ngrok-free.app",
          })
          .status(201)
          .redirect(process.env.FRONTEND + "/");
      } else {
        res.redirect(process.env.FRONTEND + "/signup");
      }
    }
    // use token_info as needed
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error in google login" });
  }
};

//api for logging in
module.exports.login_post = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.login(email, password);
    const token = tokencookies(user._id, user.email, user.name);
    console.log("Setting cookie");
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
      // sameSite: "None",
      // secure: true,
      // path: "/",
      // domain: ".ngrok-free.app",
    });
    res.status(200);
    res.json({ message: "Login Successfull" });
    // throw new Error("Error in setting cookie");
  } catch (err) {
    res.clearCookie("jwt");
    res.status(400).json({ message: "Login failed", error: err });
  }
};

// function generateAuthUrl(clientId, redirectUri, scope) {
//   let authUrl = "https://accounts.google.com/o/oauth2/v2/auth";
//   authUrl += "?client_id=" + encodeURIComponent(clientId);
//   authUrl += "&redirect_uri=" + encodeURIComponent(redirectUri);
//   authUrl += "&response_type=code";
//   authUrl += "&scope=" + encodeURIComponent(scope);
//   authUrl += "&access_type=offline";
//   return authUrl;
// }

// module.exports.

module.exports.updateUser_put = async (req, res) => {
  const user_id = req.authdata.id;
  try {
    const user = User.findOne({ _id: user_id });
    if (!user) {
      res.status(400).json({
        message: "User not found",
      });
    } else {
      const newuser = await User.updateOne(
        { _id: user_id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            contact: req.body.contact,
          },
        }
      );
      res
        .status(201)
        .json({ message: "user updated successsfully", newuser: newuser });
    }
  } catch (err) {
    console.log(err.message);
    res.status(400).json({ message: "User not found" }, err);
  }
};

//api for logging out
module.exports.logout_post = async (req, res) => {
  try {
    res
      .clearCookie("jwt", {
        httpOnly: true,
        maxAge: 0,
        // sameSite: "None",
        // secure: true,
      })
      .status(200)
      .json({ message: "Logged out successfully" });
  } catch {
    res.status(400).json({ message: "Error in logging out" });
  }
};

module.exports.getCart = async (req, res) => {
  const user_id = req.authdata.id;
  try {
    const response = await axios.get(process.env.ORDER + "/getCart/", {
      params: {
        user_id,
      },
    });
    if (response.status == 200) {
      res.status(200).json({ cartItems: response.data });
    } else if (response.status == 204) {
      res.status(204).json({ message: "Cart is empty" });
    } else {
      res.status(400).json({ message: "Nothing to show here" });
    }
  } catch (err) {
    res.status(400).json({ message: "Something went wrong" });
  }
};

module.exports.addcart = async (req, res) => {
  const data = req.body;
  const uid = req.authdata.id;
  data.user_id = uid;
  try {
    const response = await axios.post(process.env.ORDER + "/addCart/", data);
    if (response.status == 201) {
      res.status(201).json({ message: "Product added to cart" });
    } else {
      res.status(400).json({ message: "Something went wrong" });
    }
  } catch (err) {
    res.status(400).json({ message: "Something went wrong" });
  }
};

module.exports.forgotPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: "User not found" });
    } else {
      const uid = uuidv4();
      const payload = { userId: user._id };
      const token = jwt.sign(payload, process.env.SECRET_KEY, {
        expiresIn: "1h",
      });
      const resetlink =
      process.env.FRONTEND + "/reset-password/" + uid + "/" + token;
      const resp = await axios.post(process.env.EMAIL + "/resetlink/", {
        resetlink,
        email,
      });
      if (resp.status == 200) {
        res.status(200).json({ message: "Reset link sent to your email" });
      } else {
        res.status(401).json({ message: "Something went wrong" });
      }
    }
  } catch (err) {
    res.status(402).json({ message: "Something went wrong" });
  }
};

module.exports.resetPassword = async (req,res) => {
  const newpass = req.body.newpassword;
  const token = req.body.token;
  try {
    const payload = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findOne({ _id: payload.userId });
    if(!user) {
      res.status(400).json({message: "Invalid token"});
    }
    user.password = newpass;
    await user.save();
    res.status(200).json({message: "Password changed successfully"});
  } catch(err) {
    res.status(401).json({message: "Invalid token"});
  }
}

module.exports.insertAddress = async (req, res) => {
  const user_id = req.authdata.id;
  const {pincode, city, state, building_name, street, landmark} = req.body;
  console.log(user_id, pincode, city, state, building_name, street, landmark)
  try {
    const user = await User.findOne({_id: user_id});
    if(!user) {
      res.status(400).json({message: "User not found"});
    } else {
      user.address.push({
        pincode,
        city,
        state,
        building_name,
        street,
        landmark
      });
      await user.save();
      console.log("Hello")
      res.status(201).json({message: "Address added successfully"});
    }
  } catch(err) {
    res.status(400).json({message: err.message});
  }
}

module.exports.insertCard = async (req,res) => {
  // Encrypt
// const ciphertext = CryptoJS.AES.encrypt('MM/YY', 'secret key 123').toString();

// Decrypt
// const bytes  = CryptoJS.AES.decrypt(ciphertext, 'secret key 123');
// const originalText = bytes.toString(CryptoJS.enc.Utf8);
  const user_id = req.authdata.id;
  const {card_number, expiry_date, cardcvv} = req.body;
  const card_no = CryptoJS.AES.encrypt(card_number, process.env.SECRET_KEY).toString();
  const cardExpiryDate = CryptoJS.AES.encrypt(expiry_date, process.env.SECRET_KEY).toString();
  const cvv = CryptoJS.AES.encrypt(cardcvv, process.env.SECRET_KEY).toString();
  try {
    const user = await User.findOne({_id: user_id});
    if(!user) {
      res.status(400).json({message: "User not found"});
    }
    else {
      if (user.card_details.some(detail => detail.card_no === card_no)) {
        res.status(401).json({message: "Card already exists"});
      } else {
        user.card_details.push({
          card_no,
          cardExpiryDate,
          cvv
        })
        console.log(user)
        await user.save();
        res.status(201).json({message: "Card added successfully"});
      }
    }
  } catch(err) {
    console.log(err.message)
    res.status(400).json({message: err.message});
  }
}

module.exports.getUser = async (req, res) => {
  const user_id = req.authdata.id;
  try {
    const user = await User.findOne({_id: user_id});
    if(!user) {
      res.status(400).json({message: "User not found"});
    }
    else {
      const cards = user.card_details;
      cards.forEach(card => {
        console.log(card.card_no)
        card.card_no = CryptoJS.AES.decrypt(card.card_no, process.env.SECRET_KEY).toString(CryptoJS.enc.Utf8);
        card.cardExpiryDate = CryptoJS.AES.decrypt(card.cardExpiryDate, process.env.SECRET_KEY).toString(CryptoJS.enc.Utf8);
        card.cvv = CryptoJS.AES.decrypt(card.cvv, process.env.SECRET_KEY).toString(CryptoJS.enc.Utf8);
      });
      res.status(200).json({user});
    }
  } catch(err) {
    res.status(400).json({message: err.message});
  }
}

module.exports.getUserOrder = async (req,res) => {
  const user_id = req.authdata.id;
  console.log(req.body)
  const status = req.body.type;
  console.log(user_id, status)
  try {
    const resp = await axios.get(process.env.ORDER + "/getUserOrder/", {
      params: {
        user_id, 
        status
      }
    });
    if(resp.status == 200) {
      res.status(200).json({result: resp.data});
    } else {
      res.status(400).json({message: "Something went wrong"});
    }
  } catch(err) {
    res.status(400).json({message: err.message});
  }
}