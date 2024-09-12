const express = require("express");
const router = express.Router();
const {short,getall,del,getOne} = require("../controllers/url.js")

router.post('/',short)
router.get('/',getall)
router.post('/remove',del)
router.get('/url/:code',getOne)

module.exports = router;