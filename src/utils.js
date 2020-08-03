
function getUserDatabaseName(userName){
	// TODO Make userdb prefix configurable
	return `userdb-${toHex(userName)}`
}

function toHex(s){
	// utf8 to latin1
	s = unescape(encodeURIComponent(s))
	let h = ''
	for (let i = 0; i < s.length; i++){
		h += s.charCodeAt(i).toString(16)
	}
	return h
}

module.exports = {
	getUserDatabaseName
}
