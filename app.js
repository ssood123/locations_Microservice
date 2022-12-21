import express from 'express'
import pool from './database.js'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import cors from 'cors'
import axios from 'axios'
dotenv.config()
const app = express()
app.use(express.json())
app.use(bodyParser.urlencoded({
	extended: true
}))
app.use(
	cors({
		origin: "*",
		credentials: true
	})
)

const databaseTableName = process.env.MYSQL_DATABASE_TABLE_NAME

app.get('/seed', async (req, res) => {
	await pool.query(`DELETE FROM ${databaseTableName}`)
	await pool.query(`INSERT INTO ${databaseTableName} (locationID, timezone, country, students) VALUES (0, 'EST', 'USA', 'ab1234, bc1234, cd1234')`)
	await pool.query(`INSERT INTO ${databaseTableName} (timezone, country, students) VALUES ('CST', 'USA', 'ef1234, gh1234')`)
	await pool.query(`INSERT INTO ${databaseTableName} (timezone, country, students) VALUES ('MST', 'USA', 'ij1234')`)
	await pool.query(`INSERT INTO ${databaseTableName} (timezone, country, students) VALUES ('PST', 'USA', 'kl1234, mn1234, op1234')`)
	res.status(201).json({status: "success", message: "seeded database with initial values"})
})

app.get('/test', async (req, res) => {
	res.status(201).json({status: "success", message: "You have successfully connected"})
})

app.get('/locations', async (req, res) => {
	const locations = await pool.query(`SELECT * FROM ${databaseTableName}`)
	let filteredLocations = []
	for (let i = 0; i < locations[0].length; i++) {
		filteredLocations.push(locations[0][i].timezone)
	}
	let sendResponse = {}
	sendResponse['statusCode'] = 200
	sendResponse['data'] = filteredLocations
	let HATEOASlinks = []
	sendResponse['links'] = HATEOASlinks
	res.status(200).json(sendResponse)
})


app.use((err, req, res, next) => {
	console.error(err.stack)
	res.status(500).send({status: "error", message: "Something broke!"})
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
	console.log(`server is running on port ${PORT}`)
})