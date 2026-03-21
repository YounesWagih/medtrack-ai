const express = require("express");
const axios = require("axios");
const app = express();
const PORT = 3000;

app.get("/products", async (req, res) => {
    const response = await axios.get("https://fakestoreapi.com/products");
    res.json(response.data);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/products`);
});
