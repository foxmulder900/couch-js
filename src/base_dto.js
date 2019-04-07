class BaseDTO{
	static databaseName(){
		throw Error('DTO is not associated with a database. This method needs overridden!')
	}

	static getFields(){
		// TODO We should use class-fields here instead of defining from a list in the constructor. Once class-fields
		// TODO are officially supported in JS, this should be refactored.
		// TODO See proposal here: https://github.com/tc39/proposal-class-fields
		throw Error('DTO has no fields defined. This method needs overridden!')
	}

	static _initFields(fields){
		let fieldMap = {}
		fields.forEach(field => {
			if(typeof field === 'string'){
				fieldMap[field] = {
					type: String
				}
			}else{
				if((field.type === Object || field.type === Array) && field.subType === undefined){
					field.subType = String
				}
				fieldMap[field.name] = field
			}
		})
		return fieldMap
	}

	constructor(jsonObj){
		this._fields = BaseDTO._initFields(this.constructor.getFields())

		let proxy = new Proxy(this, {
			// Intercepts set/get and handles type-checking
			// Only handles conversion of primitive types
			set(target, name, value){
				if(name === '_fields'){
					throw new Error(`Unable to set set value, "_fields" is a reserved property used by couch-js.`)
				}

				if(value === undefined || value === null){
					// TODO: Throw an error if value is required
					// Should we convert all nulls to undefined?
					target[name] = value
					return true
				}

				let fieldType = target._fields[name].type

				if(fieldType === Array && !Array.isArray(value)){
					throw new Error('Expected Array type!')
				}

				if(isPrimitive(fieldType)){
					target[name] = fieldType(value)
					return true
				}

				target[name] = value
				return true
			},

			get(target, name){
				let field = target._fields[name]
				if(field){
					if(field.type === String){
						let value = target[name]
						if(value){
							return target[name].valueOf()
						}
					}
				}

				return target[name]
			}
		})

		jsonObj && proxy.fromJSON(jsonObj)

		return proxy
	}

	fromJSON(jsonObj){
		Object.keys(this._fields).forEach(fieldName => {
			let field = this._fields[fieldName]
			if(field.type === Array){
				if(jsonObj[fieldName]){
					let subType = field.subType
					this[fieldName] = jsonObj[fieldName].map(subObject => new subType(subObject))
				}else{
					this[fieldName] = []
				}
			}else if(field.type === Object){
				if(jsonObj[fieldName]){
					let dictionary = {}
					let subType = field.subType
					Object.entries(jsonObj[fieldName])
						.forEach(entry => dictionary[entry[0]] = new subType(entry[1]))
					this[fieldName] = dictionary
				}else{
					this[fieldName] = {}
				}
			}else if(isDTO(field.type)){
				this[fieldName] = new field.type(jsonObj[fieldName])
			}else{
				this[fieldName] = jsonObj[fieldName]
			}
		})
	}

	toJSON(){
		let jsonObj = {}
		Object.keys(this._fields).forEach(fieldName => {
			let field = this._fields[fieldName]
			if(field.type === Array){
				if(isDTO(field.subType)){
					jsonObj[fieldName] = this[fieldName].map(subObject => subObject.toJSON())
				}else{
					jsonObj[fieldName] = this[fieldName]
				}
			}else if(field.type === Object){
				// TODO: make this more robust, it will only convert shallow instances of DTOs back to json
				if(isDTO(field.subType)){
					let dictionary = {}
					Object.entries(this[fieldName])
						.forEach(entry => dictionary[entry[0]] = entry[1].toJSON())
					jsonObj[fieldName] = dictionary
				}else{
					jsonObj[fieldName] = this[fieldName]
				}
			}else if(isDTO(field.type)){
				jsonObj[fieldName] = this[fieldName].toJSON()
			}else{
				jsonObj[fieldName] = this[fieldName]
			}
		})
		return jsonObj
	}
}

function isDTO(cls){
	return Boolean(cls.prototype instanceof BaseDTO)
}

function isPrimitive(cls){
	return Boolean(cls === Boolean || cls === Number || cls === String || cls === Object)
}

module.exports = BaseDTO
