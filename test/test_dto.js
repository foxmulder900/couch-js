const BaseDto = require('../src/base_dto')

class TestDto extends BaseDto {
	static getFields(){
		return [
			'_id',
			'_rev',
			{name: 'nested_dto', type: TestNestedDto},
			{name: 'nested_dto_array', type: Array, subType: TestNestedDto}
		]
	}
}

class TestNestedDto extends BaseDto {
	static getFields(){
		return ['message']
	}
}

describe('BaseDto', () => {
	describe('lifecycle', () => {
		let dto
		let _id = 'test-id'
		let _rev = 'test-rev'
		let nested_dto = {message: 'Hello world!'}
		let nested_dto_array = [{message: 'numba one'}, {message: 'numba two'}]

		it('should be built from a JavaScript Object', () => {
			dto = new TestDto({_id, _rev, nested_dto, nested_dto_array})

			expect(dto._id).toEqual(_id)
			expect(dto._rev).toEqual(_rev)
			expect(dto.nested_dto).toEqual(jasmine.any(TestNestedDto))
			expect(dto.nested_dto.message).toEqual(nested_dto.message)
			expect(dto.nested_dto_array[0]).toEqual(jasmine.any(TestNestedDto))
			expect(dto.nested_dto_array[0].message).toEqual(nested_dto_array[0].message)
			expect(dto.nested_dto_array[1]).toEqual(jasmine.any(TestNestedDto))
			expect(dto.nested_dto_array[1].message).toEqual(nested_dto_array[1].message)
		})

		it('should gracefully handle JSON with missing fields', () => {
			let dto_with_defaults = new TestDto({_id, _rev})

			expect(dto_with_defaults.nested_dto).toEqual(undefined)
			expect(dto_with_defaults.nested_dto_array).toEqual([])
		})

		it('should be able to be converted back to a JavaScript Object', () => {
			let object = dto.toJSON()

			expect(object['_id']).toEqual(_id)
			expect(object['_rev']).toEqual(_rev)
			expect(object['nested_dto']).toEqual(nested_dto)
			expect(object['nested_dto_array']).toEqual(nested_dto_array)
		})
	})
})
