const BaseDTO = require('./base_dto').BaseDTO

class ViewDTO extends BaseDTO{
	static fields = [
		'map', 'reduce'
	]
}

class DesignDocDTO extends BaseDTO{
	static fields = [
		'_id', '_rev', 'name', 'language', 'validate_doc_update',
		{name: 'options', type: Object},
		{name: 'filters', type: Object},
		{name: 'lists', type: Object},
		{name: 'rewrites', type: Array},
		{name: 'shows', type: Object},
		{name: 'updates', type: Object},
		{name: 'views', type: Object, subType: ViewDTO}
	]

	addUpdate(name, updateFunction){
		this.updates = this.updates || {}
		this.updates[name] = updateFunction.toString()
	}

	addView(name, map, reduce){
		this.views = this.views || {}
		this.views[name] = new ViewDTO({
			map: map ? map.toString() : map,
			reduce: reduce ? reduce.toString() : reduce
		})
	}

	addShow(name, showFunction){
		console.warning('CouchDB show functions are deprecated.')
		this.shows = this.shows || {}
		this.shows[name] = showFunction.toString()
	}
}

module.exports = {
	DesignDocDTO,
	ViewDTO
}
