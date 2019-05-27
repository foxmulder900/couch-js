const {BaseDTO, FunctionSource} = require('./base_dto')

class DesignDocDTO extends BaseDTO {

	static getFields(){
		return [
			'_id', '_rev', 'name', 'language', 'validate_doc_update',
			{name: 'options', type: Object},
			{name: 'filters', type: Object, subType: FunctionSource},
			{name: 'lists', type: Object, subType: FunctionSource},
			{name: 'rewrites', type: Array, subType: FunctionSource},
			{name: 'shows', type: Object, subType: FunctionSource},
			{name: 'updates', type: Object, subType: FunctionSource},
			{name: 'views', type: Object, subType: ViewDTO}
		]
	}

	addView(name, map, reduce){
		this.views = this.views || {}
		this.views[name] = new ViewDTO({map, reduce})
	}

}

class ViewDTO extends BaseDTO {

	static getFields(){
		return [
			{name: 'map', type: FunctionSource},
			{name: 'reduce', type: FunctionSource}
		]
	}

}

module.exports = {
	DesignDocDTO,
	ViewDTO
}