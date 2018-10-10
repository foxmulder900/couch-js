class BaseDTO{
	static databaseName(){
		throw Error('BaseDTO is not associated with a database. This method needs overridden!')
	}

	static getFields(){
		// TODO We should use class-fields here instead of defining from a list in the constructor. Once class-fields
		// TODO are officially supported in JS, this should be refactored.
		// TODO See proposal here: https://github.com/tc39/proposal-class-fields
		return['id', 'rev']
	}

	constructor(jsonObj){
		this.fields = this.constructor.getFields()
		jsonObj && this.fromJSON(jsonObj)
	}

	fromJSON(jsonObj){
		this.fields.forEach(fieldName => {
			this[fieldName] = jsonObj[fieldName]
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

module.exports = BaseDTO
