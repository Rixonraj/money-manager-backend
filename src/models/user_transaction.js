const mongoose = require('mongoose');

const Schema = mongoose.Schema;


const transactionSchema = new Schema({


    userID: {
        required: true,
        type: String
    },
    txType: {
        required: true,
        type: String
    },
    txDescription: {
        required: true,
        type: String
    },
    txDate: {
        required: true,
        type: Date
    },
    txCategory: {
        required: true,
        type: String
    },
    txDivision: {
        required: true,
        type: String
    },
    txAmount: {
        required: true,
        type: Number
    }
}
    , {
        timestamps: true,
    }

);

const transaction = mongoose.model('transaction', transactionSchema, 'transaction_collection');
module.exports = transaction;