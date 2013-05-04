define(function(){

	var Book=Backbone.Model.extend({
    //default attributes 
		defaults:{
			id:"",
			name:'',
			category:''
		}
	});

	return Book;
});

