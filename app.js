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
	await pool.query(`INSERT INTO ${databaseTableName} (locationID, timezone, countries, students) VALUES (0, 'EST', 'USA', 'ab1234, bc1234, cd1234')`)
	await pool.query(`INSERT INTO ${databaseTableName} (timezone, countries, students) VALUES ('CST', 'USA', 'ef1234, gh1234')`)
	await pool.query(`INSERT INTO ${databaseTableName} (timezone, countries, students) VALUES ('MST', 'USA', 'ij1234')`)
	await pool.query(`INSERT INTO ${databaseTableName} (timezone, countries, students) VALUES ('PST', 'USA', 'kl1234, mn1234, op1234')`)
	res.status(201).json({status: "success", message: "seeded database with initial values"})
})

app.get('/test', async (req, res) => {
	res.status(201).json({status: "success", message: "You have successfully connected"})
})

app.get('/locations', async (req, res) => {
	const locations = await pool.query(`SELECT * FROM ${databaseTableName}`)
	let filteredLocations = []
	if (req.query.limit && req.query.offset) {
		for (let i = parseInt(req.query.offset); i < parseInt(req.query.offset) + parseInt(req.query.limit); i++) {
			filteredLocations.push(locations[0][i].timezone)
		}
	} else {
		for (let i = 0; i < locations[0].length; i++) {
			filteredLocations.push(locations[0][i].timezone)
		}
	}
	let sendResponse = {}
	sendResponse['statusCode'] = 200
	sendResponse['data'] = filteredLocations
	let HATEOASlinks = []
	HATEOASlinks.push({"href" : "/locations", "rel": "self", "type": "GET"})
	HATEOASlinks.push({"href" : "/locations", "rel": "self", "type": "POST"})
	sendResponse['links'] = HATEOASlinks
	res.status(200).json(sendResponse)
})

app.post('/locations', async (req, res) => {
	const {timezone, countries, unis} = req.body
	await pool.query(`INSERT INTO ${databaseTableName} (timezone, countries, students) VALUES (?, ?, ?)`, [timezone, countries, unis])
	let sendResponse = {}
	sendResponse['statusCode'] = 201
	sendResponse['message'] = "successfully created new location"
	res.status(201).json(sendResponse)	
})

app.delete('/locations/:timezone', async (req, res) => {
	const location = await pool.query(`SELECT * FROM ${databaseTableName} where timezone = ?`, [req.params.timezone])
	if (location[0][0]) {
		await pool.query(`DELETE FROM ${databaseTableName} WHERE timezone = ?`, [req.params.timezone])
		let sendResponse = {}
		sendResponse['statusCode'] = 200
		sendResponse['message'] = "successfully deleted location timezone"
		res.status(200).json(sendResponse)
	} else {
		let sendResponse = {}
		sendResponse['statusCode'] = 400
		sendResponse['message'] = "timezone doesn't exist"
		res.status(400).json(sendResponse)		
	}
})

app.get('/locations/:timezone/countries', async (req, res) => {
	const location = await pool.query(`SELECT * FROM ${databaseTableName} where timezone = ?`, [req.params.timezone])
	if (location[0][0]) {
		let sendResponse = {}
		sendResponse['statusCode'] = 200
		let filteredCountries = []
		if (req.query.offset && req.query.limit) {
			let tempCountries = location[0][0].countries.split(', ')
			for (let i = parseInt(req.query.offset); i < parseInt(req.query.offset) + parseInt(req.query.limit); i++) {
				filteredCountries.push(tempCountries[i])
			}
			filteredCountries = filteredCountries.join(', ')
		} else {
			filteredCountries = location[0][0].countries
		}
		sendResponse['data'] = filteredCountries
		let HATEOASlinks = []
		HATEOASlinks.push({"href" : `/locations/${req.params.timezone}/countries`, "rel": "self", "type": "GET"})
		HATEOASlinks.push({"href" : `/locations/${req.params.timezone}/students`, "rel": "students", "type": "GET"})
		sendResponse['links'] = HATEOASlinks
		res.status(200).json(sendResponse)
	} else {
		let sendResponse = {}
		sendResponse['statusCode'] = 400
		sendResponse['message'] = "timezone does not exist"
		res.status(400).json(sendResponse)
	}
})

app.put('/locations/:timezone/countries', async (req, res) => {
	const {timezone, countries} = req.body
	const location = await pool.query(`SELECT * FROM ${databaseTableName} where timezone = ?`, [req.params.timezone])
	if (location[0][0]) {
		await pool.query(`UPDATE ${databaseTableName} SET timezone = ?, countries = ? WHERE locationID = ${location[0][0].locationID}`, [timezone, countries]);
		let sendResponse = {}
		sendResponse['statusCode'] = 200
		sendResponse['message'] = "successfully updated existing location countries"
		res.status(200).json(sendResponse)	
	} else {
		let sendResponse = {}
		sendResponse['statusCode'] = 400
		sendResponse['message'] = "location with given timezone doesn't exist"
		res.status(400).json(sendResponse)			
	}
})

