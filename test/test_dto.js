const DTO = require('../src/base_dto')

describe('DTO', () => {
	describe('lifecycle', () => {
		let dto
		let id = 'test-id'
		let rev = 'test-rev'

		it('should be built from a JavaScript Object', () => {
			dto = new DTO({id, rev})

			expect(dto.id).toEqual(id)
			expect(dto.rev).toEqual(rev)
		})

		it('should be able to be converted back to a JavaScript Object', () => {
			let object = dto.toJSON()

			expect(object['id']).toEqual(id)
			expect(object['rev']).toEqual(rev)
		})
	})
})
