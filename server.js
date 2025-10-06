'use strict';

require('dotenv').config();
const app = require('./app'); // Importa la configurazione da app.js
const port = process.env.PORT

app.listen(port, () => {
  console.log(`Server FunShop in ascolto su http://localhost:${port}`);
});