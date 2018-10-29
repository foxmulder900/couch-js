class BaseDTO{
	static databaseName(){
		throw Error('BaseDTO is not associated with a database. This method needs overridden!')
	}

	static getFields(){
		// TODO We should use class-fields here instead of defining from a list in the constructor. Once class-fields
		// TODO are officially supported in JS, this should be refactored.
		// TODO See proposal here: https://github.com/tc39/proposal-class-fields
		return['_id', '_rev']
	}

	constructor(jsonObj){
		this.fields = this.constructor.getFields()
		jsonObj && this.fromJSON(jsonObj)
	}

	fromJSON(jsonObj){
		this.fields.forEach(field => {
			let fieldName;
			let fieldType;

			if(typeof field === 'string'){
				fieldName = field
				fieldType = String
			}
			else{
				fieldName = field.name
				fieldType = field.type
			}

			if(fieldType === Array){
				let array = []
				let subType = field.subType
				jsonObj[fieldName].forEach(subObject => {
					array.push(new subType(subObject))
				})
				this[fieldName] = array
			}
			else{
				let fieldValue = jsonObj[fieldName]
				this[fieldName] = new fieldType(fieldValue)
			}
		})
	}

	toJSON(){
		let jsonObj = {}
		this.fields.forEach(fieldName => {
			jsonObj[fieldName] = this[fieldName]
		})
		return jsonObj
	}
}

class BaseDTOField{
	constructor(name, type){
		this.name = name
		this.type = type || 'string'
	}
}

module.exports = BaseDTO
