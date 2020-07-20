const {BaseDTO, FunctionSource} = require('../src/base_dto')

describe('BaseDTO', () => {
	class TestNestedDTO extends BaseDTO{
		static databaseName = 'test_database'
		static fields = ['message']
	}

	class TestDTO extends BaseDTO{
		static databaseName(config){
			return `test_database_${config.value}`
		}
		static fields = [
			'_id',
			'_rev',
			'number_as_string',
			'float_as_string',
			{name: 'boolean_value_true', type: Boolean},
			{name: 'boolean_value_false', type: Boolean},
			{name: 'typed_number', type: Number},
			{name: 'typed_number_float', type: Number},
			{name: 'nested_dto', type: TestNestedDTO},
			{name: 'nested_dto_array', type: Array, subType: TestNestedDTO},
			{name: 'nested_dto_dictionary', type: Object, subType: TestNestedDTO}
		]
	}

	describe('lifecycle', () => {
		let dto
		let _id = 'test-id'
		let _rev = 'test-rev'
		let boolean_value_true = true
		let boolean_value_false = false
		let number_as_string = 5 // This should be interpreted as a string
		let float_as_string = 5.3 // This should be interpreted as a string
		let typed_number = 5 // This should be interpreted as a Number
		let typed_number_float = 5.2 // This should be interpreted as a Number as well
		let nested_dto = {message: 'Hello world!'}
		let nested_dto_array = [{message: 'one'}, {message: 'two'}]
		let nested_dto_dictionary = {'three': {message: 'three'}, 'four': {message: 'four'}}

		it('should be built from a JavaScript Object', () => {
			dto = new TestDTO({_id,
				_rev,
				boolean_value_true,
				boolean_value_false,
				number_as_string,
				float_as_string,
				typed_number,
				typed_number_float,
				nested_dto,
				nested_dto_array,
				nested_dto_dictionary})

			expect(dto._id).toEqual(_id)
			expect(dto._rev).toEqual(_rev)

			// Test native values, for example we want to make sure we aren't calling "new String", only "String"
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
			expect(typeof dto.boolean_value_true).toEqual('boolean')
			expect(dto.boolean_value_true).toBe(true)
			expect(typeof dto.boolean_value_false).toEqual('boolean')
			expect(dto.boolean_value_false).toBe(false)

			expect(typeof dto.typed_number).toEqual('number')
			expect(dto.typed_number).toEqual(5)
			expect(typeof dto.typed_number_float).toEqual('number')
			expect(dto.typed_number_float).toEqual(5.2)

			expect(typeof dto.number_as_string).toEqual('string')
			expect(dto.number_as_string).toEqual('5')
			expect(typeof dto.float_as_string).toEqual('string')
			expect(dto.float_as_string).toEqual('5.3')

			expect(dto.nested_dto).toEqual(jasmine.any(TestNestedDTO))
			expect(dto.nested_dto.message).toEqual(nested_dto.message)
			expect(dto.nested_dto_array[0]).toEqual(jasmine.any(TestNestedDTO))
			expect(dto.nested_dto_array[0].message).toEqual(nested_dto_array[0].message)
			expect(dto.nested_dto_array[1]).toEqual(jasmine.any(TestNestedDTO))
			expect(dto.nested_dto_array[1].message).toEqual(nested_dto_array[1].message)
			expect(dto.nested_dto_dictionary['three']).toEqual(jasmine.any(TestNestedDTO))
			expect(dto.nested_dto_dictionary['three'].message).toEqual(nested_dto_dictionary['three'].message)
		})

		it('should gracefully handle JSON with missing fields', () => {
			let dto_with_defaults = new TestDTO({_id, _rev})

			expect(dto_with_defaults.nested_dto).toEqual(jasmine.any(TestNestedDTO))
			expect(dto_with_defaults.nested_dto_array).toEqual([])
			expect(dto_with_defaults.nested_dto_dictionary).toEqual({})
		})

		it('should be able to be converted back to a JavaScript Object', () => {
			let object = dto.toJSON()

			expect(object['_id']).toEqual(_id)
			expect(object['_rev']).toEqual(_rev)

			expect(object['boolean_value_true']).toEqual(boolean_value_true)
			expect(object['boolean_value_false']).toEqual(boolean_value_false)
			expect(object['number_as_string']).toEqual(String(number_as_string))
			expect(object['float_as_string']).toEqual(String(float_as_string))
			expect(object['typed_number']).toEqual(typed_number)
			expect(object['typed_number_float']).toEqual(typed_number_float)
			expect(object['nested_dto']).toEqual(nested_dto)
			expect(object['nested_dto_array']).toEqual(nested_dto_array)
			expect(object['nested_dto_dictionary']).toEqual(nested_dto_dictionary)
		})

		describe('databaseName', () => {
			it('should support a string value', () => {
				expect(TestNestedDTO.getDatabaseName()).toEqual('test_database')
			})
			it('should support a function', () => {
				expect(TestDTO.getDatabaseName({value: 'foo'})).toEqual('test_database_foo')
			})
		})
	})
})

describe('FunctionSource', () => {
	/* eslint-disable brace-style */
	function testFunction(a, b){ return a+b }
	/* eslint-disable brace-style */

	let fnSource

	class DTOWithFunctionSource extends BaseDTO{
		static fields = [{name: 'callback', type: FunctionSource}]
	}

	it('should accept a function as an argument and store it as a string', () => {
		fnSource = new FunctionSource(testFunction)
		expect(fnSource.source).toEqual('function testFunction(a, b){ return a+b }')
	})

	it('should be able to convert the source string back into a function', () => {
		let a = 10, b = 20, sum = 30
		expect(testFunction(a, b)).toEqual(sum) // sanity check
		expect(fnSource.toFunction()(a, b)).toEqual(testFunction(a, b))
	})

	it('should be compatible with BaseDTOs', () => {
		let dto = new DTOWithFunctionSource()

		dto.callback = testFunction

		expect(dto.toJSON()).toEqual({callback: 'function testFunction(a, b){ return a+b }'})
	})
})
