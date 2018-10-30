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
			}
			else{
				fieldMap[field] = field
			}
		})
		return fieldMap
	}

	constructor(jsonObj){
		this._fields = BaseDTO._initFields(this.constructor.getFields())

		let proxy = new Proxy(this, {
			set(target, name, value) {
				if (name === '_fields') {
					throw new Error(`Unable to set set value, "_fields" is a reserved property used by couch-js.`);
				}

				let fieldType = target._fields[name].type
				if (fieldType === Array){
					if(!Array.isArray(value)){
						throw new Error('Expected Array type!')
					}
				}
				else {
					if(value && typeof value !== fieldType){
						value = new fieldType(value)
					}
				}

				target[name] = value;
				return true;
			},

			get(target, name) {
				let field = target._fields[name]
				if(field){
					if (field.type === String){
						let value = target[name]
						if(value){
							return target[name].valueOf()
						}
					}
				}

				return target[name];
			}
		});

		jsonObj && proxy.fromJSON(jsonObj)

		return proxy
	}

	fromJSON(jsonObj){
		Object.keys(this._fields).forEach(fieldName => {
			let field = this._fields[fieldName]

			if(field.type === Array){
				let array = []
				let subType = field.subType
				jsonObj[fieldName].forEach(subObject => {
					array.push(new subType(subObject))
				})
				this[fieldName] = array
			}
			else{
				this[fieldName] = jsonObj[fieldName]
			}
		})
	}

	toJSON(){
		let jsonObj = {}
		Object.keys(this._fields).forEach(fieldName => {
			let field = this._fields[fieldName]
			jsonObj[fieldName] = this[fieldName]
		})
		return jsonObj
	}
}

module.exports = BaseDTO
