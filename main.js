$(document).on('knack-scene-render.scene_124', function(event, view, data) {
  console.log('import fields page')
  var searchTemplate = [
    '<form class="search" id="layerForm">',
	  '<input name="layerName" id="layerName" type="text" placeholder="Search by layer name">',
	  '<input type="submit">',
	'</form>'
  ].join('')
  $('#view_245').empty().append(searchTemplate)
  $('#layerForm').on('submit', function(e) {
    var layerName = e.currentTarget.layerName.value
    console.log('searched', layerName)
    Knack.showSpinner()
    
    $.ajax({
      url: 'https://api.phila.gov/sde-metadata-api/v1/feature-classes/' + layerName,
      dataType: 'json',
      success: function(data) {
      	Knack.hideSpinner()
        var markup = generateFieldTable(data.fields)
        $('#view_245').append(markup)
      },
      error: function() {
      	console.error(error, arguments)
       	Knack.hideSpinner()
      }
    })
    
    
    e.preventDefault()
  })
})

function generateFieldTable(fields) {
  var markup = [
    '<table class="table">',
      '<thead>',
        '<tr>',
          '<th>Name</th>',
          '<th>Alias</th>',
          '<th>Type</th>',
          '<th>Description</th>',
        '</tr>',
      '</thead>',
   	  '<tbody>'
  ]
  
  fields.forEach(function(field) {
    markup = markup.concat([
        '<tr>',
          '<td>' + field.name + '</td>',
          '<td>' + field.aliasName + '</td>',
          '<td>' + field.type + '</td>',
          '<td></td>',
        '</tr>'
    ])
  })
  
  markup = markup.concat([
      '</tbody>',
    '</table>'
  ])
                          
  return markup.join('')
}