const BaseDTO = require('../src/base_dto').BaseDTO
const isDTO = require('../src/base_dto').isDTO

describe('BaseDTO', () => {
	class TestNestedDTO extends BaseDTO{
		static databaseName = 'test_database'
		static fields = ['_id', 'message']
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
		let nested_dto = {_id: '123', message: 'Hello world!'}
		let nested_dto_array = [{_id: '0', message: 'one'}, {_id: '1', message: 'two'}]
		let nested_dto_dictionary = {
			'three': {_id: 'three', message: 'three'},
			'four': {_id: 'three', message: 'four'}
		}

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

	describe('errors', () => {
		it('should not allow _fields to be set', () => {
			let dto = new TestDTO()
			let expected_error = new Error(`Unable to set set value, "_fields" is a reserved property used by couch-js.`)

			expect(() => {
				dto._fields = 'test'
			}).toThrow(expected_error)
		})

		it('should not allow _fields to be set', () => {
			let dto = new TestDTO()
			let expected_error = new Error(`Unable to set value, object does not have field with name: fake_field`)

			expect(() => {
				dto.fake_field = 'test'
			}).toThrow(expected_error)
		})
	})

	describe('getters and setters', () => {
		it('should convert object to DTO class', () => {
			let dto = new TestDTO()
			dto.nested_dto = {'_id': 1, 'message': 'hello'}

			expect(dto.nested_dto).toBeInstanceOf(TestNestedDTO)
		})

		it('should convert array objects to DTO subType', () => {
			let dto = new TestDTO()
			dto.nested_dto_array = [
				new TestNestedDTO({'_id': 1, 'message': 'hello'}),
				{'_id': 2, 'message': 'world'}
			]

			expect(dto.nested_dto_array[0]).toBeInstanceOf(TestNestedDTO)
			expect(dto.nested_dto_array[0])._id = 1
			expect(dto.nested_dto_array[0]).message = 'hello'
			expect(dto.nested_dto_array[1]).toBeInstanceOf(TestNestedDTO)
			expect(dto.nested_dto_array[1])._id = 2
			expect(dto.nested_dto_array[1]).message = 'world'
		})

		it('should convert object values to DTO subType', () => {
			let dto = new TestDTO()
			dto.nested_dto_dictionary = {
				'a': new TestNestedDTO({'_id': 1, 'message': 'hello'}),
				'b': {'_id': 2, 'message': 'world'}
			}

			expect(dto.nested_dto_dictionary['a']).toBeInstanceOf(TestNestedDTO)
			expect(dto.nested_dto_dictionary['a'])._id = 1
			expect(dto.nested_dto_dictionary['a']).message = 'hello'
			expect(dto.nested_dto_dictionary['b']).toBeInstanceOf(TestNestedDTO)
			expect(dto.nested_dto_dictionary['b'])._id = 2
			expect(dto.nested_dto_dictionary['b']).message = 'world'
		})
	})
})

describe('isDTO', () => {
	class TestDTO extends BaseDTO{
		static fields = ['test']
	}

	class TestDTO2 extends TestDTO{
		static fields = ['test', 'test_2']
	}

	it('should detect a subclass as a DTO', () => {
		expect(isDTO(TestDTO)).toBeTrue()
	})

	it('should detect an instance of a subclass as a DTO', () => {
		let subclassInstance = new TestDTO()

		expect(isDTO(subclassInstance)).toBeTrue()
	})

	it('should detect an instance of a multi-level subclass as a DTO', () => {
		let subclassInstance = new TestDTO2()

		expect(isDTO(subclassInstance)).toBeTrue()
	})
})
