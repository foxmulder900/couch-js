class BaseDTO{
	static databaseName = null
	static fields = []

	static getDatabaseName(config){
		if(!this.databaseName){
			throw new Error('databaseName not defined!')
		}
		let isFunction = typeof this.databaseName === 'function'
		return isFunction ? this.databaseName(config) : this.databaseName
	}

	_getFields(){
		return Object.getPrototypeOf(this).constructor.fields
	}

	_initFields(){
		this._fields = {}
		this._getFields().forEach(field => {
			if(typeof field === 'string'){
				this._fields[field] = {
					type: String
				}
			}
			else{
				if((field.type === Object || field.type === Array) && field.subType === undefined){
					field.subType = String
				}
				this._fields[field.name] = field
			}
		})
	}

	_buildProxy(){
		function getField(target, name){
			if(name === '_fields'){
				throw new Error(`Unable to set set value, "_fields" is a reserved property used by couch-js.`)
			}
			if(!target._fields.hasOwnProperty(name)){
				throw new Error(`Unable to set value, object does not have field with name: ${name}`)
			}
			return target._fields[name]
		}

		function validateValueType(field, value){
			let fieldType = field.type
			if(fieldType === Array && !Array.isArray(value)){
				throw new Error(`Expected Array for field ${name} got ${typeof value}`)
			}
		}

		return new Proxy(this, {
			// Intercepts set/get and handles type-checking
			// Only handles conversion of primitive types
			set(target, name, value){
				let field = getField(target, name)

				if(value === undefined || value === null){
					// TODO: Throw an error if value is required
					// Should we convert all nulls to undefined?
					target[name] = value
					return true
				}

				validateValueType(field, value)

				// TODO probably move all non-primitive casting to fromJSON
				// So move FunctionSource, but leave the isPrimitive block
				if(field.type === FunctionSource){
					target[name] = new FunctionSource(value)
					return true
				}
				else if(field.type === Object && field.subType === FunctionSource){
					let obj = Object(value)
					Object.keys(obj).map(key => {
						obj[key] = new FunctionSource(obj[key])
					})
					target[name] = obj
					return true
				}
				else if(isPrimitive(field.type)){
					target[name] = field.type(value)
					return true
				}
				else{
					target[name] = value
					return true
				}
			},

			get(target, name){
				let field = target._fields[name]
				if(field){
					if(field.type === String){
						let value = target[name]
						if(value){
							return target[name].valueOf()
						}
						return value ? value.valueOf() : value
					}
					else if(field.type === FunctionSource){
						let value = target[name]
						return value ? value.getSource() : value
					}
					else if(field.type === Object && field.subType === FunctionSource){
						let obj = Object(target[name])
						Object.keys(obj).map(key => {
							obj[key] = obj[key].getSource()
						})
						return obj
					}
				}

				return target[name]
			}
		})
	}

	constructor(jsonObj){
		this._initFields()
		let proxy =this._buildProxy()
		jsonObj && proxy.fromJSON(jsonObj)
		return proxy
	}

	fromJSON(jsonObj){
		Object.keys(this._fields).forEach(fieldName => {
			let field = this._fields[fieldName]
			let value = jsonObj[fieldName]

			if(field.type === Array){
				this[fieldName] = value ? value.map(subObject => new field.subType(subObject)) : []
			}
			else if(field.type === Object){
				this[fieldName] = value
					? Object.assign(
						{}, ...Object.keys(value).map(key => ({[key]: new field.subType(value[key])}))
					) : {}
			}
			else if(isDTO(field.type)){
				this[fieldName] = new field.type(value)
			}
			else{
				this[fieldName] = value
			}
		})
	}

	toJSON(){
		let jsonObj = {}
		Object.keys(this._fields).forEach(fieldName => {
			let field = this._fields[fieldName]
			let value = this[fieldName]

			if(field.type === Array){
				jsonObj[fieldName] = isDTO(field.subType) ? value.map(subObject => subObject.toJSON()) : value
			}
			else if(field.type === Object){
				jsonObj[fieldName] = isDTO(field.subType)
					? Object.assign(
						{}, ...Object.keys(value).map(key => ({[key]: value[key].toJSON()}))
					) : value
			}
			else if(isDTO(field.type)){
				jsonObj[fieldName] = value.toJSON()
			}
			else{
				jsonObj[fieldName] = value
			}
		})
		return jsonObj
	}
}

class FunctionSource{
	constructor(function_definition){
		this.source = function_definition.toString()
	}

	toFunction(){
		let body_start = this.source.indexOf('{'),
			body_end = this.source.lastIndexOf('}'),
			body = this.source.substring(body_start+1, body_end),
			declaration = this.source.substring(0, body_start),
			parameter_start = declaration.indexOf('('),
			parameter_end = declaration.lastIndexOf(')'),
			parameters = declaration.substring(parameter_start+1, parameter_end).split(',')

		return Function.apply(this, [...parameters, body])
	}

	getSource(){
		return this.source
	}
}

function isDTO(cls){
	return Boolean(cls.prototype instanceof BaseDTO)
}

function isPrimitive(cls){
	return Boolean(cls === Boolean || cls === Number || cls === String || cls === Object)
}

module.exports = {
	BaseDTO,
	FunctionSource
}
