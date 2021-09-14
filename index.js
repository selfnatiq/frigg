const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, 'data.csv')

let content = fs.readFileSync(file, 'utf8')
content = csvJSON(content)

writeTypeCollection(content)
writeSystemUserCollection(content)
writeUserGroupCollection(content)
mergeEverything(content)

// fss
function csvJSON(csv) {
	const lines = csv.split('\n')
	const result = []
	const headers = lines[0].split(',')

	for (let i = 1; i < lines.length; i++) {
		if (!lines[i]) continue

		const obj = {}
		const currentline = lines[i].split(',')

		for (let j = 0; j < headers.length; j++) {
			obj[headers[j].replace('#', '').trim()] = currentline[j]
		}
		result.push(obj)
	}

	return result
}

function jsonCSV(json) {
	if (json.length === 0) {
		return
	}

	json.sort((a, b) => {
		return Object.keys(b).length - Object.keys(a).length
	})

	const replacer = (key, value) => (value === null ? '' : value)

	const header = Object.keys(json[0])

	let csv = json.map((row) =>
		header
			.map((fieldName) => {
				const str = JSON.stringify(row[fieldName], replacer).replace(/"/g, '')
				return str
			})
			.join(',')
	)

	csv.unshift(header.join(','))
	csv = csv.join('\r\n')

	return csv
}

function writeTypeCollection(content) {
	const typeFile = path.join(__dirname, 'type.csv')

	const data = content.reduce((acc, next) => {
		const { count: _id, type } = next
		const foundType = acc.find((el) => el.type === type)

		if (!foundType) {
			acc.push({ _id, type })
		}

		return acc
	}, [])

	fs.writeFileSync(typeFile, jsonCSV(data), 'utf-8')

	return data
}

function writeSystemUserCollection(content) {
	const systemUserFile = path.join(__dirname, 'systemUser.csv')

	const data = content.reduce((acc, next) => {
		const { uid: _id, user } = next
		const foundUser = acc.find((el) => el.user === user)

		if (!foundUser) {
			acc.push({ _id, user })
		}

		return acc
	}, [])

	fs.writeFileSync(systemUserFile, jsonCSV(data), 'utf-8')

	return data
}

function writeUserGroupCollection(content) {
	const userGroupFile = path.join(__dirname, 'userGroup.csv')

	const data = content.reduce((acc, next) => {
		const { gid: _id, group } = next
		const foundGroup = acc.find((el) => el.group === group)

		if (!foundGroup) {
			acc.push({ _id, group })
		}

		return acc
	}, [])

	fs.writeFileSync(userGroupFile, jsonCSV(data), 'utf-8')

	return data
}

function mergeEverything(content) {
	const dataFile = path.join(__dirname, 'import.csv')

	const types = writeTypeCollection(content)
	const systemUsers = writeSystemUserCollection(content)
	const systemGroups = writeUserGroupCollection(content)

	const data = content.reduce((acc, next) => {
		const {
			count: _id,
			data: content,
			size,
			compression,
			uid,
			gid,
			type,
			path,
			time,
			mode,
		} = next

		const foundType = types.find((el) => el.type === type)
		const foundUser = systemUsers.find((user) => user._id === uid)
		const foundGroup = systemGroups.find((group) => group._id === gid)

		const doc = {
			_id,
			size,
			compression,
			systemUser: foundUser._id,
			userGroup: foundGroup._id,
			type: foundType._id,
			path,
			time,
			mode,
			content,
		}

		acc.push(doc)

		return acc
	}, [])

	fs.writeFileSync(dataFile, jsonCSV(data), 'utf-8')
}
