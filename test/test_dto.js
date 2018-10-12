const DTO = require('../src/base_dto')

describe('DTO', () => {
	describe('lifecycle', () => {
		let dto
		let _id = 'test-id'
		let _rev = 'test-rev'

		it('should be built from a JavaScript Object', () => {
			dto = new DTO({_id, _rev})

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