app.delete('/locations/:timezone/countries/:country', async (req, res) => {
	const country = req.params.country
	const location = await pool.query(`SELECT * FROM ${databaseTableName} where timezone = ?`, [req.params.timezone])
	if (location[0][0]) {
		let tempCountries = location[0][0].countries
		if (tempCountries.includes(country)) {
			let tempCountries2 = tempCountries.split(', ')
			let tempCountries3 = tempCountries2.filter((e) => {
				return e !== country
			})
			let tempCountries4 = tempCountries3.join(', ')
			await pool.query(`UPDATE ${databaseTableName} SET countries = ? WHERE locationID = ${location[0][0].locationID}`, [tempCountries4]);
			let sendResponse = {}
			sendResponse['statusCode'] = 200
			sendResponse['message'] = "successfully deleted country from location with given timezone"
			res.status(200).json(sendResponse)
			return			
		} else {
			let sendResponse = {}
			sendResponse['statusCode'] = 400
			sendResponse['message'] = "the location with given timezone doesn't contain specified country"
			res.status(400).json(sendResponse)
			return
		}
	} else {
		let sendResponse = {}
		sendResponse['statusCode'] = 400
		sendResponse['message'] = "location with given timezone doesn't exist"
		res.status(400).json(sendResponse)
	}
})

app.get('/locations/:timezone/students', async (req, res) => {
	const location = await pool.query(`SELECT * FROM ${databaseTableName} where timezone = ?`, [req.params.timezone])
	if (location[0][0]) {
		let sendResponse = {}
		sendResponse['statusCode'] = 200
		let filteredStudents = []
		if (req.query.offset && req.query.limit) {
			let tempStudents = location[0][0].students.split(', ')
			for (let i = parseInt(req.query.offset); i < parseInt(req.query.offset) + parseInt(req.query.limit); i++) {
				filteredStudents.push(tempStudents[i])
			}
			filteredStudents = filteredStudents.join(', ')
		} else {
			filteredStudents = location[0][0].students
		}
		sendResponse['data'] = filteredStudents
		let HATEOASlinks = []
		HATEOASlinks.push({"href" : `/locations/${req.params.timezone}/students`, "rel": "self", "type": "GET"})
		HATEOASlinks.push({"href" : `/locations/${req.params.timezone}/countries`, "rel": "countries", "type": "GET"})
		sendResponse['links'] = HATEOASlinks
		res.status(200).json(sendResponse)
	} else {
		let sendResponse = {}
		sendResponse['statusCode'] = 400
		sendResponse['message'] = "timezone does not exist"
		res.status(400).json(sendResponse)
	}	
})

app.put('/locations/:timezone/students', async (req, res) => {
	const { unis } = req.body
	const location = await pool.query(`SELECT * FROM ${databaseTableName} where timezone = ?`, [req.params.timezone])
	if (location[0][0]) {
		await pool.query(`UPDATE ${databaseTableName} SET students = ? WHERE locationID = ${location[0][0].locationID}`, [unis]);
		let sendResponse = {}
		sendResponse['statusCode'] = 200
		sendResponse['message'] = "successfully updated existing location's students"
		res.status(200).json(sendResponse)	
	} else {
		let sendResponse = {}
		sendResponse['statusCode'] = 400
		sendResponse['message'] = "location with given timezone doesn't exist"
		res.status(400).json(sendResponse)			
	}
})

app.delete('/locations/:timezone/students/:student', async (req, res) => {
	const student = req.params.student
	const location = await pool.query(`SELECT * FROM ${databaseTableName} where timezone = ?`, [req.params.timezone])
	if (location[0][0]) {
		let tempStudents = location[0][0].students
		if (tempStudents.includes(student)) {
			let tempStudents2 = tempStudents.split(', ')
			let tempStudents3 = tempStudents2.filter((e) => {
				return e !== student
			})
			let tempStudents4 = tempStudents3.join(', ')
			await pool.query(`UPDATE ${databaseTableName} SET students = ? WHERE locationID = ${location[0][0].locationID}`, [tempStudents4]);
			let sendResponse = {}
			sendResponse['statusCode'] = 200
			sendResponse['message'] = "successfully deleted student from location with given timezone"
			res.status(200).json(sendResponse)
			return			
		} else {
			let sendResponse = {}
			sendResponse['statusCode'] = 400
			sendResponse['message'] = "the location with given timezone doesn't contain specified student"
			res.status(400).json(sendResponse)
			return
		}
	} else {
		let sendResponse = {}
		sendResponse['statusCode'] = 400
		sendResponse['message'] = "location with given timezone doesn't exist"
		res.status(400).json(sendResponse)
	}	
})

app.get('/locations/:id/id', async (req, res) => {
	const location = await pool.query(`SELECT * FROM ${databaseTableName} where locationID = ?`,[req.params.id])
	if (location[0][0]) {
		let sendResponse = {}
		sendResponse['statusCode'] = 200
		sendResponse['data'] = location[0][0]
		let HATEOASlinks = []
		HATEOASlinks.push({"href": `/locations/${req.params.id}/id`, "rel" : "self", "type" : "GET"})
		sendResponse['links'] = HATEOASlinks
		res.status(200).json(sendResponse)
	} else {
		let sendResponse = {}
		sendResponse['statusCode'] = 400
		sendResponse['message'] = "location with given id does not exist"
		res.status(400).json(sendResponse)
	}
})


app.use((err, req, res, next) => {
	console.error(err.stack)
	res.status(500).send({status: "error", message: "Something broke!"})
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
	console.log(`server is running on port ${PORT}`)
})