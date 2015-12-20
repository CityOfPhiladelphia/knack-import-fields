/**
 * Loads an "import fields" page that interacts with sde-metadata-api
 * https://github.com/cityofphiladelphia/sde-metadata-api
 */
var importConfig = {
  fieldObject: 'object_5',
  fieldObjectFields: {
    name: 'field_17',
    alias: 'field_188',
    type: 'field_165',
    description: 'field_20',
    dataset: 'field_21'
  },
  addFieldScene: 'scene_125',
  addFieldView: 'view_246',
  importScene: 'scene_124',
  importSearchView: 'view_245',
  importTableView: 'view_247',
  apiHost: 'https://api.phila.gov/sde-metadata-api/v1/',
  typeMap: {
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
}

var searchTemplate = [
  '<form class="search" id="layerForm">',
  '<input name="layerName" id="layerName" type="text" placeholder="Search by layer name">',
  '<input type="submit">',
  '</form>',
  '<div id="layerFormStatus" class="kn-message" style="display: none"></div>'
].join('')

var fieldTypes = Knack.objects.get(importConfig.fieldObject).fields.get(importConfig.fieldObjectFields.type).attributes.format.options

function generateOptions (val) {
  var options = []
  var mappedType = importConfig.typeMap[val] || ''

  fieldTypes.forEach(function (fieldType) {
    var selected = fieldType === mappedType ? ' selected="selected"' : ''
    options.push('<option value="' + fieldType + '"' + selected + '>' + fieldType + '</option>')
  })
  return options.join('')
}

function generateFieldTable (fields) {
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

  fields.forEach(function (field) {
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

function submitFields (fields) {
  var pending = 0
  Knack.showSpinner()

  function checkIfDone () {
    if (pending < 1) {
      Knack.hideSpinner()
    }
  }

  fields.forEach(function (field) {
    pending++

    field[importConfig.fieldObjectFields.dataset] = Knack.hash_id

    var url = [
      'https://api.knackhq.com/v1/scenes/',
      importConfig.addFieldScene,
      '/views/',
      importConfig.addFieldView,
      '/records/'
    ].join('')

    $.ajax({
      url: url,
      type: 'POST',
      data: JSON.stringify(field),
      contentType: 'application/json',
      headers: {
        'Authorization': Knack.getUserToken(),
        'X-Knack-Application-Id': Knack.application_id,
        'X-Knack-REST-API-Key': 'knack'
      },
      complete: function () {
        pending--
        checkIfDone()
      }
    })
  })
}

$(document).on('knack-scene-render.' + importConfig.importScene, function (event, view, data) {
  $('#' + importConfig.importSearchView).empty().append(searchTemplate)

  // Listen to the submission of the search form
  $('#layerForm').on('submit', function (e) {
    var layerName = e.currentTarget.layerName.value
    Knack.showSpinner()

    // Query the sde-metadata-api with the search input
    $.ajax({
      url: importConfig.apiHost + '/feature-classes/' + layerName,
      dataType: 'json',
      success: function (data) {
        Knack.hideSpinner()
        $('#layerFormStatus').css('display', 'none')
        var markup = generateFieldTable(data.fields)
        $('#' + importConfig.importTableView).empty().append(markup)
      },
      error: function (xhr, status, msg) {
        $('#layerFormStatus').html('<p>Error: ' + msg + '</p>').css('display', 'inline-block')
        Knack.hideSpinner()
      }
    })

    e.preventDefault()
  })

  // Listen to the submission of the fields table form
  $('#' + importConfig.importTableView).on('submit', '#fieldsForm', function (e) {
    // Cleverly construct an array of field objects from the form data
    var fields = []
      ;['name', 'alias', 'type', 'description'].forEach(function (attr) {
        ;[].forEach.call(e.currentTarget[attr], function (element, index) {
          if (!fields[index]) fields[index] = {}
          var fieldObjectField = importConfig.fieldObjectFields[attr]
          fields[index][fieldObjectField] = element.value
        })
      })
    submitFields(fields)
    e.preventDefault()
  })
})
