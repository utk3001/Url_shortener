const url = require("../models/url.js")
const shortId = require("shortid")

const short = async (req, res) => {
    try {
        const search = await url.findOne({ long: req.body.long })
        if (search) {
            const del = await url.deleteOne({ long: req.body.long });
        }
        const short = shortId.generate()
        const data = await url.create({ long: req.body.long, short: short })
        res.status(200).json(data)
    }
    catch (error) {
        console.log(`Error: ${error}`)
        res.status(404).json({ error: error })
    }
}

const getall = async (req, res) => {
    try {
        url.find({}).then((data) => {
            res.send({ status: "200", data: data })
        });
    } catch (error) {
        res.json(404);
    }
}

const del = async (req, res) => {
    try {
        const del = await url.findOneAndDelete({ long: req.body.long });
        if (!del) {
            throw new Error("Item not found");
        } else {
            res.status(200).json(del);
        }
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
}

const getOne = async (req, res) => {
    try {
        const data = await url.findOne({short:req.params.code})
        if (!data) {
            throw new Error("Item not found");
        }
        data.clicks++
        data.save()
        console.log(data.long)
        res.redirect(data.long)
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
}

module.exports = { short, getall, del, getOne }