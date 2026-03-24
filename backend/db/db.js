import mysql from 'mysql';
import dotenv from 'dotenv';
dotenv.config('../../.env');

let stdCon = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'standarduser',
    // eslint-disable-next-line no-undef
    password: process.env.DB_STANDARD,
    database: 'registrationdb',
    connectionLimit: 10,
});

let admCon = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'adminuser',
    // eslint-disable-next-line no-undef
    password: process.env.DB_ADMIN,
    database: 'registrationdb',
    connectionLimit: 10,
});

export const queryStd = (sql, params) => {
    return new Promise((resolve, reject) => {
        stdCon.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

export const queryAdm = (sql, params) => {
    return new Promise((resolve, reject) => {
        admCon.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};
