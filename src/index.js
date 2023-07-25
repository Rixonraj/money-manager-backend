const express = require("express")
const cors = require("cors")
const app = express();
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const session = require("express-session")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
dotenv.config({ path: require('find-config')('.env') })
const userLogin = require("./models/user_model")
const transaction = require("./models/user_transaction")
const JWT_SECRET = process.env.JWT_SECRET;
const URL = (`${process.env.START_MONGO}${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}${process.env.END_MONGO}${process.env.DB_NAME}${process.env.LAST_MONGO}`)

mongoose.connect(URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected!'));


app.use(express.json())

app.use(cors({
    origin: "*",
    credentials: true,
    exposedHeaders: ['Set-Cookie']
}))

app.set("trust proxy", 1);


app.use(
    session({
        secret: "secretcode",
        resave: true,
        saveUninitialized: true,
        cookie: {
            // sameSite: 'none',
            // secure: true,
            // maxAge: 1000 * 60 * 60 * 24 * 7,
            httpOnly: true
        }
    }))





app.get("/", (req, res) => {

    res.send("Hello World From BACKEND");
})

app.post("/user/register", async (req, res) => {

    try {
        userLogin.findOne({ username: req.body.username }).then(async (docs) => {
            if (!docs) {
                var salt = await bcrypt.genSalt(10)
                var hash = await bcrypt.hash(req.body.password, salt)
                req.body.password = hash

                const newUser = new userLogin({
                    username: req.body.username,
                    password: req.body.password
                });
                newUser.save().then(() => {
                    console.log("SAVED");
                    res.send({ message: "Success ceated" });
                    // mongoose.connection.close().then(console.log("connection closed"));
                }
                )
            } else {
                res.send({ message: "User Already Exist, Try another Name" });
            }
        })


    } catch (error) {

    }
})

app.post("/user/login", async (req, res) => {
    try {

        userLogin.findOne({ username: req.body.username }).then(async (docs) => {
            if (docs) {
                const compare = await bcrypt.compare(req.body.password, docs.password)
                //Issue Token
                const token = jwt.sign({
                    _id: docs._id,
                    exp: Math.floor(Date.now() / 1000) + (60 * 60), //exp in one hour
                    iat: Math.floor(Date.now() / 1000)

                }, JWT_SECRET)


                if (compare) {
                    res.json({ message: "Success Auth", user_id: docs._id, token })
                } else {
                    res.json({ message: "Wrong Pass" })
                }
            } else {
                res.status(404).json({ message: "User does not exist, Register" })
            }

        }
        );

    } catch (error) {

    }
})


let authorize = (req, res, next) => {
    try {
        // dbqueries
        // console.log(req.headers)
        if (req.headers.authorization) {
            //check token is valid
            let decodedToken = jwt.verify(req.headers.authorization, JWT_SECRET)
            if (decodedToken) {
                // console.log("TOKEN Authorized!", decodedToken)
                if (decodedToken._id == req.params.id) {
                    next()
                } else {
                    res.status(401).json({ message: "User Mismatch Login Again" })
                }
            }
            else {
                res.status(401).json({ message: "Unauthorized" })
            }

            //if valid say next() req.params.id
            // if moy valid say Unatuthorized
        }

    } catch (error) {
        res.status(500).json({ message: error })
    }
}






app.get("/transaction_detail/:id", authorize, async (req, res) => {
    try {
        //database
        // console.log("NEXT EXECUTED", req.params)
        res.json({ message: "Success SUCESSSSSS!!!! YEAH!" })

        // res.status(200).json({message : "SUCESSSSSS!!!! YEAH!"})
    } catch (error) {

    }
})



app.post("/save_transaction_detail/:id", authorize, async (req, res) => {
    try {
        //database

        const newTransaction = new transaction
            ({
                userID: req.params.id,

                txType: req.body.values.txType,

                txDescription: req.body.values.txDescription,

                txDate: req.body.values.txDate,

                txCategory: req.body.values.txCategory,

                txDivision: req.body.values.txDivision,

                txAmount: req.body.values.txAmount,

            });

        newTransaction.save().then(() => {
            console.log("SAVED");

            // console.log(" EXECUTED", req.body.values)
            res.json({ message: "Success saved TXXXX!!!! YEAH!" })
            // res.send({message:"Success ceated"});
            // mongoose.connection.close().then(console.log("connection closed"));
        }
        )
        // res.status(200).json({message : "SUCESSSSSS!!!! YEAH!"})
    } catch (error) {
        res.status(500).json({ message: error })
    }
})




app.put("/edit_transaction_detail/:id", authorize, async (req, res) => {
    try {
        //database
        transaction.updateOne({_id: req.body.values.txId}, 
            {
              $set: {
                userID: req.params.id,

                txType: req.body.values.txType,

                txDescription: req.body.values.txDescription,

                txDate: req.body.values.txDate,

                txCategory: req.body.values.txCategory,

                txDivision: req.body.values.txDivision,

                txAmount: req.body.values.txAmount



            },
              $currentDate: { lastUpdated: true }
            }
            
            ).then(() => {
            console.log("SAVED");

            // console.log(" EXECUTED", req.body.values)
            res.json({ message: "Success Edited TXXXX!" })
            // res.send({message:"Success ceated"});
            // mongoose.connection.close().then(console.log("connection closed"));
        }
        )
        // res.status(200).json({message : "SUCESSSSSS!!!! YEAH!"})
    } catch (error) {
        res.status(500).json({ message: error })
    }
})



app.get("/fetch_transaction_details/:id", authorize, async (req, res) => {
    console.log("req.params,", req.params)
    console.log("req.query,", req.query)
    if (req.query.dateType == "Daily") {
        transaction.find({
            
            $and: [
                { userID: req.params.id },
                { $expr: { $eq: [{ $dayOfMonth: "$txDate" }, new Date(req.query.startingDate).getDate()] } },
                { $expr: { $eq: [{ $month: "$txDate" }, new Date(req.query.startingDate).getMonth()+1] } },
                { $expr: { $eq: [{ $year: "$txDate" }, new Date(req.query.startingDate).getFullYear()] } }
            ]
        
        }).then(async (docs) => {
            res.json(docs)
        }).catch((error) => { res.json({ empty: "empty", message: error }) })

    } else if (req.query.dateType == "Monthly") {

        await transaction.find({
            $and: [
                { userID: req.params.id },
                { $expr: { $eq: [{ $month: "$txDate" }, new Date(req.query.startingDate).getMonth()+1] } },
                { $expr: { $eq: [{ $year: "$txDate" }, new Date(req.query.startingDate).getFullYear()] } }

            ]
        }
        ).then(async (docs) => {
            res.json(docs)
            console.log("month:", docs)
        }).catch((error) => { res.json({ empty: "empty", message: error }) })

    } else if (req.query.dateType == "Yearly") {

        transaction.find({ 
            
            $and: [
                { userID: req.params.id },
                { $expr: { $eq: [{ $year: "$txDate" }, new Date(req.query.startingDate).getFullYear()] } }
            ]
        
        }).then(async (docs) => {
            res.json(docs)
        }).catch((error) => { res.json({ empty: "empty", message: error }) })

    } else if (req.query.dateType == "Custom") {

        transaction.find({ 
            
            $and: [
                { $expr: { $gte: [{ $dayOfMonth: "$txDate" }, new Date(req.query.startingDate).getDate()] } },
                { $expr: { $gte: [{ $month: "$txDate" }, new Date(req.query.startingDate).getMonth()+1] } },
                { $expr: { $gte: [{ $year: "$txDate" }, new Date(req.query.startingDate).getFullYear()] } },
                { $expr: { $lte: [{ $dayOfMonth: "$txDate" }, new Date(req.query.endingDate).getDate()] } },
                { $expr: { $lte: [{ $month: "$txDate" }, new Date(req.query.endingDate).getMonth()+1] } },
                { $expr: { $lte: [{ $year: "$txDate" }, new Date(req.query.endingDate).getFullYear()] } },
            ]
        
        }).then(async (docs) => {
            res.json(docs)
        }).catch((error) => { res.json({ empty: "empty", message: error }) })
    }


})

app.listen(process.env.PORT || 4000, async () => {
    console.log("Server Starrted");

})