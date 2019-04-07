const BaseDto = require('../src/base_dto')

class TestDto extends BaseDto{
	static getFields(){
		return[
			'_id',
			'_rev',
			'number_as_string',
			'float_as_string',
			{name: 'boolean_value_true', type: Boolean},
			{name: 'boolean_value_false', type: Boolean},
			{name: 'typed_number', type: Number},
			{name: 'typed_number_float', type: Number},
			{name: 'nested_dto', type: TestNestedDto},
			{name: 'nested_dto_array', type: Array, subType: TestNestedDto},
			{name: 'nested_dto_dictionary', type: Object, subType: TestNestedDto}
		]
	}
}

class TestNestedDto extends BaseDto{
	static getFields(){
		return['message']
	}
}

describe('BaseDto', () => {
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
			dto = new TestDto({_id,
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

			expect(dto.nested_dto).toEqual(jasmine.any(TestNestedDto))
			expect(dto.nested_dto.message).toEqual(nested_dto.message)
			expect(dto.nested_dto_array[0]).toEqual(jasmine.any(TestNestedDto))
			expect(dto.nested_dto_array[0].message).toEqual(nested_dto_array[0].message)
			expect(dto.nested_dto_array[1]).toEqual(jasmine.any(TestNestedDto))
			expect(dto.nested_dto_array[1].message).toEqual(nested_dto_array[1].message)
			expect(dto.nested_dto_dictionary['three']).toEqual(jasmine.any(TestNestedDto))
			expect(dto.nested_dto_dictionary['three'].message).toEqual(nested_dto_dictionary['three'].message)
		})

		it('should gracefully handle JSON with missing fields', () => {
			let dto_with_defaults = new TestDto({_id, _rev})

			expect(dto_with_defaults.nested_dto).toEqual(jasmine.any(TestNestedDto))
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
	})
})
