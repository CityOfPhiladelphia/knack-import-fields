/**
 * Loads an "import fields" page that interacts with sde-metadata-api
 * https://github.com/cityofphiladelphia/sde-metadata-api
 */
var searchTemplate = [
  '<form class="search" id="layerForm">',
  '<input name="layerName" id="layerName" type="text" placeholder="Search by layer name">',
  '<input type="submit">',
  '</form>',
  '<div id="layerFormStatus" class="kn-message" style="display: none"></div>'
].join('')

var fieldTypes = Knack.objects.get('object_5').fields.get('field_165').attributes.format.options
var typeMap = {
  'Blob': 'Other',
  'Date': 'Date',
  'Double': 'Numeric',
  'Geometry': 'Other',
  'Guid': 'GlobalID',
  'Integer': 'Integer',
  'OID': 'Integer',
  'Raster': 'Other',
  'Single': 'Numeric',
  'SmallInteger': 'Integer',
  'String': 'Text'
}

function generateOptions(val) {
  var options = []
  var mappedType = typeMap[val] || ''
  
  fieldTypes.forEach(function(fieldType) {
    var selected = fieldType === mappedType ? ' selected="selected"' : ''
    options.push('<option value="' + fieldType + '"' + selected + '>' + fieldType + '</option>')
  })
  return options.join('')
}

function generateFieldTable(fields) {
  var markup = [
    '<form id="fieldsForm">',
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
          '<td><input type="text" name="name" value="' + field.name + '"></td>',
          '<td><input type="text" name="alias" value="' + field.aliasName + '"></td>',
          '<td>',
      		'<select name="type">',
      		  generateOptions(field.type),
      		'</select>',
      	  '</td>',
          '<td><input type="text" name="description"></td>',
        '</tr>'
    ])
  })
  
  markup = markup.concat([
        '</tbody>',
      '</table>',
      '<input type="submit">',
    '</form>'
  ])
                          
  return markup.join('')
}

$(document).on('knack-scene-render.scene_124', function(event, view, data) {
  $('#view_245').empty().append(searchTemplate)
  
  // Listen to the submission of the search form
  $('#layerForm').on('submit', function(e) {
    var layerName = e.currentTarget.layerName.value
    Knack.showSpinner()
    
    // Query the sde-metadata-api with the search input
    $.ajax({
      url: 'https://api.phila.gov/sde-metadata-api/v1/feature-classes/' + layerName,
      dataType: 'json',
      success: function(data) {
      	Knack.hideSpinner()
        $('#layerFormStatus').css('display', 'none')
        var markup = generateFieldTable(data.fields)
        $('#view_247').empty().append(markup)
      },
      error: function(xhr, status, msg) {
        $('#layerFormStatus').html('<p>Error: ' + msg + '</p>').css('display', 'inline-block')
       	Knack.hideSpinner()
      }
    })
    
    e.preventDefault()
  })

  // Listen to the submission of the fields table form
  $('#view_247').on('submit', '#fieldsForm', function(e) {
    // Cleverly construct an array of field objects from the form data
    var fields = []
    ;['name', 'alias', 'type', 'description'].forEach(function(attr) {
      ;[].forEach.call(e.currentTarget[attr], function(element, index) {
        if( ! fields[index]) fields[index] = {}
        fields[index][attr] = element.value
      })
    })
    console.log('submitted', fields)
    e.preventDefault()
  })
})