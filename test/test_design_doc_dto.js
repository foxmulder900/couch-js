const {DesignDocDTO} = require('../src/design_doc_dto')

class TestDesignDocDTO extends DesignDocDTO{}

describe('DesignDocDTO', () => {
	it('properly serializes functions', () => {
		let dto = new TestDesignDocDTO()

		dto.addView('test_view', function(doc){emit(doc._id)})

		expect(dto.toJSON().views.test_view.map).toEqual('function(doc){emit(doc._id)}')
	})
})
