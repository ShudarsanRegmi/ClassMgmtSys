const mongoose = require('mongoose');

const facultiesSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email : {type: String, required: true},
});


module.exports  = mongoose.model('Faculties', facultiesSchema);