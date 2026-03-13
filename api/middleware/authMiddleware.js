//Middleware di controllo, serve per capire se un utente è loggato o meno

module.exports = (req, next) =>{
    // Controlla se l'ID utente è presente nel corpo della richiesta (ad esempio, inviato dal frontend)
    let tempId = req.body.userId;

    // Se l'ID utente non è fornito, utilizza l'ID della sessione corrente come identificativo temporaneo
    if (!tempId) {
        tempId = req.sessionID;
    }

    // Memorizza l'identificatore (utente o sessione) nell'oggetto richiesta per i passaggi successivi
    req.userIdentifier = tempId;

    // Passa il controllo al middleware successivo
    next();
}