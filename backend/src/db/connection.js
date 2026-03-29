import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config({quiet: true});

let con = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: 10,
});

export const query = (sql, params) => {
    return new Promise((resolve, reject) => {
        con.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

export const close = () => {
    return new Promise((resolve, reject) => {
        let pending = 2;

        const done = (err) => {
            if (err) return reject(err);
            pending--;
            if (pending === 0) resolve();
        };

        con.end(done);
    });
};
