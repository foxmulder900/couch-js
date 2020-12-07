const {DesignDocDTO} = require('../src/design_doc_dto')

describe('DesignDocDTO', () => {
	it('properly serializes functions', () => {
		let dto = new DesignDocDTO()

		/* eslint-disable brace-style, no-undef */
		dto.addView('test_view', function(doc){ emit(doc._id) })
		/* eslint-disable brace-style, no-undef */

		expect(dto.toJSON().views.test_view.map).toEqual('function(doc){ emit(doc._id) }')
	})
})
