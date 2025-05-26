const express = require('express');
const cors = require('cors');
const app = app.express();
const port=process.env.PORT || 5000 ;


// Middleware
app.use(express.json());
app.use(cors());












app.get('/', (req, res) => {
res.send('server is rinning')
})

app.listen(port,()=>{
    console.log(`serve is running on prot:${port} `)
})