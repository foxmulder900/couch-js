const BaseDto = require('../src/base_dto')

class TestDto extends BaseDto {
	static getFields(){
		return ['_id', '_rev']
	}
}

describe('BaseDto', () => {
	describe('lifecycle', () => {
		let dto
		let _id = 'test-id'
		let _rev = 'test-rev'

		it('should be built from a JavaScript Object', () => {
			dto = new TestDto({_id, _rev})

			expect(dto._id).toEqual(_id)
			expect(dto._rev).toEqual(_rev)
		})

		it('should be able to be converted back to a JavaScript Object', () => {
			let object = dto.toJSON()

			expect(object['_id']).toEqual(_id)
			expect(object['_rev']).toEqual(_rev)
		})
	})
})
