const express = require('express');
const app = express();
app.use(express.json());
const port = 3000;

app.use((req, res, next) => {

    if (req.url.startsWith('/secret')) {

        return res.status(403).json({ error: "Erişim reddedildi" });
    }
});




app.get('/secret-data', (req, res) => {
    res.json({ data: "Bu gizli veridir" });
});

app.get('/secret', (req, res) => {
    res.json({ data: "Bu gizli veridir" });
});

app.get('/', (req, res) => {
    res.json({ data: "Ana sayfa" });
});
app.listen(port, () => {
    console.log('server is running on  http://localhost:${port} ');
});
