# locations Microservice

#### GET /seed
Delete all entries in the database and initialize the database with initial (sample) entries

#### GET /test
Test the connection

#### GET /locations
Get a location of all timezones

#### POST /locations
Create a new location by specifying timezone, countries, students in the request body

#### DELETE /locations/{timezone}
Delete an entire location/timezone

#### GET /locations/{timezone}/countries
Get a list of countries associated with a timezone

#### PUT /locations/{timezone}/countries
Update the timezone and countries associated with a location by specifying the location and countries in the request body

#### DELETE /locations/{timezone}/countries/{country}
Delete a country from the list of countries associated with a timezone

#### GET /locations/{timezone}/students
Get the list of students in a timezone

#### PUT /locations/{timezone}/students
Update the list of students in a timezone by sepcifying the students in the request body

#### DELETE /locations/{timezone}/students/{student}
Delete a student from the list of students in a timezone

#### GET /locations/{id}/id
Get the full details of a student based on a student ID

# Example of a request body:

{
    "timezone": "EST",
    "countries": "USA, Canada",
    "unis": "aa1234, bb1234, cc1234, dd1234"
}

