let messageList = {
    SERVER_ERROR: "Szerver hiba!",

    INVALID_LOGIN: "Hibás belépési adatok!",
    USER_EXISTS: "A felhasználó név már létezik!",
    DATA_CHANGED: "Adatok sikeresen megváltoztatva!",
    INPUT_DOESNT_MATCH: "A jelszavak nem egyeznek!",

    NO_FUNDS: "Nincs elegendő pénz a tranzakcióhoz!",

    METHOD_PAYPAL: "PayPal",
    METHOD_WIRE: "Banki átutalás",

    UNAVAIL_DRIVER: "A sofőr nem elérhető!",
    DRIVER_DISMISS: "A sofőr elutasította a fuvart!",
    DRIVER_LOST: "A sofőr nem található!",

    PASSENGER_LOST: "Nem található a fuvar!",

    ROUTE_STATUS_0: "Úton az utashoz.",
    ROUTE_STATUS_1: "Várakozás az utasra.",

    ROUTE_STATUS_2: "Várakozás az utasra.",
    ROUTE_STATUS_2_DRIVER: "Várakozás az utas válaszára.",
    ROUTE_STATUS_2_PASSENGER: "Várakozás a sofőr válaszára.",

    ROUTE_STATUS_3: "Úton a célhoz.",
    ROUTE_STATUS_4: "Célhoz ért.",
};

export default function lookupMessage(msg){
    if (messageList[msg] == null){
        return "[" + msg + "]";
    }

    return messageList[msg];
}